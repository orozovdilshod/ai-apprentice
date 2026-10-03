import { NextResponse } from "next/server";
import { analyzeObservationWithClaude } from "@/lib/anthropic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { transcript } = body;

    if (!transcript) {
      return NextResponse.json(
        { error: "Transcript payload is required." },
        { status: 400 }
      );
    }

    const result = await analyzeObservationWithClaude({ transcript });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to analyze observation session", details: String(error) },
      { status: 500 }
    );
  }
}
