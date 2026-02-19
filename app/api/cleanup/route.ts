import { NextResponse } from "next/server";
import { runNoteCleanup } from "@/app/actions/notes";

/**
 * GET /api/cleanup
 * Hard-deletes notes and stocks past the 90-day retention window.
 * Designed to be called by a daily cron job (e.g. Vercel Cron, GitHub Actions).
 *
 * Protect with a shared secret in production:
 *   Authorization: Bearer <CLEANUP_SECRET>
 */
export async function GET(request: Request) {
  const secret = process.env.CLEANUP_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const result = await runNoteCleanup();
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json({ error: "Cleanup failed" }, { status: 500 });
  }
}
