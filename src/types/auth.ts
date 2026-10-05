import { z } from "./zod";

export const USERNAME_RE = /^[a-z0-9_.]{3,24}$/;
export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 128;

/** Username + password, as typed. Usernames are case-insensitive and stored lower-cased. */
export const credentialsSchema = z.object({
  username: z
    .string({ error: "Kullanıcı adı ve şifre gerekli." })
    .trim()
    .toLowerCase()
    .regex(USERNAME_RE, "Kullanıcı adı 3–24 karakter olmalı: harf, rakam, _ veya ."),
  password: z
    .string({ error: "Kullanıcı adı ve şifre gerekli." })
    .min(PASSWORD_MIN, `Şifre en az ${PASSWORD_MIN} karakter olmalı.`)
    .max(PASSWORD_MAX, `Şifre en fazla ${PASSWORD_MAX} karakter olabilir.`),
});
export type Credentials = z.infer<typeof credentialsSchema>;

/** The signed-in account as the client sees it (never includes the password hash). */
export const publicUserSchema = z.object({ id: z.string(), username: z.string() });
export type PublicUser = z.infer<typeof publicUserSchema>;

export const authResponseSchema = z.object({ user: publicUserSchema });
export const meResponseSchema = z.object({ user: publicUserSchema.nullable(), settings: z.unknown() });
