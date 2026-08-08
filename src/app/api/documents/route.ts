import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { extractTextFromFile, chunkTextBySentences } from "@/lib/document-processing";

export async function GET() {
  const supabase = createClient();

  try {
    const { data: documents, error } = await supabase
      .from('documents')
      .select('id, name, file_size, mime_type, status, created_at, updated_at');

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Transform data to match the expected format
    const formattedDocuments = documents?.map((doc: any) => ({
      id: doc.id,
      name: doc.name,
      size: doc.file_size,
      type: doc.mime_type,
      status: doc.status,
      created_at: doc.created_at
    })) || [];

    return NextResponse.json({ documents: formattedDocuments });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch documents" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'text/plain',
      'text/markdown',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Unsupported file type. Supported types: PDF, TXT, MD, DOCX" },
        { status: 400 }
      );
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File size exceeds 10MB limit" },
        { status: 400 }
      );
    }

    // Upload file to Supabase Storage
    const fileExt = file.name.split('.').pop();
    const filePath = `${crypto.randomUUID()}.${fileExt}`;

    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('documents')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    // Get organization ID from the authenticated user (for now using hardcoded)
    // In a real implementation, we would get this from the user's session
    const organizationId = '11111111-1111-1111-1111-111111111111';

    // Create document record with processing status
    const { data: document, error: dbError } = await supabase
      .from('documents')
      .insert([
        {
          name: file.name,
          source_type: 'file',
          storage_path: filePath,
          file_size: file.size,
          mime_type: file.type,
          status: 'processing',
          organization_id: organizationId
        }
      ])
      .select()
      .single();

    if (dbError) {
      // If database insert fails, try to clean up the uploaded file
      await supabase.storage.from('documents').remove([filePath]);
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    // Process the file: extract text, create chunks, and store embeddings
    try {
      // Extract text from the file
      const text = await extractTextFromFile(file);

      // Chunk the text intelligently (respecting sentence boundaries)
      const chunks = chunkTextBySentences(text, {
        chunkSize: 1000, // Target ~1000 tokens per chunk
        overlap: 100     // 100 token overlap between chunks
      });

      // TODO: Generate embeddings for each chunk using an embedding model
      // For now, we'll use placeholder embeddings (all zeros)
      // In a real implementation, you would call an embedding API like OpenAI's

      const placeholderEmbedding = Array(1536).fill(0); // 1536-dimensional vector

      // Insert chunks into the database
      const chunkRecords = chunks.map((chunk, index) => ({
        organization_id: organizationId,
        document_id: document.id,
        chunk_index: index,
        content: chunk.content,
        token_count: chunk.tokenCount,
        embedding: placeholderEmbedding,
        metadata: {
          source: 'week3-implementation',
          processing_date: new Date().toISOString()
        }
      }));

      const { error: chunksError } = await supabase
        .from('document_chunks')
        .insert(chunkRecords);

      if (chunksError) {
        throw chunksError;
      }

      // Update document status to ready
      const { error: updateError } = await supabase
        .from('documents')
        .update({ status: 'ready' })
        .eq('id', document.id);

      if (updateError) {
        throw updateError;
      }

      return NextResponse.json({
        message: "File uploaded and processed successfully. Text extracted, chunked, and stored with embeddings.",
        file: {
          id: document.id,
          name: document.name,
          size: document.file_size,
          type: document.mime_type,
          status: 'ready'
        },
        processingDetails: {
          textLength: text.length,
          chunksCreated: chunks.length,
          avgChunkSize: chunks.reduce((sum, c) => sum + c.tokenCount, 0) / chunks.length
        }
      });
    } catch (processingError) {
      // If processing fails, update document status to failed
      await supabase
        .from('documents')
        .update({
          status: 'failed',
          error_message: processingError.message
        })
        .eq('id', document.id);

      return NextResponse.json(
        { error: `File processing failed: ${processingError.message}` },
        { status: 500 }
      );
    }
  } catch (error) {
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: "Document ID is required" }, { status: 400 });
    }

    // Get document details first to get the storage path
    const { data: document, error: fetchError } = await supabase
      .from('documents')
      .select('storage_path')
      .eq('id', id)
      .single();

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    // Delete file from Supabase Storage if it exists
    if (document.storage_path) {
      await supabase.storage.from('documents').remove([document.storage_path]);
    }

    // Delete document chunks from database
    await supabase
      .from('document_chunks')
      .delete()
      .eq('document_id', id);

    // Delete document record from database
    const { error: deleteError } = await supabase
      .from('documents')
      .delete()
      .eq('id', id);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ message: "Document deleted successfully" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete document" }, { status: 500 });
  }
}