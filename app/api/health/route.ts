import { NextResponse } from "next/server";

/**
 * Simplified for the privacy-first, no-database redesign — there is no
 * longer a database to check the connection of (see
 * docs/data-flow-inventory-pre-redesign.md and the final architecture
 * report). This now just confirms the server process itself is up,
 * which is still genuinely useful for uptime monitoring even with
 * nothing else behind it.
 */
export async function GET() {
  return NextResponse.json({ status: "ok", timestamp: new Date().toISOString() });
}
