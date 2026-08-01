import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { message } = await request.json();
    return NextResponse.json({
      answer: `This is a mock RAG answer to your question: "${message || "no message provided"}". Full AI processing will be set up in Week 4.`,
      citations: [
        { source: "user-guide.md", text: "Mock snippet mapping to your query" }
      ],
      confidence: 0.95
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Invalid request";
    return NextResponse.json({ error: errorMessage }, { status: 400 });
  }
}
