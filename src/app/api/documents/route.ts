import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { extractTextFromFile, chunkTextBySentences, generateEmbedding } from "@/lib/document-processing";

interface DocumentRow {
  id: string;
  name: string;
  file_size: number;
  mime_type: string;
  status: string;
  created_at: string;
  updated_at: string;
}

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
    const formattedDocuments = documents?.map((doc: DocumentRow) => ({
      id: doc.id,
      name: doc.name,
      size: doc.file_size,
      type: doc.mime_type,
      status: doc.status,
      created_at: doc.created_at
    })) || [];

    return NextResponse.json({ documents: formattedDocuments });
  } catch (error) {
    console.error(error);
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

    const { error: uploadError } = await supabase
      .storage
      .from('documents')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    // Get organization ID from the authenticated user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      // Clean up uploaded file on auth failure
      await supabase.storage.from('documents').remove([filePath]);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    const organizationId = profile?.organization_id;

    if (!organizationId) {
      // Clean up uploaded file if no profile found
      await supabase.storage.from('documents').remove([filePath]);
      return NextResponse.json({ error: "Profile not found" }, { status: 400 });
    }

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

      // Generate embeddings for each chunk using NVIDIA NIM
      const chunkRecords = [];
      for (const [index, chunk] of chunks.entries()) {
        const embedding = await generateEmbedding(chunk.content);
        chunkRecords.push({
          organization_id: organizationId,
          document_id: document.id,
          chunk_index: index,
          content: chunk.content,
          token_count: chunk.tokenCount,
          embedding: embedding,
          metadata: {
            source: 'week4-nim-embedding',
            model: 'nvidia/nv-embedqa-e5-v5',
            processed_at: new Date().toISOString()
          }
        });
      }

      // Insert chunks into the database
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
          avgChunkSize: chunks.length > 0
            ? chunks.reduce((sum, c) => sum + c.tokenCount, 0) / chunks.length
            : 0
        }
      });
    } catch (processingError) {
      // If processing fails, update document status to failed
      const message = processingError instanceof Error ? processingError.message : String(processingError);
      await supabase
        .from('documents')
        .update({
          status: 'failed',
          error_message: message
        })
        .eq('id', document.id);

      return NextResponse.json(
        { error: `File processing failed: ${message}` },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error(error);
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
    console.error(error);
    return NextResponse.json({ error: "Failed to delete document" }, { status: 500 });
  }
}