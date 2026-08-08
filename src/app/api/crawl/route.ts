import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { chunkTextBySentences, generateEmbedding } from "@/lib/document-processing";

export async function POST(request: Request) {
  try {
    const { url } = await request.json();
    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return NextResponse.json({ error: "Invalid URL format" }, { status: 400 });
    }

    // Fetch the webpage content
    const response = await fetch(url);
    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch URL: ${response.status} ${response.statusText}` },
        { status: 400 }
      );
    }

    // Get the text content (simplified - in reality we'd parse HTML properly)
    const html = await response.text();

    // Simple HTML to text conversion (removing tags)
    // In a production app, you'd use a proper HTML parser like cheerio
    const text = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove scripts
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')   // Remove styles
      .replace(/<[^>]*>/g, ' ')                                          // Remove HTML tags
      .replace(/\s+/g, ' ')                                              // Normalize whitespace
      .trim();

    if (!text) {
      return NextResponse.json({ error: "No text content extracted from URL" }, { status: 400 });
    }

    // Get organization ID from authenticated user
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    const organizationId = profile?.organization_id;

    if (!organizationId) {
      return NextResponse.json({ error: "Profile not found" }, { status: 400 });
    }

    // Create a document record for the crawled content
    const { data: document, error: docError } = await supabase
      .from('documents')
      .insert([
        {
          name: new URL(url).hostname,
          source_type: 'url',
          source_url: url,
          file_size: text.length,
          mime_type: 'text/html',
          status: 'processing',
          organization_id: organizationId
        }
      ])
      .select()
      .single();

    if (docError) {
      return NextResponse.json({ error: docError.message }, { status: 500 });
    }

    // Chunk the text
    const chunks = chunkTextBySentences(text, {
      chunkSize: 800,  // Slightly smaller chunks for web content
      overlap: 100
    });

    // Generate embeddings for each chunk using NVIDIA NIM
    const chunksWithEmbeddings = [];
    for (const [index, chunk] of chunks.entries()) {
      try {
        const embedding = await generateEmbedding(chunk.content);
        chunksWithEmbeddings.push({
          organization_id: organizationId,
          document_id: document.id,
          chunk_index: index,
          content: chunk.content,
          token_count: chunk.tokenCount,
          embedding: embedding,
          metadata: {
            source: 'url-crawler',
            sourceUrl: url,
            crawlDate: new Date().toISOString()
          }
        });
      } catch (embedError) {
        console.error(`Failed to embed chunk ${index}:`, embedError);
        // Continue with other chunks - we'll mark document as partially failed later
      }
    }

    // Insert all chunks with embeddings
    if (chunksWithEmbeddings.length > 0) {
      const { error: chunksError } = await supabase
        .from('document_chunks')
        .insert(chunksWithEmbeddings);

      if (chunksError) throw chunksError;
    }

    // Update document status based on processing success
    const finalStatus = chunksWithEmbeddings.length > 0 ? 'ready' : 'failed';
    const { error: updateError } = await supabase
      .from('documents')
      .update({
        status: finalStatus,
        ...(finalStatus === 'failed' && { error_message: 'Failed to generate embeddings for any chunks' })
      })
      .eq('id', document.id);

    if (updateError) throw updateError;

    return NextResponse.json({
      message: `Successfully crawled and processed "${url}"`,
      document: {
        id: document.id,
        name: document.name,
        url: document.source_url,
        status: finalStatus
      },
      processingDetails: {
        textLength: text.length,
        chunksCreated: chunks.length,
        chunksWithEmbeddings: chunksWithEmbeddings.length,
        avgChunkSize: chunksWithEmbeddings.length > 0
          ? chunksWithEmbeddings.reduce((sum, c) => sum + c.token_count, 0) / chunksWithEmbeddings.length
          : 0
      }
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Crawling failed";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
