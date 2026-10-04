import { NextResponse } from "next/server";

export async function GET() {
  let anthropicStatus: "connected" | "error" = "error";
  let elevenlabsStatus: "connected" | "error" = "error";

  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const elevenlabsKey = process.env.ELEVENLABS_API_KEY;

  // 1. Verify Anthropic API Key via lightweight GET /v1/models (zero token cost)
  if (anthropicKey && anthropicKey !== "your_anthropic_api_key_here") {
    try {
      const anthropicRes = await fetch("https://api.anthropic.com/v1/models", {
        method: "GET",
        headers: {
          "x-api-key": anthropicKey,
          "anthropic-version": "2023-06-01",
        },
      });

      if (anthropicRes.ok) {
        anthropicStatus = "connected";
      } else {
        // Try fallback check in case models listing has specific workspace restrictions
        const fallbackRes = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "x-api-key": anthropicKey,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
          },
          body: JSON.stringify({
            model: process.env.ANTHROPIC_MODEL || "claude-sonnet-5-5",
            max_tokens: 1,
            messages: [{ role: "user", content: "ping" }],
          }),
        });

        if (fallbackRes.ok || fallbackRes.status === 200) {
          anthropicStatus = "connected";
        } else {
          console.error("Anthropic auth failed status:", fallbackRes.status);
          anthropicStatus = "error";
        }
      }
    } catch {
      anthropicStatus = "error";
    }
  }

  // 2. Verify ElevenLabs API Key via lightweight GET /v1/voices or /v1/models (zero generation cost)
  if (elevenlabsKey && elevenlabsKey !== "your_elevenlabs_api_key_here") {
    try {
      // First try /v1/voices
      let elevenlabsRes = await fetch("https://api.elevenlabs.io/v1/voices", {
        method: "GET",
        headers: {
          "xi-api-key": elevenlabsKey,
        },
      });

      if (!elevenlabsRes.ok) {
        // Fallback to /v1/models
        elevenlabsRes = await fetch("https://api.elevenlabs.io/v1/models", {
          method: "GET",
          headers: {
            "xi-api-key": elevenlabsKey,
          },
        });
      }

      if (elevenlabsRes.ok) {
        elevenlabsStatus = "connected";
      } else {
        elevenlabsStatus = "error";
      }
    } catch {
      elevenlabsStatus = "error";
    }
  }

  return NextResponse.json({
    anthropic: anthropicStatus,
    elevenlabs: elevenlabsStatus,
  });
}
