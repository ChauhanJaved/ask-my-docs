import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { chunkTextBySentences } from "@/lib/document-processing";

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

    // Get organization ID (hardcoded for now)
    const organizationId = '11111111-1111-1111-1111-111111111111';

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

    // Generate placeholder embeddings (in reality, use an embedding model)
    const placeholderEmbedding = Array(1536).fill(0);

    // Insert chunks into the database
    const chunkRecords = chunks.map((chunk, index) => ({
      organization_id: organizationId,
      document_id: document.id,
      chunk_index: index,
      content: chunk.content,
      token_count: chunk.tokenCount,
      embedding: placeholderEmbedding,
      metadata: {
        source: 'url-crawler',
        sourceUrl: url,
        crawlDate: new Date().toISOString()
      }
    }));

    const { error: chunksError } = await supabase
      .from('document_chunks')
      .insert(chunkRecords);

    if (chunksError) {
      // Clean up document if chunk insertion fails
      await supabase.from('documents').delete().eq('id', document.id);
      return NextResponse.json({ error: chunksError.message }, { status: 500 });
    }

    // Update document status to ready
    const { error: updateError } = await supabase
      .from('documents')
      .update({ status: 'ready' })
      .eq('id', document.id);

    if (updateError) {
      // Note: We don't delete chunks here as they might be useful for debugging
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      message: `Successfully crawled and processed "${url}"`,
      document: {
        id: document.id,
        name: document.name,
        url: document.source_url,
        status: document.status
      },
      processingDetails: {
        textLength: text.length,
        chunksCreated: chunks.length,
        avgChunkSize: chunks.reduce((sum, c) => sum + c.tokenCount, 0) / chunks.length
      }
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Crawling failed";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
