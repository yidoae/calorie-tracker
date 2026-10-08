"use client";

import { RotateCcw, SendHorizontal, X } from "lucide-react";
import { useEffect, useRef, type FormEvent } from "react";
import { FITBOT_SUGGESTIONS, useFitBot } from "@/hooks/useFitBot";
import FitBotAvatar from "../ui/FitBotAvatar";

/**
 * Floating chat widget (bottom-right) for FitBot, the local-LLM fitness coach. State lives in
 * useFitBot; this component only renders it and manages focus/scroll.
 */
export default function FitBot() {
  const bot = useFitBot();
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  // Keep the newest message (or the reply being written / error) in view.
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [bot.messages, bot.pending, bot.draft, bot.error, bot.open]);

  useEffect(() => {
    if (bot.open) inputRef.current?.focus();
  }, [bot.open]);

  function close() {
    bot.setOpen(false);
    toggleRef.current?.focus();
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    bot.send(bot.input);
  }

  return (
    <>
      {bot.open && (
        <section
          id="fitbot-panel"
          role="dialog"
          aria-label="FitBot sohbeti"
          onKeyDown={(e) => {
            if (e.key === "Escape") close();
          }}
          className="card fixed right-4 bottom-[max(5.5rem,calc(env(safe-area-inset-bottom)+5rem))] z-40 flex h-[min(34rem,calc(100dvh-7.5rem))] w-[min(24rem,calc(100vw-2rem))] animate-enter flex-col overflow-hidden shadow-overlay sm:right-6"
        >
          <header className="flex items-center gap-3 bg-ink px-4 py-3 text-on-ink [&_.btn-ghost]:text-on-ink-muted [&_.btn-ghost:hover]:bg-ink-2 [&_.btn-ghost:hover]:text-on-ink">
            <FitBotAvatar className="size-9" />
            <div className="min-w-0 flex-1">
              <h2 className="font-display text-base">FitBot</h2>
              <p className="truncate text-xs text-on-ink-muted">Fitness ve beslenme koçun · yerel yapay zekâ</p>
            </div>
            {bot.messages.length > 0 && (
              <button type="button" aria-label="Yeni sohbet başlat" onClick={() => { bot.reset(); inputRef.current?.focus(); }} disabled={bot.pending} className="btn btn-ghost btn-icon-sm">
                <RotateCcw aria-hidden className="size-4" />
              </button>
            )}
            <button type="button" aria-label="FitBot'u kapat" onClick={close} className="btn btn-ghost btn-icon-sm">
              <X aria-hidden className="size-4" />
            </button>
          </header>

          <div ref={listRef} aria-live="polite" className="flex-1 space-y-3 overflow-y-auto overscroll-contain px-4 py-4">
            {bot.messages.length === 0 && (
              <div className="flex flex-col items-center pt-4 text-center">
                <FitBotAvatar className="size-14" />
                <p className="mt-3 text-sm font-medium">Selam, ben FitBot! 💪</p>
                <p className="mt-1 max-w-64 text-[13px] text-fg-subtle">
                  Antrenman, kalori, makrolar ya da toparlanma hakkında sor. Profilini ve bugünkü kaydını görebiliyorum.
                </p>
                <div className="mt-4 flex w-full flex-col gap-2">
                  {FITBOT_SUGGESTIONS.map((s) => (
                    <button key={s} type="button" onClick={() => bot.send(s)} className="btn btn-secondary h-auto justify-start py-2 text-left text-[13px] whitespace-normal">
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {bot.messages.map((m, i) =>
              m.role === "user" ? (
                <div key={i} className="flex justify-end">
                  <p className="max-w-[85%] rounded-[16px] rounded-br-[4px] bg-ink px-4 py-2 text-[13px] whitespace-pre-wrap text-on-ink">{m.content}</p>
                </div>
              ) : (
                <div key={i} className="flex items-end gap-2">
                  <FitBotAvatar className="size-6" />
                  <div className="max-w-[85%] rounded-[16px] rounded-bl-[4px] border border-border bg-surface-2 px-4 py-2 text-[13px] text-fg">
                    <p className="whitespace-pre-wrap">{m.content}</p>
                    {m.sources && m.sources.length > 0 && (
                      <ol aria-label="Kaynaklar" className="mt-2 space-y-1 border-t border-border pt-2 text-[11px] leading-snug text-fg-subtle">
                        {m.sources.map((s) => (
                          <li key={s.n} title={s.source}>
                            <span className="font-medium text-fg-muted">[{s.n}]</span> {s.title}
                            {s.heading ? ` — ${s.heading}` : ""}
                            <span className="block truncate">{s.source}</span>
                          </li>
                        ))}
                      </ol>
                    )}
                  </div>
                </div>
              ),
            )}

            {bot.pending && bot.draft && (
              <div className="flex items-end gap-2">
                <FitBotAvatar className="size-6" />
                <p className="max-w-[85%] rounded-[16px] rounded-bl-[4px] border border-border bg-surface-2 px-4 py-2 text-[13px] whitespace-pre-wrap text-fg">{bot.draft}</p>
              </div>
            )}

            {bot.pending && !bot.draft && (
              <div className="flex items-end gap-2">
                <FitBotAvatar className="size-6" />
                <div role="status" aria-label="FitBot yazıyor" className="flex gap-1 rounded-[16px] rounded-bl-[4px] border border-border bg-surface-2 px-4 py-3">
                  {[0, 150, 300].map((delay) => (
                    <span key={delay} className="size-1.5 animate-bounce rounded-full bg-fg-subtle" style={{ animationDelay: `${delay}ms` }} />
                  ))}
                </div>
              </div>
            )}

            {bot.error && (
              <div role="alert" className="rounded-[6px] border border-danger-text/30 bg-danger-soft px-3 py-2 text-[13px] text-danger-text">
                <p>{bot.error}</p>
                {bot.canRetry && (
                  <button type="button" onClick={bot.retry} className="mt-2 inline-flex cursor-pointer items-center gap-1.5 rounded font-medium underline-offset-2 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring">
                    <RotateCcw aria-hidden className="size-3.5" /> Tekrar dene
                  </button>
                )}
              </div>
            )}
          </div>

          <form onSubmit={onSubmit} className="flex items-center gap-2 border-t border-border p-3">
            <label htmlFor="fitbot-input" className="sr-only">
              FitBot&apos;a mesaj yaz
            </label>
            <input
              ref={inputRef}
              id="fitbot-input"
              value={bot.input}
              onChange={(e) => bot.setInput(e.target.value)}
              placeholder="FitBot'a sor…"
              maxLength={2000}
              autoComplete="off"
              className="input"
            />
            <button type="submit" aria-label="Gönder" disabled={bot.pending || !bot.input.trim()} className="btn btn-primary btn-icon size-10">
              <SendHorizontal aria-hidden className="size-4" />
            </button>
          </form>
        </section>
      )}

      <button
        ref={toggleRef}
        type="button"
        aria-label={bot.open ? "FitBot'u kapat" : "Fitness koçun FitBot'u aç"}
        aria-expanded={bot.open}
        aria-controls="fitbot-panel"
        onClick={() => (bot.open ? close() : bot.setOpen(true))}
        className="fixed right-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-40 flex size-14 cursor-pointer items-center justify-center rounded-full shadow-pop outline-none transition-transform duration-150 ease-out hover:scale-105 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg active:scale-95 sm:right-6"
      >
        {bot.open ? (
          <span className="flex size-full items-center justify-center rounded-full bg-ink text-on-ink">
            <X aria-hidden className="size-5" />
          </span>
        ) : (
          <FitBotAvatar className="size-full" />
        )}
      </button>
    </>
  );
}
