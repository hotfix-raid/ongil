'use client';

import React, { FormEvent, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AlertCircle, ArrowUp, ExternalLink, LockKeyhole, MessageCircle, Plus, Sparkles, X } from "lucide-react";
import ReactMarkdown, { defaultUrlTransform, type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

interface AssistantTabProps {
  user: { id: string; name: string; avatarUrl: string } | null;
  onLoginClick: () => void;
  isRoomDrawerOpen: boolean;
  onRoomDrawerOpenChange: (open: boolean) => void;
  roomTriggerRef: React.RefObject<HTMLButtonElement | null>;
}

interface Source {
  title: string;
  url: string;
}

interface Message {
  id: string;
  roomId?: string;
  status?: "in_progress" | "complete" | "failed" | "cancelled";
  role: "user" | "assistant";
  text: string;
  sources?: Source[];
}

interface AssistantRoom {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  snippet: string | null;
}

const SUGGESTIONS = [
  "다음 주말 강원 삼척시에서 방문 혼잡도가 낮은 관광지 추천해줘",
  "강원도에서 반려견 동반 안내가 등록된 여행지 추천해줘",
  "강원 삼척시에서 휠체어 이동 편의 정보가 있는 관광지 알려줘",
  "유아·가족 편의 정보가 있는 강원도 산책 여행지 추천해줘",
  "강원도에서 2시간 이내에 걸을 수 있는 쉬운 해안 둘레길 추천해줘",
];

const MAX_QUESTION_LENGTH = 1200;
const STREAM_ERROR_NOTICE = "답변이 중간에 끊겼어요. 잠시 후 다시 시도해 주세요.";

const INITIAL_MESSAGE: Message = {
  id: "initial-assistant-message",
  role: "assistant",
  text: "안녕하세요. 온길 AI 어시스턴트예요. 걷기 여행지와 제공된 이동 편의 정보를 함께 찾아드릴게요.",
};

const MARKDOWN_COMPONENTS: Components = {
  h1: ({ children }) => <h1 className="text-sm font-bold">{children}</h1>,
  h2: ({ children }) => <h2 className="text-sm font-bold">{children}</h2>,
  h3: ({ children }) => <h3 className="text-xs font-bold">{children}</h3>,
  p: ({ children }) => <p>{children}</p>,
  ul: ({ children }) => <ul className="list-disc space-y-1 pl-5">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal space-y-1 pl-5">{children}</ol>,
  a: ({ children, href }) => href ? (
    <a href={href} target="_blank" rel="noreferrer noopener" className="font-semibold text-bento-green underline underline-offset-2 hover:text-bento-ink">
      {children}
    </a>
  ) : <>{children}</>,
  blockquote: ({ children }) => <blockquote className="border-l-2 border-bento-green/40 pl-3 text-bento-dark/65">{children}</blockquote>,
  code: ({ children }) => <code className="rounded bg-bento-bg px-1 py-0.5 text-[11px]">{children}</code>,
  table: ({ children }) => <div className="assistant-markdown-table-wrap"><table>{children}</table></div>,
  thead: ({ children }) => <thead>{children}</thead>,
  th: ({ children }) => <th scope="col">{children}</th>,
  td: ({ children }) => <td>{children}</td>,
};

function MarkdownMessage({ content }: { content: string }) {
  return (
    <div className="assistant-markdown space-y-2 break-words">
      <ReactMarkdown components={MARKDOWN_COMPONENTS} remarkPlugins={[remarkGfm]} skipHtml urlTransform={defaultUrlTransform}>
        {content}
      </ReactMarkdown>
    </div>
  );
}

function asText(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function normalizeSources(value: unknown): Source[] {
  if (!Array.isArray(value)) return [];
  return value.reduce<Source[]>((sources, item) => {
    const url = typeof item === "string" ? item : item && typeof item === "object"
      ? (item as { url?: unknown; href?: unknown; link?: unknown }).url ??
        (item as { href?: unknown }).href ?? (item as { link?: unknown }).link
      : null;
    if (typeof url !== "string" || !/^https?:\/\//i.test(url)) return sources;
    const rawTitle = typeof item === "object" && item !== null
      ? (item as { title?: unknown; name?: unknown; label?: unknown }).title ??
        (item as { name?: unknown }).name ?? (item as { label?: unknown }).label
      : null;
    sources.push({ title: asText(rawTitle) ?? "출처 보기", url });
    return sources;
  }, []);
}

function normalizeRoom(value: unknown): AssistantRoom | null {
  if (!value || typeof value !== "object") return null;
  const room = value as Record<string, unknown>;
  if (typeof room.id !== "string" || typeof room.title !== "string" ||
      typeof room.createdAt !== "string" || typeof room.updatedAt !== "string" ||
      (room.snippet !== null && typeof room.snippet !== "string")) return null;
  return {
    id: room.id,
    title: room.title,
    createdAt: room.createdAt,
    updatedAt: room.updatedAt,
    snippet: room.snippet as string | null,
  };
}

function normalizeStoredMessage(value: unknown): Message | null {
  if (!value || typeof value !== "object") return null;
  const message = value as Record<string, unknown>;
  if (typeof message.id !== "string" || typeof message.roomId !== "string" ||
      (message.role !== "user" && message.role !== "assistant") || typeof message.content !== "string") return null;
  const status = message.status;
  if (status !== "in_progress" && status !== "complete" && status !== "failed" && status !== "cancelled") return null;
  return {
    id: message.id,
    roomId: message.roomId,
    role: message.role,
    status,
    text: message.content,
    sources: normalizeSources(message.sources),
  };
}

export default function AssistantTab({ user, onLoginClick, isRoomDrawerOpen, onRoomDrawerOpenChange, roomTriggerRef }: AssistantTabProps) {
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [rooms, setRooms] = useState<AssistantRoom[]>([]);
  const [roomsLoading, setRoomsLoading] = useState(false);
  const [roomsError, setRoomsError] = useState("");
  const [roomsRefreshKey, setRoomsRefreshKey] = useState(0);
  const [roomsNextCursor, setRoomsNextCursor] = useState<string | null>(null);
  const [roomsLoadingMore, setRoomsLoadingMore] = useState(false);
  const [roomsMoreError, setRoomsMoreError] = useState("");
  const [roomDeleteError, setRoomDeleteError] = useState("");
  const [deletingRoomId, setDeletingRoomId] = useState<string | null>(null);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [roomMessagesLoading, setRoomMessagesLoading] = useState(false);
  const [roomMessagesError, setRoomMessagesError] = useState("");
  const [messagesNextCursor, setMessagesNextCursor] = useState<string | null>(null);
  const [messagesLoadingMore, setMessagesLoadingMore] = useState(false);
  const [messagesMoreError, setMessagesMoreError] = useState("");
  const [isRoomDrawerMounted, setIsRoomDrawerMounted] = useState(isRoomDrawerOpen);
  const conversationViewportRef = useRef<HTMLDivElement>(null);
  const conversationContentRef = useRef<HTMLDivElement>(null);
  const introRef = useRef<HTMLElement>(null);
  const roomCloseRef = useRef<HTMLButtonElement>(null);
  const roomWasOpenRef = useRef(false);
  const roomLoadRequestRef = useRef(0);
  const requestGenerationRef = useRef(0);
  const activeUserIdRef = useRef<string | null>(null);
  const roomListAbortRef = useRef<AbortController | null>(null);
  const roomMessagesAbortRef = useRef<AbortController | null>(null);
  const assistantAbortRef = useRef<AbortController | null>(null);
  const [introHeight, setIntroHeight] = useState(0);
  const hasStartedConversation = messages.some((message) => message.role === "user");

  useEffect(() => {
    const userId = user?.id ?? null;
    requestGenerationRef.current += 1;
    activeUserIdRef.current = userId;
    roomListAbortRef.current?.abort();
    roomMessagesAbortRef.current?.abort();
    assistantAbortRef.current?.abort();
    roomLoadRequestRef.current += 1;
    setIsLoading(false);
    setRoomMessagesLoading(false);
    setRoomsNextCursor(null);
    setRoomsLoadingMore(false);
    setRoomsMoreError("");
    setRooms([]);
    setMessagesNextCursor(null);
    setMessagesLoadingMore(false);
    setMessagesMoreError("");
    setSelectedRoomId(null);
    setMessages([INITIAL_MESSAGE]);
    setInput("");
    setError("");
    setRoomMessagesError("");
    onRoomDrawerOpenChange(false);
  }, [user?.id, onRoomDrawerOpenChange]);

  useEffect(() => {
    if (!user) {
      setRooms([]);
      setRoomsError("");
      setRoomsLoading(false);
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 8_000);
    let disposed = false;
    const generation = requestGenerationRef.current;
    roomListAbortRef.current = controller;
    setRoomsLoading(true);
    setRoomsError("");
    setRoomsMoreError("");
    setRoomsNextCursor(null);

    void fetch("/api/assistant/rooms?limit=20", { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json() as { rooms?: unknown; nextCursor?: unknown };
        if (!Array.isArray(data.rooms) || (data.nextCursor !== null && typeof data.nextCursor !== "string")) {
          throw new Error("invalid-rooms-response");
        }
        if (!disposed && generation === requestGenerationRef.current && activeUserIdRef.current === user.id) {
          setRooms(data.rooms.map(normalizeRoom).filter((room): room is AssistantRoom => room !== null));
          setRoomsNextCursor(data.nextCursor as string | null);
        }
      })
      .catch((requestError: unknown) => {
        if (!disposed && generation === requestGenerationRef.current && activeUserIdRef.current === user.id) setRoomsError(requestError instanceof DOMException && requestError.name === "AbortError"
          ? "대화방 목록을 불러오는 데 시간이 걸리고 있어요."
          : "대화방 목록을 불러오지 못했어요. 다시 시도해 주세요.");
      })
      .finally(() => {
        window.clearTimeout(timeout);
        if (!disposed && generation === requestGenerationRef.current && activeUserIdRef.current === user.id) setRoomsLoading(false);
      });

    return () => {
      disposed = true;
      controller.abort();
      if (roomListAbortRef.current === controller) roomListAbortRef.current = null;
      window.clearTimeout(timeout);
    };
  }, [user, roomsRefreshKey]);

  useEffect(() => {
    if (!isRoomDrawerOpen) {
      if (roomWasOpenRef.current) roomTriggerRef.current?.focus();
      roomWasOpenRef.current = false;
      return;
    }

    roomWasOpenRef.current = true;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    roomCloseRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onRoomDrawerOpenChange(false);
        return;
      }
      if (event.key !== "Tab") return;

      const dialog = document.querySelector<HTMLElement>("[data-room-drawer]");
      if (!dialog) return;
      const focusable = Array.from(dialog.querySelectorAll<HTMLElement>("button:not([disabled]), [href], textarea, input"));
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isRoomDrawerOpen, isRoomDrawerMounted, onRoomDrawerOpenChange]);

  useEffect(() => {
    if (isRoomDrawerOpen) {
      setIsRoomDrawerMounted(true);
      return;
    }
    if (!isRoomDrawerMounted) return;

    const duration = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 300;
    const timeout = window.setTimeout(() => setIsRoomDrawerMounted(false), duration);
    return () => window.clearTimeout(timeout);
  }, [isRoomDrawerOpen, isRoomDrawerMounted]);

  useEffect(() => {
    const intro = introRef.current;
    if (!intro) return;

    const measureIntro = () => {
      const nextHeight = intro.scrollHeight;
      setIntroHeight((currentHeight) => currentHeight === nextHeight ? currentHeight : nextHeight);
    };
    measureIntro();
    const resizeObserver = new ResizeObserver(measureIntro);
    resizeObserver.observe(intro);

    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    const viewport = conversationViewportRef.current;
    const content = conversationContentRef.current;
    if (!viewport || !content) return;

    const scrollToLatest = () => {
      viewport.scrollTop = viewport.scrollHeight;
    };
    const frame = requestAnimationFrame(scrollToLatest);
    const resizeObserver = new ResizeObserver(scrollToLatest);
    resizeObserver.observe(content);

    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
    };
  }, [messages, isLoading]);

  const selectRoom = async (roomId: string) => {
    if (!user || isLoading || roomMessagesLoading) return;
    const requestId = roomLoadRequestRef.current + 1;
    roomLoadRequestRef.current = requestId;
    const generation = requestGenerationRef.current;
    setSelectedRoomId(roomId);
    setMessages([INITIAL_MESSAGE]);
    setRoomMessagesLoading(true);
    setRoomMessagesError("");
    setMessagesNextCursor(null);
    setMessagesMoreError("");
    setError("");
    onRoomDrawerOpenChange(false);

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 8_000);
    roomMessagesAbortRef.current?.abort();
    roomMessagesAbortRef.current = controller;
    try {
      const response = await fetch(`/api/assistant/rooms/${encodeURIComponent(roomId)}/messages?limit=100`, { signal: controller.signal });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json() as { messages?: unknown; nextCursor?: unknown };
      if (!Array.isArray(data.messages) || (data.nextCursor !== null && typeof data.nextCursor !== "string")) {
        throw new Error("invalid-messages-response");
      }
      const storedMessages = data.messages.map(normalizeStoredMessage).filter((message): message is Message => message !== null);
      if (roomLoadRequestRef.current === requestId && generation === requestGenerationRef.current && activeUserIdRef.current === user.id) {
        setMessages([INITIAL_MESSAGE, ...storedMessages]);
        setMessagesNextCursor(data.nextCursor as string | null);
      }
    } catch (requestError) {
      if (roomLoadRequestRef.current !== requestId || generation !== requestGenerationRef.current || activeUserIdRef.current !== user.id) return;
      setRoomMessagesError(requestError instanceof DOMException && requestError.name === "AbortError"
        ? "대화 내용을 불러오는 데 시간이 걸리고 있어요."
        : "대화 내용을 불러오지 못했어요. 다시 시도해 주세요.");
    } finally {
      window.clearTimeout(timeout);
      if (roomMessagesAbortRef.current === controller) roomMessagesAbortRef.current = null;
      if (roomLoadRequestRef.current === requestId && generation === requestGenerationRef.current && activeUserIdRef.current === user.id) setRoomMessagesLoading(false);
    }
  };

  const loadMoreRooms = async () => {
    if (!user || !roomsNextCursor || roomsLoadingMore || roomsLoading) return;
    const cursor = roomsNextCursor;
    const generation = requestGenerationRef.current;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 8_000);
    roomListAbortRef.current?.abort();
    roomListAbortRef.current = controller;
    setRoomsLoadingMore(true);
    setRoomsMoreError("");
    try {
      const response = await fetch(`/api/assistant/rooms?limit=20&cursor=${encodeURIComponent(cursor)}`, { signal: controller.signal });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json() as { rooms?: unknown; nextCursor?: unknown };
      if (!Array.isArray(data.rooms) || (data.nextCursor !== null && typeof data.nextCursor !== "string")) throw new Error("invalid-rooms-response");
      if (generation !== requestGenerationRef.current || activeUserIdRef.current !== user.id) return;
      const nextRooms = data.rooms.map(normalizeRoom).filter((room): room is AssistantRoom => room !== null);
      setRooms((current) => {
        const seen = new Set(current.map((room) => room.id));
        return [...current, ...nextRooms.filter((room) => !seen.has(room.id))];
      });
      setRoomsNextCursor(data.nextCursor as string | null);
    } catch (requestError) {
      if (generation !== requestGenerationRef.current || activeUserIdRef.current !== user.id) return;
      setRoomsMoreError(requestError instanceof DOMException && requestError.name === "AbortError"
        ? "더 많은 대화방을 불러오는 데 시간이 걸리고 있어요."
        : "더 많은 대화방을 불러오지 못했어요.");
    } finally {
      window.clearTimeout(timeout);
      if (roomListAbortRef.current === controller) roomListAbortRef.current = null;
      if (generation === requestGenerationRef.current && activeUserIdRef.current === user.id) setRoomsLoadingMore(false);
    }
  };

  const loadMoreMessages = async () => {
    if (!user || !selectedRoomId || !messagesNextCursor || messagesLoadingMore || roomMessagesLoading || isLoading) return;
    const roomId = selectedRoomId;
    const cursor = messagesNextCursor;
    const requestId = roomLoadRequestRef.current;
    const generation = requestGenerationRef.current;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 8_000);
    roomMessagesAbortRef.current?.abort();
    roomMessagesAbortRef.current = controller;
    setMessagesLoadingMore(true);
    setMessagesMoreError("");
    try {
      const response = await fetch(`/api/assistant/rooms/${encodeURIComponent(roomId)}/messages?limit=100&cursor=${encodeURIComponent(cursor)}`, { signal: controller.signal });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json() as { messages?: unknown; nextCursor?: unknown };
      if (!Array.isArray(data.messages) || (data.nextCursor !== null && typeof data.nextCursor !== "string")) throw new Error("invalid-messages-response");
      if (requestId !== roomLoadRequestRef.current || generation !== requestGenerationRef.current || activeUserIdRef.current !== user.id || selectedRoomId !== roomId) return;
      const olderMessages = data.messages.map(normalizeStoredMessage).filter((message): message is Message => message !== null);
      setMessages((current) => {
        const persistedMessages = current.filter((message) => message.id !== INITIAL_MESSAGE.id);
        const seen = new Set(persistedMessages.map((message) => message.id));
        const uniqueOlderMessages = olderMessages.filter((message) => {
          if (seen.has(message.id)) return false;
          seen.add(message.id);
          return true;
        });
        return [INITIAL_MESSAGE, ...uniqueOlderMessages, ...persistedMessages];
      });
      setMessagesNextCursor(data.nextCursor as string | null);
    } catch (requestError) {
      if (requestId !== roomLoadRequestRef.current || generation !== requestGenerationRef.current || activeUserIdRef.current !== user.id) return;
      setMessagesMoreError(requestError instanceof DOMException && requestError.name === "AbortError"
        ? "더 많은 대화를 불러오는 데 시간이 걸리고 있어요."
        : "더 많은 대화를 불러오지 못했어요.");
    } finally {
      window.clearTimeout(timeout);
      if (roomMessagesAbortRef.current === controller) roomMessagesAbortRef.current = null;
      if (generation === requestGenerationRef.current && activeUserIdRef.current === user.id) setMessagesLoadingMore(false);
    }
  };

  const updateRoomOptimistically = (roomId: string, title: string, snippet: string) => {
    const now = new Date().toISOString();
    setRooms((current) => {
      const existing = current.find((room) => room.id === roomId);
      const nextRoom: AssistantRoom = existing
        ? { ...existing, snippet, updatedAt: now }
        : { id: roomId, title, createdAt: now, updatedAt: now, snippet };
      return [nextRoom, ...current.filter((room) => room.id !== roomId)];
    });
  };

  const askAssistant = async (question: string) => {
    const trimmed = question.trim();
    if (!trimmed || isLoading || roomMessagesLoading || !user) return;
    if (trimmed.length > MAX_QUESTION_LENGTH) {
      setError(`질문이 너무 길어요. ${MAX_QUESTION_LENGTH}자 이내로 줄여 주세요.`);
      return;
    }

    const roomIdAtStart = selectedRoomId;
    const clientRequestId = crypto.randomUUID();
    const temporaryUserMessageId = `pending-user-${clientRequestId}`;
    const temporaryAssistantMessageId = `pending-assistant-${clientRequestId}`;
    let assistantMessageId = temporaryAssistantMessageId;
    let activeRoomId = roomIdAtStart;
    setMessages((current) => [
      ...current,
      { id: temporaryUserMessageId, roomId: roomIdAtStart ?? undefined, role: "user", text: trimmed, status: "complete" },
      { id: temporaryAssistantMessageId, roomId: roomIdAtStart ?? undefined, role: "assistant", text: "", status: "in_progress" },
    ]);
    setInput("");
    setError("");
    setIsLoading(true);

    let streamedText = "";
    let isStreamingResponse = false;
    const generation = requestGenerationRef.current;
    const requestIsCurrent = () => generation === requestGenerationRef.current && activeUserIdRef.current === user.id;
    const controller = new AbortController();
    assistantAbortRef.current = controller;
    const requestStartedAt = Date.now();
    let responseStatus: number | null = null;
    let errorClassification = "unknown";
    const serverErrorIds = new Set<string>();
    const retainServerErrorId = (value: unknown) => {
      if (typeof value === "string" && value) serverErrorIds.add(value.slice(0, 160));
    };

    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed, roomId: roomIdAtStart, clientRequestId }),
        signal: controller.signal,
      });
      responseStatus = response.status;
      retainServerErrorId(response.headers.get("X-Assistant-Error-Id"));
      if (response.status === 413) throw new Error("too-long");
      if (response.status === 429) throw new Error("usage-limit");
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      isStreamingResponse = true;
      if (!response.body) throw new Error("stream-disconnected");
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let completed = false;

      const processLine = (line: string) => {
          if (!requestIsCurrent()) throw new Error("stale-request");
          if (!line.trim()) return;
          let event: unknown;
          try {
            event = JSON.parse(line) as unknown;
          } catch {
            throw new Error("stream-malformed");
          }
          if (!event || typeof event !== "object" || typeof (event as { type?: unknown }).type !== "string") {
            throw new Error("stream-malformed");
          }
          const record = event as Record<string, unknown>;
          if (completed) throw new Error("stream-malformed");
          if (record.type === "accepted" && typeof record.roomId === "string" && typeof record.userMessageId === "string" && typeof record.assistantMessageId === "string") {
            const acceptedRoomId = record.roomId;
            const acceptedUserMessageId = record.userMessageId;
            const acceptedAssistantMessageId = record.assistantMessageId;
            activeRoomId = acceptedRoomId;
            assistantMessageId = acceptedAssistantMessageId;
            setSelectedRoomId(acceptedRoomId);
            setMessages((current) => current.map((message) => {
              if (message.id === temporaryUserMessageId) return { ...message, id: acceptedUserMessageId, roomId: acceptedRoomId };
              if (message.id === temporaryAssistantMessageId) return { ...message, id: acceptedAssistantMessageId, roomId: acceptedRoomId };
              return message;
            }));
            updateRoomOptimistically(acceptedRoomId, trimmed, trimmed);
            return;
          }
          if (record.type === "delta" && typeof record.delta === "string") {
            streamedText += record.delta;
            setMessages((current) => current.map((message) => message.id === assistantMessageId
              ? { ...message, text: message.text + record.delta }
              : message));
            return;
          }
          if (record.type === "completed" && Array.isArray(record.sources)) {
            if (typeof record.message !== "string") throw new Error("stream-malformed");
            const finalMessage = record.message;
            completed = true;
            setMessages((current) => current.map((message) => message.id === assistantMessageId
              ? { ...message, text: finalMessage, sources: normalizeSources(record.sources), status: "complete" }
              : message));
            if (activeRoomId) setRoomsRefreshKey((current) => current + 1);
            return;
          }
          if (record.type === "error" && typeof record.error === "string") {
            retainServerErrorId(record.errorId);
            if (typeof record.classification === "string" && record.classification) {
              errorClassification = record.classification.slice(0, 80);
            }
            throw new Error("stream-error");
          }
          throw new Error("stream-malformed");
      };

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split(/\r?\n/);
          buffer = lines.pop() ?? "";
          for (const line of lines) processLine(line);
        }
        buffer += decoder.decode();
        if (buffer.trim()) processLine(buffer);
      } finally {
        reader.releaseLock();
      }
      if (!completed) throw new Error("stream-disconnected");
    } catch (requestError) {
      if (!requestIsCurrent()) return;
      if (requestError instanceof Error && requestError.message === "too-long") errorClassification = "too_long";
      else if (requestError instanceof Error && requestError.message === "usage-limit") errorClassification = "usage_limit";
      else if (requestError instanceof Error && requestError.message === "stream-error" && errorClassification === "unknown") {
        errorClassification = "stream_error";
      } else if (requestError instanceof Error && requestError.message === "stream-malformed") {
        errorClassification = "stream_malformed";
      } else if (requestError instanceof Error && requestError.message === "stream-disconnected") {
        errorClassification = "stream_disconnected";
      } else if (responseStatus !== null && responseStatus >= 400) {
        errorClassification = "http_error";
      }
      console.error(JSON.stringify({
        event: "assistant_client_error",
        errorIds: Array.from(serverErrorIds),
        classification: errorClassification,
        httpStatus: responseStatus,
        streamingStarted: isStreamingResponse,
        textStarted: Boolean(streamedText),
        elapsedMs: Math.max(0, Date.now() - requestStartedAt),
      }));
      if (isStreamingResponse && streamedText) {
        setMessages((current) => current.map((message) => message.id === assistantMessageId
          ? { ...message, text: `${message.text}\n\n${STREAM_ERROR_NOTICE}`, status: "failed" }
          : message));
      } else {
        setMessages((current) => current.filter((message) => message.id !== assistantMessageId));
        setError(requestError instanceof Error && requestError.message === "too-long"
          ? `질문이 너무 길어요. ${MAX_QUESTION_LENGTH}자 이내로 줄여 다시 보내 주세요.`
          : requestError instanceof Error && requestError.message === "usage-limit"
            ? "AI 어시스턴트 사용량 제한에 도달했어요. 잠시 후 다시 시도해 주세요."
            : "답변을 불러오지 못했어요. 잠시 후 다시 보내 주세요.");
      }
    } finally {
      if (assistantAbortRef.current === controller) assistantAbortRef.current = null;
      if (requestIsCurrent()) setIsLoading(false);
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void askAssistant(input);
  };

  const handleNewChat = () => {
    roomLoadRequestRef.current += 1;
    roomMessagesAbortRef.current?.abort();
    setSelectedRoomId(null);
    setMessages([INITIAL_MESSAGE]);
    setInput("");
    setError("");
    setRoomMessagesError("");
    setRoomMessagesLoading(false);
    setMessagesNextCursor(null);
    setMessagesMoreError("");
    onRoomDrawerOpenChange(false);
  };

  const deleteRoom = async (room: AssistantRoom) => {
    if (!user || isLoading || roomMessagesLoading || deletingRoomId) return;
    if (!window.confirm(`“${room.title}” 대화방을 삭제할까요? 삭제한 대화는 복구할 수 없어요.`)) return;

    setDeletingRoomId(room.id);
    setRoomDeleteError("");
    try {
      const response = await fetch(`/api/assistant/rooms/${encodeURIComponent(room.id)}`, { method: "DELETE" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      setRooms((current) => current.filter((currentRoom) => currentRoom.id !== room.id));
      if (selectedRoomId === room.id) {
        roomLoadRequestRef.current += 1;
        roomMessagesAbortRef.current?.abort();
        setSelectedRoomId(null);
        setMessages([INITIAL_MESSAGE]);
        setInput("");
        setError("");
        setRoomMessagesError("");
        setRoomMessagesLoading(false);
        setMessagesNextCursor(null);
        setMessagesMoreError("");
      }
    } catch {
      setRoomDeleteError("대화방을 삭제하지 못했어요. 다시 시도해 주세요.");
    } finally {
      setDeletingRoomId(null);
    }
  };

  const roomList = rooms;

  return (
    <div
      className={`assistant-tab min-h-0 md:flex md:flex-col md:h-full ${hasStartedConversation ? "assistant-tab--started md:space-y-0" : "md:space-y-6"} animate-fadeIn pb-0 md:pb-0`}
      style={{ "--assistant-intro-height": `${introHeight}px` } as React.CSSProperties}
    >
      

      {!user && (
        <section className="flex flex-col items-start gap-4 rounded-xl border border-bento-green/20 bg-bento-green/[0.06] p-3 md:p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-bento-green/10 text-bento-green"><LockKeyhole size={17} /></div>
            <div>
              <h3 className="text-sm font-bold text-bento-dark">로그인 후 이용할 수 있어요</h3>
              <p className="mt-1 text-xs leading-relaxed text-bento-dark/55">AI 어시스턴트는 로그인한 사용자만 이용할 수 있습니다.</p>
            </div>
          </div>
          <button onClick={onLoginClick} className="w-full rounded-lg bg-bento-green px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-bento-ink sm:w-auto">로그인하기</button>
        </section>
      )}

      <div className="assistant-workspace flex min-h-0 flex-col gap-4 md:flex-1 md:flex-row">
      <section className="assistant-chat-panel min-h-0 overflow-hidden rounded-xl border border-border-default bg-white shadow-sm md:flex md:min-w-0 md:flex-1 md:flex-col">
        {/*<div className="flex items-center justify-between border-b border-border-subtle px-5 py-4">
          <div>
            <h3 className="flex items-center gap-2 text-sm font-bold text-bento-dark"><Sparkles size={15} className="text-bento-green" /> 온길 AI 대화</h3>
            <p className="mt-1 text-[11px] text-bento-dark/45">대화 내용은 이 화면을 닫으면 저장되지 않아요.</p>
          </div>
        </div>*/}

        <div ref={conversationViewportRef} className={`assistant-conversation-viewport min-h-0 overflow-y-auto overscroll-contain bg-bento-bg/45 p-4 sm:p-6 md:flex-1 ${hasStartedConversation ? "assistant-conversation-viewport--started" : ""}`} aria-live="polite">
          <div ref={conversationContentRef} className="space-y-5">
          {roomMessagesLoading && <div role="status" className="rounded-lg border border-border-subtle bg-white/80 px-4 py-3 text-xs font-semibold text-bento-dark/55">대화 내용을 불러오고 있어요…</div>}
          {messages.filter((message) => message.role === "user" || message.text).map((message) => (
            <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[88%] sm:max-w-[75%] ${message.role === "user" ? "items-end" : "items-start"} flex flex-col gap-2`}>
                {/*<span className="px-1 text-[10px] font-semibold text-bento-dark/40">{message.role === "user" ? "나" : "온길 AI"}</span>*/}
                <div className={`rounded-2xl px-4 py-3 text-xs leading-7 ${message.role === "user" ? "rounded-tr-sm bg-bento-green text-white" : "rounded-tl-sm border border-border-subtle bg-white text-bento-dark shadow-sm"}`}>
                  {message.role === "assistant" ? <MarkdownMessage content={message.text} /> : <p className="whitespace-pre-wrap">{message.text}</p>}
                  {message.sources && message.sources.length > 0 && (
                    <div className="mt-3 border-t border-bento-dark/10 pt-2.5">
                      <p className="mb-1.5 text-[10px] font-bold text-bento-dark/45">참고한 출처</p>
                      <div className="space-y-1">
                        {message.sources.map((source) => (
                          <a key={source.url} href={source.url} target="_blank" rel="noreferrer noopener" className="flex items-center gap-1 text-[11px] font-semibold text-bento-green underline-offset-2 hover:underline">
                            <ExternalLink size={11} /> <span className="truncate">{source.title}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          {selectedRoomId && messagesNextCursor && (
            <div className="flex flex-col items-center gap-1 pt-1">
              <button type="button" onClick={() => void loadMoreMessages()} disabled={messagesLoadingMore || roomMessagesLoading || isLoading} className="rounded-full border border-border-default bg-white px-3 py-1.5 text-[11px] font-bold text-bento-dark/65 transition hover:border-bento-green/40 hover:text-bento-green focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bento-green disabled:cursor-not-allowed disabled:opacity-50">
                {messagesLoadingMore ? "대화를 불러오는 중…" : "대화 더 불러오기"}
              </button>
              {messagesMoreError && <p role="alert" className="text-[11px] font-semibold text-red-700">{messagesMoreError}</p>}
            </div>
          )}
          {!hasStartedConversation && (
            <div className="mt-2 rounded-2xl border border-bento-green/15 bg-white/70 p-4 shadow-sm sm:p-5" aria-labelledby="suggestions-heading">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <p id="suggestions-heading" className="text-xs font-bold text-bento-dark">어디로 떠나볼까요?</p>
                  <p className="mt-1 text-[11px] leading-relaxed text-bento-dark/50">추천 질문을 눌러 대화를 바로 시작해 보세요.</p>
                </div>
                <Sparkles size={16} className="mt-0.5 shrink-0 text-bento-green" aria-hidden="true" />
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {SUGGESTIONS.map((suggestion, index) => (
                  <button
                    key={suggestion}
                    type="button"
                    disabled={!user || isLoading || roomMessagesLoading}
                    onClick={() => void askAssistant(suggestion)}
                    className="group flex min-h-14 items-center gap-3 rounded-xl border border-border-default bg-white px-3.5 py-3 text-left text-[11px] font-medium leading-relaxed text-bento-dark/70 shadow-sm transition hover:-translate-y-0.5 hover:border-bento-green/45 hover:text-bento-dark hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bento-green focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-sm"
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-bento-bg text-[10px] font-bold text-bento-green transition group-hover:bg-bento-green group-hover:text-white" aria-hidden="true">{index + 1}</span>
                    <span>{suggestion}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
          {isLoading && <div className="flex items-center gap-2 text-xs text-bento-dark/50"><span className="flex gap-1 rounded-2xl border border-border-subtle bg-white px-4 py-3"><i className="h-1.5 w-1.5 animate-bounce rounded-full bg-bento-green" /><i className="h-1.5 w-1.5 animate-bounce rounded-full bg-bento-green [animation-delay:120ms]" /><i className="h-1.5 w-1.5 animate-bounce rounded-full bg-bento-green [animation-delay:240ms]" /></span><span>답변을 준비하고 있어요</span></div>}
        </div>

        </div>

        {error && <p role="alert" className="flex items-center gap-2 border-t border-red-100 bg-red-50 px-5 py-3 text-xs font-semibold text-red-700"><AlertCircle size={14} />{error}</p>}
        {roomMessagesError && <p role="alert" className="flex items-center gap-2 border-t border-red-100 bg-red-50 px-5 py-3 text-xs font-semibold text-red-700"><AlertCircle size={14} />{roomMessagesError}</p>}

        <div className="border-t border-border-subtle bg-white p-1.5 md:p-4">
          <form onSubmit={handleSubmit} className="flex items-end gap-2 rounded-xl border border-border-strong bg-bento-bg p-1.5 focus-within:border-bento-green focus-within:ring-2 focus-within:ring-bento-green/10">
            <label htmlFor="assistant-question" className="sr-only">AI에게 질문하기</label>
            <textarea id="assistant-question" value={input} maxLength={MAX_QUESTION_LENGTH} onChange={(event) => setInput(event.target.value)} disabled={!user || isLoading} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void askAssistant(input); } }} rows={1} placeholder={user ? "걷기 여행에 대해 궁금한 점을 적어주세요" : "로그인하면 질문할 수 있어요"} className="max-h-28 min-h-9 flex-1 resize-none bg-transparent px-2 py-1.5 md:pt-2 md:pb-2 text-[13px] leading-6 text-bento-dark outline-none placeholder:text-bento-dark/35 placeholder:text-[13px] disabled:cursor-not-allowed" />
            <button type="submit" disabled={!user || !input.trim() || isLoading} aria-label="질문 보내기" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-bento-green text-white transition hover:bg-bento-ink disabled:cursor-not-allowed disabled:bg-bento-dark/15"><ArrowUp size={16} /></button>
          </form>
        </div>
      </section>

      <aside className="hidden w-64 shrink-0 flex-col overflow-hidden rounded-xl border border-border-default bg-white shadow-sm md:flex" aria-labelledby="assistant-rooms-heading">
        <div className="flex items-center justify-between border-b border-border-subtle px-4 py-4">
          <div>
            <h3 id="assistant-rooms-heading" className="text-sm font-bold text-bento-dark">대화방</h3>
            <p className="mt-1 text-[11px] text-bento-dark/45">지난 대화를 이어가세요</p>
          </div>
          <MessageCircle size={17} className="text-bento-green" aria-hidden="true" />
        </div>
        <div className="flex-1 space-y-3 overflow-y-auto p-3">
          <button type="button" onClick={handleNewChat} disabled={!user || isLoading} aria-label="새 대화 시작" className="flex w-full items-center justify-center gap-2 rounded-lg bg-bento-green px-3 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-bento-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bento-green focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
            <Plus size={15} aria-hidden="true" /> 새 대화
          </button>
          {roomsNextCursor && !roomsError && <button type="button" onClick={() => void loadMoreRooms()} disabled={roomsLoadingMore || roomsLoading} className="w-full rounded-lg border border-border-default bg-white px-3 py-2 text-[11px] font-bold text-bento-dark/60 transition hover:border-bento-green/40 hover:text-bento-green focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bento-green disabled:cursor-not-allowed disabled:opacity-50" aria-label="오래된 대화방 더 불러오기">{roomsLoadingMore ? "대화방을 불러오는 중…" : "오래된 대화방 더 보기"}</button>}
          {roomDeleteError && <p role="alert" className="text-xs font-semibold text-red-700">{roomDeleteError}</p>}
          {roomsLoading ? (
            <div role="status" className="space-y-2 rounded-lg border border-border-default px-3 py-4" aria-label="대화방 목록 불러오는 중">
              <div className="h-3 w-2/3 animate-pulse rounded bg-bento-dark/10" />
              <div className="h-3 w-1/2 animate-pulse rounded bg-bento-dark/10" />
            </div>
          ) : roomsError ? (
            <div role="alert" className="rounded-lg border border-red-100 bg-red-50 px-3 py-4 text-center">
              <p className="text-xs font-semibold text-red-700">{roomsError}</p>
              <button type="button" onClick={() => setRoomsRefreshKey((current) => current + 1)} className="mt-3 rounded-md border border-red-200 bg-white px-3 py-1.5 text-xs font-bold text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400">다시 시도</button>
            </div>
          ) : roomList.length > 0 ? roomList.map((room) => (
            <div key={room.id} className={`relative w-full rounded-lg border text-left text-xs font-semibold text-bento-dark transition ${selectedRoomId === room.id ? "border-bento-green/25 bg-bento-green/[0.06]" : "border-border-default bg-white hover:border-bento-green/30"}`}>
              <button type="button" onClick={() => void selectRoom(room.id)} disabled={isLoading || roomMessagesLoading || deletingRoomId === room.id} className="w-full rounded-lg px-3 py-3 pr-10 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bento-green focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60" aria-current={selectedRoomId === room.id ? "page" : undefined} aria-label={`${room.title} 대화방 열기`}>
              <span className="mb-1 block text-[10px] font-bold uppercase tracking-[0.12em] text-bento-green">{selectedRoomId === room.id ? "현재 열림" : "대화방"}</span>
              <span className="block truncate">{room.title}</span>
              {room.snippet && <span className="mt-1 block truncate text-[11px] font-normal text-bento-dark/45">{room.snippet}</span>}
              </button>
              <button type="button" onClick={() => void deleteRoom(room)} disabled={isLoading || roomMessagesLoading || deletingRoomId !== null} className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-md text-bento-dark/40 transition hover:bg-bento-bg hover:text-bento-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bento-green disabled:cursor-not-allowed disabled:opacity-40" aria-label={`${room.title} 대화방 삭제`}>
                <X size={14} aria-hidden="true" />
              </button>
            </div>
          )) : (
            <div className="rounded-lg border border-dashed border-border-default px-3 py-6 text-center">
              <p className="text-xs font-semibold text-bento-dark/65">저장된 대화가 없어요</p>
              <p className="mt-1 text-[11px] leading-relaxed text-bento-dark/40">메시지를 보내면 이곳에 표시돼요.</p>
              {roomsMoreError && <span role="alert" className="mt-2 block text-[11px] font-semibold text-red-700">{roomsMoreError}</span>}
            </div>
          )}
        </div>
      </aside>
      </div>

      {isRoomDrawerMounted && createPortal(
        <>
          <button type="button" tabIndex={isRoomDrawerOpen ? 0 : -1} aria-hidden={!isRoomDrawerOpen} className={`fixed inset-0 z-[110] bg-bento-dark/35 transition-opacity duration-300 ease-out motion-reduce:transition-none ${isRoomDrawerOpen ? "opacity-100" : "pointer-events-none opacity-0"}`} aria-label="대화방 닫기" onClick={() => onRoomDrawerOpenChange(false)} />
          <aside
        data-room-drawer
        className={`fixed inset-y-0 right-0 z-[120] flex w-[min(88vw,22rem)] flex-col bg-white shadow-[-12px_0_36px_rgba(15,31,23,0.16)] transition-transform duration-300 ease-out motion-reduce:transition-none md:hidden ${isRoomDrawerOpen ? "translate-x-0 animate-room-drawer-enter" : "pointer-events-none translate-x-full"}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="mobile-assistant-rooms-heading"
        aria-hidden={!isRoomDrawerOpen}
      >
        <div className="flex items-start justify-between border-b border-border-subtle px-5 py-5">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-bento-green">온길 AI</p>
            <h2 id="mobile-assistant-rooms-heading" className="mt-1 text-lg font-black text-bento-dark">대화방</h2>
            <p className="mt-1 text-xs text-bento-dark/45">대화를 새로 시작하거나 이어가세요.</p>
          </div>
          <button ref={roomCloseRef} type="button" onClick={() => onRoomDrawerOpenChange(false)} className="flex h-9 w-9 items-center justify-center rounded-lg text-bento-dark/60 transition hover:bg-bento-bg hover:text-bento-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bento-green" aria-label="대화방 닫기">
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {roomDeleteError && <p role="alert" className="text-xs font-semibold text-red-700">{roomDeleteError}</p>}
          {roomsNextCursor && !roomsError && <button type="button" onClick={() => void loadMoreRooms()} disabled={roomsLoadingMore || roomsLoading} className="w-full rounded-lg border border-border-default bg-white px-4 py-2.5 text-xs font-bold text-bento-dark/60 transition hover:border-bento-green/40 hover:text-bento-green focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bento-green disabled:cursor-not-allowed disabled:opacity-50" aria-label="오래된 대화방 더 불러오기">{roomsLoadingMore ? "대화방을 불러오는 중…" : "오래된 대화방 더 보기"}</button>}
          <button type="button" onClick={handleNewChat} disabled={!user || isLoading} aria-label="새 대화 시작" className="flex w-full items-center justify-center gap-2 rounded-lg bg-bento-green px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-bento-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bento-green focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
            <Plus size={17} aria-hidden="true" /> 새 대화
          </button>
          {roomsLoading ? (
            <div role="status" className="space-y-2 rounded-lg border border-border-default px-4 py-5" aria-label="대화방 목록 불러오는 중">
              <div className="h-3 w-2/3 animate-pulse rounded bg-bento-dark/10" />
              <div className="h-3 w-1/2 animate-pulse rounded bg-bento-dark/10" />
            </div>
          ) : roomsError ? (
            <div role="alert" className="rounded-lg border border-red-100 bg-red-50 px-4 py-5 text-center">
              <p className="text-xs font-semibold text-red-700">{roomsError}</p>
              <button type="button" onClick={() => setRoomsRefreshKey((current) => current + 1)} className="mt-3 rounded-md border border-red-200 bg-white px-3 py-2 text-xs font-bold text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400">다시 시도</button>
            </div>
          ) : roomList.length > 0 ? roomList.map((room) => (
            <div key={room.id} className={`relative w-full rounded-lg border text-left text-sm font-semibold text-bento-dark transition ${selectedRoomId === room.id ? "border-bento-green/25 bg-bento-green/[0.06]" : "border-border-default bg-white hover:border-bento-green/30"}`}>
              <button type="button" onClick={() => void selectRoom(room.id)} disabled={isLoading || roomMessagesLoading || deletingRoomId === room.id} className="w-full rounded-lg px-4 py-3 pr-11 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bento-green focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60" aria-current={selectedRoomId === room.id ? "page" : undefined} aria-label={`${room.title} 대화방 열기`}>
              <span className="mb-1 block text-[10px] font-bold uppercase tracking-[0.12em] text-bento-green">{selectedRoomId === room.id ? "현재 열림" : "대화방"}</span>
              <span className="block truncate text-xs">{room.title}</span>
              {room.snippet && <span className="mt-1 block truncate text-xs font-normal text-bento-dark/45">{room.snippet}</span>}
              </button>
              <button type="button" onClick={() => void deleteRoom(room)} disabled={isLoading || roomMessagesLoading || deletingRoomId !== null} className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-md text-bento-dark/40 transition hover:bg-bento-bg hover:text-bento-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bento-green disabled:cursor-not-allowed disabled:opacity-40" aria-label={`${room.title} 대화방 삭제`}>
                <X size={15} aria-hidden="true" />
              </button>
            </div>
          )) : (
            <div className="rounded-lg border border-dashed border-border-default px-4 py-8 text-center">
              <p className="text-sm font-semibold text-bento-dark/65">저장된 대화가 없어요</p>
              <p className="mt-1 text-xs leading-relaxed text-bento-dark/40">메시지를 보내면 이곳에 표시돼요.</p>
            </div>
          )}
        </div>
          </aside>
        </>,
        document.body
      )}
    </div>
  );
}
