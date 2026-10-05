import { z } from "./zod";

/** Every API error response has this shape: `{ "error": "<Turkish message for the user>" }`. */
export const apiErrorSchema = z.object({ error: z.string() });
export type ApiErrorBody = z.infer<typeof apiErrorSchema>;
