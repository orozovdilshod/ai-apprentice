import { NextResponse } from "next/server";
import { getSessionData, resetSession } from "@/lib/session-store";

export async function GET() {
  try {
    const session = getSessionData();
    return NextResponse.json(session);
  } catch (error: any) {
    console.error("Error fetching work-map session:", error);
    return NextResponse.json(
      { error: "Failed to fetch work map session data" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    if (body.action === "reset") {
      const reset = resetSession();
      return NextResponse.json(reset);
    }
    const session = getSessionData();
    return NextResponse.json(session);
  } catch (error: any) {
    console.error("Error updating work-map session:", error);
    return NextResponse.json(
      { error: "Failed to update work map session data" },
      { status: 500 }
    );
  }
}
