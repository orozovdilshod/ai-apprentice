import { NextRequest, NextResponse } from "next/server";
import { generateSpeechAudioBuffer } from "@/lib/elevenlabs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { text } = body || {};

    if (!text || typeof text !== "string" || !text.trim()) {
      return NextResponse.json(
        { error: "Valid text is required to synthesize speech" },
        { status: 400 }
      );
    }

    const audioBuffer = await generateSpeechAudioBuffer({
      text: text.trim(),
    });

    return new Response(audioBuffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": audioBuffer.byteLength.toString(),
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to synthesize speech";
    console.error("Error in /api/voice/speak:", errorMessage);

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
