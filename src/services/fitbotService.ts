import { chatResponseSchema, type ChatMessage, type ChatResponse, type FitBotClientContext } from "@/types/fitbot";
import { request } from "./http";

/** FitBot chat endpoint. */
export const fitbotService = {
  chat(messages: ChatMessage[], context: FitBotClientContext): Promise<ChatResponse> {
    return request("/api/fitbot/chat", chatResponseSchema, { json: { messages, context } });
  },
};
