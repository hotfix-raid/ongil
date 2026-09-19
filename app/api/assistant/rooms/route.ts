import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, SESSION_COOKIE } from "@/src/lib/auth/session";
import { AssistantDatabaseError, logAssistantError } from "@/src/lib/assistant/errors";
import { listAssistantRooms } from "@/src/lib/assistant/store";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const errorId = crypto.randomUUID();
  try {
    const user = await getSessionUser(request.cookies.get(SESSION_COOKIE)?.value);
    if (!user) return NextResponse.json({ error: "Login required" }, { status: 401 });
    const rawLimit = request.nextUrl.searchParams.get("limit");
    const limit = rawLimit === null ? 20 : Number(rawLimit);
    if (!Number.isSafeInteger(limit) || limit < 1 || limit > 50) {
      return NextResponse.json({ error: "limit must be an integer between 1 and 50" }, { status: 400 });
    }
    const result = await listAssistantRooms(user.id, request.nextUrl.searchParams.get("cursor"), limit);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error && (error.message === "cursor is invalid" || /must be a valid UUID/.test(error.message))) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof AssistantDatabaseError) {
      logAssistantError(errorId, "rooms", error);
      return NextResponse.json({ error: "Assistant rooms are unavailable", errorId }, { status: 502 });
    }
    logAssistantError(errorId, "rooms", error);
    return NextResponse.json({ error: "Assistant rooms request failed", errorId }, { status: 500 });
  }
}
