import type { ExportFormat } from "@/types/account";
import { request, requestFile } from "./http";

/** Account data endpoints (/api/me, /api/me/export). */
export const accountService = {
  exportData(format: ExportFormat): Promise<{ blob: Blob; filename: string }> {
    return requestFile(`/api/me/export?format=${format}`, `kalori-takip.${format}`);
  },

  /** Deletes the account and all its data. Throws ApiError 403 on a wrong password. */
  deleteAccount(password: string): Promise<void> {
    return request("/api/me", null, { method: "DELETE", json: { password } });
  },
};
