"use client";

import { useState } from "react";
import { errorMessage } from "@/services/http";
import { fitbotService } from "@/services/fitbotService";
import { planForFitbot } from "@/lib/nutrition/plan";
import type { ChatMessage, FitBotClientContext, FitBotSource } from "@/types/fitbot";
import { useNutritionPlan } from "./useNutritionPlan";

/** A chat message as shown in the widget; `sources` are only kept client-side, never sent back. */
export type UiMessage = ChatMessage & { sources?: FitBotSource[] };

export const FITBOT_SUGGESTIONS = [
  "Bugünün geri kalanında ne yemeliyim?",
  "Günde ne kadar proteine ihtiyacım var?",
  "Haftada 0,5 kg vermek için kaç kalori almalıyım?",
  "Bacak gününden sonra nasıl toparlanmalıyım?",
];

/** The active profile/plan and local "today", so the server can personalise FitBot's answers. */
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
 * FitBot conversation state. The history lives in memory only; each request sends it with the
 * active profile/plan, and the server adds today's meals from the DB.
 */
export function useFitBot() {
  const { plan, legacyProfile, legacyCustomPlan } = useNutritionPlan();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function request(history: UiMessage[]) {
    setError(null);
    setPending(true);
    try {
      // The wizard plan is sent in FitBot's existing shape: its body data + today's targets.
      const { profile, customPlan } = plan ? planForFitbot(plan, new Date()) : { profile: legacyProfile, customPlan: legacyCustomPlan };
      const { reply, sources } = await fitbotService.chat(
        history.map(({ role, content }) => ({ role, content })),
        buildContext(profile, customPlan),
      );
      setMessages((prev) => [...prev, { role: "assistant", content: reply, sources }]);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setPending(false);
    }
  }

  function send(text: string) {
    const content = text.trim();
    if (!content || pending) return;
    const history: UiMessage[] = [...messages, { role: "user", content }];
    setMessages(history);
    setInput("");
    void request(history);
  }

  const lastIsUser = messages.length > 0 && messages[messages.length - 1].role === "user";

  return {
    open,
    setOpen,
    messages,
    input,
    setInput,
    pending,
    error,
    send,
    canRetry: lastIsUser && !pending,
    retry: () => void request(messages),
    reset: () => {
      setMessages([]);
      setError(null);
    },
  };
}
