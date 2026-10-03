import { NextRequest, NextResponse } from "next/server";
import { transcribeAudioWithElevenLabs } from "@/lib/elevenlabs";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json(
        { error: "Audio file is required in 'file' form field" },
        { status: 400 }
      );
    }

    const filename = (file as { name?: string }).name || "recording.webm";
    const result = await transcribeAudioWithElevenLabs({
      file,
      filename,
      modelId: "scribe_v2",
    });

    return NextResponse.json({
      text: result.text,
      language_code: result.language_code,
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to transcribe audio";
    console.error("Error in /api/voice/transcribe:", errorMessage);

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
