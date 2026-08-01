import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const payload = await request.text();
    console.log("Stripe webhook received, body length:", payload.length);
    // Stripe webhook validation will be added in Week 6 (Day 33)
    return NextResponse.json({
      received: true,
      message: "Mock Stripe webhook received successfully. Signature verification logic will be built in Week 6."
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Webhook processing failed";
    return NextResponse.json({ error: errorMessage }, { status: 400 });
  }
}
