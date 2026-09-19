import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, SESSION_COOKIE } from "@/src/lib/auth/session";
import { AssistantDatabaseError, logAssistantError } from "@/src/lib/assistant/errors";
import { deleteAssistantRoom } from "@/src/lib/assistant/store";

export const runtime = "nodejs";

function sameOrigin(request: NextRequest): boolean {
  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite === "cross-site") return false;
  const candidate = request.headers.get("origin") ?? request.headers.get("referer");
  if (!candidate) return fetchSite === "same-origin";
  try {
    return new URL(candidate).origin === new URL(request.url).origin || fetchSite === "same-origin";
  } catch {
    return fetchSite === "same-origin";
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const errorId = crypto.randomUUID();
  try {
    if (!sameOrigin(request)) return NextResponse.json({ error: "Same-origin request required", errorId }, { status: 403 });
    const user = await getSessionUser(request.cookies.get(SESSION_COOKIE)?.value);
    if (!user) return NextResponse.json({ error: "Login required" }, { status: 401 });
    const { roomId } = await params;
    const deleted = await deleteAssistantRoom(user.id, roomId);
    if (!deleted) return NextResponse.json({ error: "Assistant room not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && /must be a valid UUID/.test(error.message)) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof AssistantDatabaseError) {
      logAssistantError(errorId, "room_delete", error);
      return NextResponse.json({ error: "Assistant room deletion failed", errorId }, { status: 502 });
    }
    logAssistantError(errorId, "room_delete", error);
    return NextResponse.json({ error: "Assistant room deletion failed", errorId }, { status: 500 });
  }
}
