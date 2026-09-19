import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, SESSION_COOKIE } from "@/src/lib/auth/session";
import { AssistantDatabaseError, logAssistantError } from "@/src/lib/assistant/errors";
import { AssistantRoomNotFoundError, listAssistantMessages } from "@/src/lib/assistant/store";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const errorId = crypto.randomUUID();
  try {
    const user = await getSessionUser(request.cookies.get(SESSION_COOKIE)?.value);
    if (!user) return NextResponse.json({ error: "Login required" }, { status: 401 });
    const { roomId } = await params;
    const rawLimit = request.nextUrl.searchParams.get("limit");
    const limit = rawLimit === null ? 50 : Number(rawLimit);
    if (!Number.isSafeInteger(limit) || limit < 1 || limit > 100) {
      return NextResponse.json({ error: "limit must be an integer between 1 and 100" }, { status: 400 });
    }
    const result = await listAssistantMessages(user.id, roomId, request.nextUrl.searchParams.get("cursor"), limit);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof AssistantRoomNotFoundError) {
      return NextResponse.json({ error: "Assistant room not found" }, { status: 404 });
    }
    if (error instanceof Error && (error.message === "cursor is invalid" || /must be a valid UUID/.test(error.message))) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof AssistantDatabaseError) {
      logAssistantError(errorId, "messages", error);
      return NextResponse.json({ error: "Assistant messages are unavailable", errorId }, { status: 502 });
    }
    logAssistantError(errorId, "messages", error);
    return NextResponse.json({ error: "Assistant messages request failed", errorId }, { status: 500 });
  }
}
