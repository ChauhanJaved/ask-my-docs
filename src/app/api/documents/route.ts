import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET() {
  const supabase = createClient();

  try {
    const { data: documents, error } = await supabase
      .from('documents')
      .select('id, name, size, type, status')
      .eq('status', 'ready');

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Transform data to match the expected format
    const formattedDocuments = documents?.map(doc => ({
      id: doc.id,
      name: doc.name,
      size: doc.size,
      type: doc.type,
      status: doc.status
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

    // In a real implementation, we would:
    // 1. Upload the file to Supabase Storage
    // 2. Create a document record
    // 3. Trigger background processing

    // For now, we'll create a mock document record
    const { data: document, error } = await supabase
      .from('documents')
      .insert([
        {
          name: file.name,
          source_type: 'file',
          file_size: file.size,
          mime_type: file.type,
          status: 'processing', // Will be updated by background process
          organization_id: '11111111-1111-1111-1111-111111111111' // Hardcoded for demo
        }
      ])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      message: "File uploaded successfully. Background processing will extract text and create embeddings.",
      file: {
        id: document.id,
        name: document.name,
        size: document.file_size,
        type: document.mime_type,
        status: document.status
      }
    });
  } catch (error) {
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}