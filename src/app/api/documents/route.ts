import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    documents: [
      { id: "1", name: "user-guide.md", size: 4500, type: "text/markdown", status: "ready" },
      { id: "2", name: "faq-sheet.pdf", size: 104800, type: "application/pdf", status: "ready" }
    ]
  });
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    
    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    return NextResponse.json({
      message: "File uploaded successfully (mock). Background processing pipeline will be implemented in Week 3.",
      file: {
        name: file.name,
        size: file.size,
        type: file.type
      }
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Upload failed";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
