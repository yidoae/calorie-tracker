"use client";

import { RotateCcw, SendHorizontal, X } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import type { ChatMessage } from "@/lib/fitbot";
import type { FitBotClientContext } from "@/lib/fitbotContext";
import { useProfile } from "@/lib/useProfile";
import FitBotAvatar from "./FitBotAvatar";

const UNREACHABLE = "Couldn't reach the local LLM service. Make sure it's running.";

const SUGGESTIONS = [
  "What should I eat for the rest of today?",
  "How much protein do I need per day?",
  "How many calories to lose 0.5 kg a week?",
  "How should I recover after leg day?",
];

/** The user's active profile/plan and local "today", so the server can personalise FitBot's answers. */
function buildContext(profile: FitBotClientContext["profile"], customPlan: FitBotClientContext["customPlan"]): FitBotClientContext {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return {
    profile,
    customPlan,
    dayStart: start.toISOString(),
    dayEnd: end.toISOString(),
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  };
}

/**
 * Floating chat widget (bottom-right) for FitBot, the local-LLM fitness coach. The conversation
 * lives in component state only; each request sends the whole history to /api/fitbot/chat along
 * with the active profile/plan, and the server adds today's meals from the DB.
 */
export default function FitBot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const { activeProfile, customPlan } = useProfile();

  // Keep the newest message (or the typing indicator / error) in view.
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, pending, error, open]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  async function request(history: ChatMessage[]) {
    setError(null);
    setPending(true);
    try {
      const res = await fetch("/api/fitbot/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history, context: buildContext(activeProfile, customPlan) }),
      });
      const json = (await res.json().catch(() => null)) as { reply?: string; error?: string } | null;
      if (!res.ok || typeof json?.reply !== "string") {
        setError(json?.error ?? UNREACHABLE);
        return;
      }
      const reply = json.reply;
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch {
      setError(UNREACHABLE);
    } finally {
      setPending(false);
    }
  }

  function send(text: string) {
    const content = text.trim();
    if (!content || pending) return;
    const history: ChatMessage[] = [...messages, { role: "user", content }];
    setMessages(history);
    setInput("");
    void request(history);
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    send(input);
  }

  function close() {
    setOpen(false);
    toggleRef.current?.focus();
  }

  function reset() {
    setMessages([]);
    setError(null);
    inputRef.current?.focus();
  }

  const lastIsUser = messages.length > 0 && messages[messages.length - 1].role === "user";

  return (
    <>
      {open && (
        <section
          id="fitbot-panel"
          role="dialog"
          aria-label="FitBot chat"
          onKeyDown={(e) => {
            if (e.key === "Escape") close();
          }}
          className="card fixed right-4 bottom-[max(5.5rem,calc(env(safe-area-inset-bottom)+5rem))] z-40 flex h-[min(34rem,calc(100dvh-7.5rem))] w-[min(24rem,calc(100vw-2rem))] animate-enter flex-col overflow-hidden shadow-pop sm:right-6"
        >
          <header className="flex items-center gap-3 border-b border-border px-4 py-3">
            <FitBotAvatar className="size-9" />
            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-semibold">FitBot</h2>
              <p className="truncate text-xs text-fg-subtle">Your fitness &amp; nutrition coach · local AI</p>
            </div>
            {messages.length > 0 && (
              <button type="button" aria-label="Start a new chat" onClick={reset} disabled={pending} className="btn btn-ghost btn-icon-sm">
                <RotateCcw aria-hidden className="size-4" />
              </button>
            )}
            <button type="button" aria-label="Close FitBot" onClick={close} className="btn btn-ghost btn-icon-sm">
              <X aria-hidden className="size-4" />
            </button>
          </header>

          <div ref={listRef} aria-live="polite" className="flex-1 space-y-3 overflow-y-auto overscroll-contain px-4 py-4">
            {messages.length === 0 && (
              <div className="flex flex-col items-center pt-4 text-center">
                <FitBotAvatar className="size-14" />
                <p className="mt-3 text-sm font-medium">Hey, I&apos;m FitBot! 💪</p>
                <p className="mt-1 max-w-64 text-[13px] text-fg-subtle">
                  Ask me about training, calories, macros or recovery. I can see your profile and today&apos;s log.
                </p>
                <div className="mt-4 flex w-full flex-col gap-2">
                  {SUGGESTIONS.map((s) => (
                    <button key={s} type="button" onClick={() => send(s)} className="btn btn-secondary h-auto justify-start py-2 text-left text-[13px] whitespace-normal">
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, i) =>
              m.role === "user" ? (
                <div key={i} className="flex justify-end">
                  <p className="max-w-[85%] rounded-2xl rounded-br-md bg-accent px-3.5 py-2 text-[13px] whitespace-pre-wrap text-accent-fg">
                    {m.content}
                  </p>
                </div>
              ) : (
                <div key={i} className="flex items-end gap-2">
                  <FitBotAvatar className="size-6" />
                  <p className="max-w-[85%] rounded-2xl rounded-bl-md bg-surface-2 px-3.5 py-2 text-[13px] whitespace-pre-wrap text-fg">
                    {m.content}
                  </p>
                </div>
              ),
            )}

            {pending && (
              <div className="flex items-end gap-2">
                <FitBotAvatar className="size-6" />
                <div role="status" aria-label="FitBot is typing" className="flex gap-1 rounded-2xl rounded-bl-md bg-surface-2 px-3.5 py-3">
                  {[0, 150, 300].map((delay) => (
                    <span key={delay} className="size-1.5 animate-bounce rounded-full bg-fg-subtle" style={{ animationDelay: `${delay}ms` }} />
                  ))}
                </div>
              </div>
            )}

            {error && (
              <div role="alert" className="rounded-lg border border-danger/20 bg-danger-soft px-3 py-2.5 text-[13px] text-danger-text">
                <p>{error}</p>
                {lastIsUser && (
                  <button
                    type="button"
                    onClick={() => void request(messages)}
                    className="mt-2 inline-flex cursor-pointer items-center gap-1.5 rounded font-medium underline-offset-2 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <RotateCcw aria-hidden className="size-3.5" /> Try again
                  </button>
                )}
              </div>
            )}
          </div>

          <form onSubmit={onSubmit} className="flex items-center gap-2 border-t border-border p-3">
            <label htmlFor="fitbot-input" className="sr-only">
              Message FitBot
            </label>
            <input
              ref={inputRef}
              id="fitbot-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask FitBot…"
              maxLength={2000}
              autoComplete="off"
              className="input"
            />
            <button type="submit" aria-label="Send" disabled={pending || !input.trim()} className="btn btn-primary btn-icon h-10 w-10">
              <SendHorizontal aria-hidden className="size-4" />
            </button>
          </form>
        </section>
      )}

      <button
        ref={toggleRef}
        type="button"
        aria-label={open ? "Close FitBot" : "Open FitBot, your fitness coach"}
        aria-expanded={open}
        aria-controls="fitbot-panel"
        onClick={() => (open ? close() : setOpen(true))}
        className="fixed right-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-40 flex size-14 cursor-pointer items-center justify-center rounded-full shadow-pop outline-none transition-transform duration-150 ease-out hover:scale-105 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg active:scale-95 sm:right-6"
      >
        {open ? (
          <span className="flex size-full items-center justify-center rounded-full bg-fg text-bg">
            <X aria-hidden className="size-5" />
          </span>
        ) : (
          <FitBotAvatar className="size-full" />
        )}
      </button>
    </>
  );
}
