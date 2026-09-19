'use client';

import React, { FormEvent, useEffect, useRef, useState } from "react";
import { AlertCircle, ArrowUp, ExternalLink, LockKeyhole, Sparkles } from "lucide-react";
import ReactMarkdown, { defaultUrlTransform, type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

interface AssistantTabProps {
  user: { name: string; avatarUrl: string } | null;
  onLoginClick: () => void;
}

interface Source {
  title: string;
  url: string;
}

interface Message {
  id: number;
  role: "user" | "assistant";
  text: string;
  sources?: Source[];
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
  id: 0,
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

function normalizeAnswer(data: unknown): { text: string; sources: Source[] } {
  const record = data && typeof data === "object" ? data as Record<string, unknown> : {};
  const text = asText(record.answer) ?? asText(record.text) ?? asText(record.response) ??
    asText(record.message) ?? asText(record.content) ?? "답변을 확인하지 못했어요. 잠시 후 다시 시도해 주세요.";
  const sourceValue = record.sources ?? record.citations ?? record.references ?? record.links;
  return { text, sources: normalizeSources(sourceValue) };
}

function recentConversation(messages: Message[]) {
  const actualMessages = messages.filter((message) => message.id !== INITIAL_MESSAGE.id);
  const completeTurns: Array<{ role: Message["role"]; content: string }[]> = [];

  for (let index = 0; index < actualMessages.length - 1; index += 1) {
    const userMessage = actualMessages[index];
    const assistantMessage = actualMessages[index + 1];
    if (userMessage.role === "user" && assistantMessage.role === "assistant") {
      completeTurns.push([
        { role: userMessage.role, content: userMessage.text },
        { role: assistantMessage.role, content: assistantMessage.text },
      ]);
      index += 1;
    }
  }

  return completeTurns.flat().slice(-12);
}

export default function AssistantTab({ user, onLoginClick }: AssistantTabProps) {
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const conversationViewportRef = useRef<HTMLDivElement>(null);
  const conversationContentRef = useRef<HTMLDivElement>(null);
  const hasStartedConversation = messages.some((message) => message.role === "user");

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

  const askAssistant = async (question: string) => {
    const trimmed = question.trim();
    if (!trimmed || isLoading || !user) return;
    if (trimmed.length > MAX_QUESTION_LENGTH) {
      setError(`질문이 너무 길어요. ${MAX_QUESTION_LENGTH}자 이내로 줄여 주세요.`);
      return;
    }

    const history = recentConversation(messages);
    const userMessageId = Date.now();
    const assistantMessageId = userMessageId + 1;
    setMessages((current) => [
      ...current,
      { id: userMessageId, role: "user", text: trimmed },
      { id: assistantMessageId, role: "assistant", text: "" },
    ]);
    setInput("");
    setError("");
    setIsLoading(true);

    let streamedText = "";
    let isStreamingResponse = false;
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
        body: JSON.stringify({ message: trimmed, history }),
      });
      responseStatus = response.status;
      retainServerErrorId(response.headers.get("X-Assistant-Error-Id"));
      if (response.status === 413) throw new Error("too-long");
      if (response.status === 429) throw new Error("usage-limit");
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const contentType = response.headers.get("content-type") ?? "";
      if (!contentType.toLowerCase().includes("application/x-ndjson")) {
        const result = normalizeAnswer(await response.json());
        setMessages((current) => current.map((message) => message.id === assistantMessageId
          ? { ...message, text: result.text, sources: result.sources }
          : message));
      } else {
        isStreamingResponse = true;
        if (!response.body) throw new Error("stream-disconnected");
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let completed = false;

        const processLine = (line: string) => {
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
          if (record.type === "delta" && typeof record.delta === "string") {
            streamedText += record.delta;
            setMessages((current) => current.map((message) => message.id === assistantMessageId
              ? { ...message, text: message.text + record.delta }
              : message));
            return;
          }
          if (record.type === "completed" && Array.isArray(record.sources)) {
            const finalMessage = asText(record.message);
            if (!streamedText && !finalMessage) throw new Error("stream-malformed");
            completed = true;
            setMessages((current) => current.map((message) => message.id === assistantMessageId
              ? { ...message, text: streamedText || finalMessage || message.text, sources: normalizeSources(record.sources) }
              : message));
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
      }
    } catch (requestError) {
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
          ? { ...message, text: `${message.text}\n\n${STREAM_ERROR_NOTICE}` }
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
      setIsLoading(false);
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void askAssistant(input);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      <header>
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-bento-green">온길 AI 어시스턴트</p>
        <h2 className="font-display text-3xl font-black tracking-tight text-bento-dark">나에게 맞는 걷기 여행, 물어보세요</h2>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-bento-dark/55">
          여행 조건을 말하면 온길 자료에 있는 코스·이동 편의 정보를 바탕으로 찾아드려요.
        </p>
      </header>

      {!user && (
        <section className="flex flex-col items-start gap-4 rounded-xl border border-bento-green/20 bg-bento-green/[0.06] p-5 sm:flex-row sm:items-center sm:justify-between">
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

      <section className="overflow-hidden rounded-xl border border-border-default bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-border-subtle px-5 py-4">
          <div>
            <h3 className="flex items-center gap-2 text-sm font-bold text-bento-dark"><Sparkles size={15} className="text-bento-green" /> 온길 AI 대화</h3>
            <p className="mt-1 text-[11px] text-bento-dark/45">대화 내용은 이 화면을 닫으면 저장되지 않아요.</p>
          </div>
        </div>

        <div ref={conversationViewportRef} className="h-[440px] min-h-0 overflow-y-auto overscroll-contain bg-bento-bg/45 p-4 sm:p-6" aria-live="polite">
          <div ref={conversationContentRef} className="space-y-5">
          {messages.filter((message) => message.role === "user" || message.text).map((message) => (
            <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[88%] sm:max-w-[75%] ${message.role === "user" ? "items-end" : "items-start"} flex flex-col gap-2`}>
                <span className="px-1 text-[10px] font-semibold text-bento-dark/40">{message.role === "user" ? "나" : "온길 AI"}</span>
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
                    disabled={!user || isLoading}
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

        <div className="border-t border-border-subtle bg-white p-4 sm:p-5">
          <form onSubmit={handleSubmit} className="flex items-end gap-2 rounded-xl border border-border-strong bg-bento-bg p-2 focus-within:border-bento-green focus-within:ring-2 focus-within:ring-bento-green/10">
            <label htmlFor="assistant-question" className="sr-only">AI에게 질문하기</label>
            <textarea id="assistant-question" value={input} maxLength={MAX_QUESTION_LENGTH} onChange={(event) => setInput(event.target.value)} disabled={!user || isLoading} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void askAssistant(input); } }} rows={1} placeholder={user ? "걷기 여행에 대해 궁금한 점을 적어주세요" : "로그인하면 질문할 수 있어요"} className="max-h-28 min-h-10 flex-1 resize-none bg-transparent px-2 py-2 text-xs text-bento-dark outline-none placeholder:text-bento-dark/35 disabled:cursor-not-allowed" />
            <button type="submit" disabled={!user || !input.trim() || isLoading} aria-label="질문 보내기" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-bento-green text-white transition hover:bg-bento-ink disabled:cursor-not-allowed disabled:bg-bento-dark/15"><ArrowUp size={17} /></button>
          </form>
        </div>
      </section>
    </div>
  );
}
