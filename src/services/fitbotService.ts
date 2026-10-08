import { chatResponseSchema, chatStreamEventSchema, type ChatMessage, type ChatResponse, type FitBotClientContext } from "@/types/fitbot";
import { ApiError, request, requestStream } from "./http";

/** FitBot chat endpoint. */
export const fitbotService = {
  chat(messages: ChatMessage[], context: FitBotClientContext): Promise<ChatResponse> {
    return request("/api/fitbot/chat", chatResponseSchema, { json: { messages, context } });
  },

  /**
   * Same as `chat`, but the reply streams in: `onText` gets the text written so far each time it
   * changes. Resolves with the final reply and its sources.
   */
  async chatStream(messages: ChatMessage[], context: FitBotClientContext, onText: (text: string) => void): Promise<ChatResponse> {
    let text = "";
    let result: ChatResponse | null = null;
    await requestStream("/api/fitbot/chat", chatStreamEventSchema, { json: { messages, context, stream: true } }, (event) => {
      if (event.type === "delta") onText((text += event.text));
      else if (event.type === "reset") onText((text = ""));
      else if (event.type === "done") result = { reply: event.reply, sources: event.sources };
      else throw new ApiError(event.error, 502);
    });
    if (!result) throw new ApiError("Bağlantı yanıt gelirken koptu. Tekrar dene.", 0);
    return result;
  },
};
