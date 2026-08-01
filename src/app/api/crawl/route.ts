import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { url } = await request.json();
    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    return NextResponse.json({
      message: `Successfully crawled "${url}" (mock). Crawler parsing logic will be built in Week 3.`,
      pagesCrawled: 1,
      chunksCreated: 5
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Crawling failed";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
