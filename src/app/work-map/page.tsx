import React from "react";
import { getSessionData } from "@/lib/session-store";
import { WorkMapClient } from "@/components/work-map/WorkMapClient";

// Revalidate or ensure dynamic rendering so updates are immediate
export const dynamic = "force-dynamic";

export default function WorkMapPage() {
  const sessionData = getSessionData();

  return <WorkMapClient initialSession={sessionData} />;
}
