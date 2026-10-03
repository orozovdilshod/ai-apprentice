/**
 * ElevenLabs Voice API Client Stub
 * 
 * SERVER-SIDE ONLY: Never import this file into Client Components ("use client").
 * When ready, populate ELEVENLABS_API_KEY in .env.local.
 */

export interface SynthesizeSpeechParams {
  text: string;
  voiceId?: string;
  modelId?: string;
}

export interface VoiceTrainingSessionConfig {
  scenarioId: string;
  personaName: string;
  voiceId: string;
  systemPrompt: string;
}

export async function synthesizeSpeechWithElevenLabs(
  params: SynthesizeSpeechParams
): Promise<{ audioUrl?: string; mockAudio: boolean; status: string }> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const voiceId = params.voiceId || process.env.ELEVENLABS_VOICE_ID || "21m00Tcm4TlvDq8ikWAM";

  if (!apiKey || apiKey === "your_elevenlabs_api_key_here") {
    // Return mock indicator for the UI to play simulated audio wave
    return {
      mockAudio: true,
      status: "mock_generated",
    };
  }

  // Real ElevenLabs API call pattern (ready to activate)
  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
          Accept: "audio/mpeg",
        },
        body: JSON.stringify({
          text: params.text,
          model_id: params.modelId || "eleven_monolingual_v1",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`ElevenLabs API error: ${response.statusText}`);
    }

    return {
      mockAudio: false,
      status: "success",
    };
  } catch (error) {
    console.error("Error calling ElevenLabs API:", error);
    throw error;
  }
}

export async function generateSpeechAudioBuffer(params: {
  text: string;
  voiceId?: string;
  modelId?: string;
}): Promise<ArrayBuffer> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const voiceId = params.voiceId || process.env.ELEVENLABS_VOICE_ID || "21m00Tcm4TlvDq8ikWAM";
  const modelId = params.modelId || "eleven_turbo_v2_5";

  if (!apiKey || apiKey === "your_elevenlabs_api_key_here") {
    throw new Error("ELEVENLABS_API_KEY is not configured in .env.local");
  }

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text: params.text,
        model_id: modelId,
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`ElevenLabs API error (${response.status}): ${errorText}`);
  }

  return await response.arrayBuffer();
}

export interface TranscriptionResult {
  text: string;
  language_code: string;
}

export async function transcribeAudioWithElevenLabs(params: {
  file: Blob;
  filename?: string;
  modelId?: string;
}): Promise<TranscriptionResult> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const modelId = params.modelId || "scribe_v2";

  if (!apiKey || apiKey === "your_elevenlabs_api_key_here") {
    throw new Error("ELEVENLABS_API_KEY is not configured in .env.local");
  }

  const formData = new FormData();
  formData.append("file", params.file, params.filename || "audio.webm");
  formData.append("model_id", modelId);

  const response = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`ElevenLabs STT error (${response.status}): ${errorText}`);
  }

  const data = await response.json();

  return {
    text: (data.text || "").trim(),
    language_code: data.language_code || "eng",
  };
}
