import { NextResponse } from "next/server";
import { synthesizeSpeechWithElevenLabs } from "@/lib/elevenlabs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { text, voiceId } = body;

    if (!text) {
      return NextResponse.json(
        { error: "Text payload is required for speech synthesis." },
        { status: 400 }
      );
    }

    const result = await synthesizeSpeechWithElevenLabs({ text, voiceId });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to synthesize voice", details: String(error) },
      { status: 500 }
    );
  }
}
