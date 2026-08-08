import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { generateEmbedding } from "@/lib/document-processing";

interface MatchDocumentChunk {
  id: string;
  document_id: string;
  content: string;
}

export async function POST(request: Request) {
  try {
    const { message, sessionId } = await request.json();
    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: "Valid message string is required" }, { status: 400 });
    }
    const msg = message as string;

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get organization ID
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (profileError) throw profileError;
    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 400 });
    }

    // 1. Get relevant context via semantic search
    const queryEmbedding = await generateEmbedding(msg);
    const { data: contextChunks } = await supabase
      .rpc('match_documents', {
        query_embedding: queryEmbedding,
        match_count: 4,
        org_id: profile.organization_id
      });

    // 2. Construct RAG prompt
    const context = contextChunks
      .map((chunk: MatchDocumentChunk) => `[Source: ${chunk.document_id}] ${chunk.content}`)
      .join('\n\n');

    const systemPrompt = `You are a helpful AI assistant. Answer the user's question based ONLY on the provided context.
    If the context doesn't contain enough information to answer confidently, say you don't know.
    Always cite your sources using [Source: document_id] format.

    Context:
    ${context}`;

    // 3. Call NVIDIA NIM Chat API
    const chatResponse = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.NVIDIA_NIM_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "meta/llama-3.1-70b-instruct",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: msg }
        ],
        temperature: 0.7,
        max_tokens: 1024
      })
    });

    if (!chatResponse.ok) {
      const errorData = await chatResponse.json();
      throw new Error(`Chat API failed: ${errorData.detail?.message || chatResponse.statusText}`);
    }

    const chatData = await chatResponse.json();
    const answer = chatData.choices[0]?.message?.content || "Sorry, I couldn't generate a response.";

    // 4. Save conversation to memory
    let chatSessionId = sessionId;
    if (!sessionId) {
      const { data: session } = await supabase
        .from('chat_sessions')
        .insert({
          organization_id: profile.organization_id,
          visitor_id: crypto.randomUUID(),
          topic: msg.substring(0, 200),
          sentiment: 'neutral'
        })
        .select()
        .single();
      chatSessionId = session.id;
    }

    // Save user message
    await supabase.from('chat_messages').insert({
      chat_session_id: chatSessionId,
      organization_id: profile.organization_id,
      sender_type: 'user',
      content: msg,
      tokens_used: Math.round(msg.trim().split(/\s+/).length / 0.75),
      sources: JSON.stringify([])
    });

    // Save assistant message with sources
    await supabase.from('chat_messages').insert({
      chat_session_id: chatSessionId,
      organization_id: profile.organization_id,
      sender_type: 'assistant',
      content: answer,
      tokens_used: Math.round(answer.trim().split(/\s+/).length / 0.75),
      sources: JSON.stringify(
        contextChunks.map((chunk: MatchDocumentChunk) => ({
          document_id: chunk.id,
          content: chunk.content.substring(0, 100) + '...'
        }))
      )
    });

    return NextResponse.json({
      answer,
      sessionId: chatSessionId,
      sources: contextChunks.map((chunk: MatchDocumentChunk) => ({
        documentId: chunk.id,
        snippet: chunk.content.substring(0, 150) + '...'
      }))
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "An unknown error occurred" }, { status: 500 });
  }
}