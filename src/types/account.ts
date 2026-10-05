import { z } from "./zod";

export const EXPORT_FORMATS = ["json", "csv"] as const;
export const exportFormatSchema = z.enum(EXPORT_FORMATS);
export type ExportFormat = z.infer<typeof exportFormatSchema>;

/** DELETE /api/me: the password confirms the account owner really wants everything gone. */
export const deleteAccountSchema = z.object({ password: z.string().min(1).max(200) });
