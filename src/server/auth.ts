import { createHash, randomBytes } from "node:crypto";
import { hash, verify } from "@node-rs/argon2";
import { cookies } from "next/headers";
import type { User } from "@prisma/client";
import { db } from "./db";
import type { PublicUser } from "@/types/auth";

export const SESSION_COOKIE = "ct_session";
/*
 * Sessions are short on purpose: the cookie has no expiry (the browser drops it when it closes),
 * the server ends a session after 30 minutes without a request, and after 12 hours in any case.
 * So opening the site again later always asks for the password.
 */
const IDLE_MS = 30 * 60 * 1000;
const MAX_AGE_MS = 12 * 60 * 60 * 1000;
/** Sliding expiry is written at most this often, not on every request. */
const RENEW_AFTER_MS = 5 * 60 * 1000;


export const toPublicUser = (u: Pick<User, "id" | "username">): PublicUser => ({ id: u.id, username: u.username });

// argon2id with OWASP's recommended minimum (19 MiB, 2 passes). Salt is random per hash and
// stored inside the encoded string, so nobody — admins included — can read passwords back.
const ARGON2_OPTIONS = { memoryCost: 19456, timeCost: 2, parallelism: 1 } as const;

export const hashPassword = (password: string) => hash(password, ARGON2_OPTIONS);

export async function verifyPassword(passwordHash: string, password: string): Promise<boolean> {
  try {
    return await verify(passwordHash, password);
  } catch {
    return false;
  }
}

/**
 * Verified when a username doesn't exist, so a login for an unknown user takes as long as a
 * wrong password and response timing doesn't reveal which usernames are registered.
 */
let dummyHash: Promise<string> | null = null;
export async function burnPasswordCheck(password: string) {
  dummyHash ??= hashPassword(randomBytes(16).toString("hex"));
  await verifyPassword(await dummyHash, password);
}

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

/** Creates a session row and sets the httpOnly browser-session cookie. Call only from Route Handlers. */
export async function startSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  await db.session.create({ data: { tokenHash: hashToken(token), userId, expiresAt: new Date(Date.now() + IDLE_MS) } });
  // No `expires`/`maxAge`: a session cookie, gone when the browser is closed.
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
}

export async function endSession() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) await db.session.deleteMany({ where: { tokenHash: hashToken(token) } });
  store.delete(SESSION_COOKIE);
}

/**
 * The signed-in user for this request, or null. Idle (30 min) or old (12 h) sessions are removed
 * on sight; an active one has its idle deadline pushed forward (capped at the 12-hour limit).
 */
export async function getCurrentUser(): Promise<User | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await db.session.findUnique({ where: { tokenHash: hashToken(token) }, include: { user: true } });
  if (!session) return null;
  const now = Date.now();
  const hardLimit = session.createdAt.getTime() + MAX_AGE_MS;
  if (session.expiresAt.getTime() <= now || hardLimit <= now) {
    await db.session.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }
  if (session.expiresAt.getTime() - now < IDLE_MS - RENEW_AFTER_MS) {
    const expiresAt = new Date(Math.min(now + IDLE_MS, hardLimit));
    await db.session.update({ where: { id: session.id }, data: { expiresAt } }).catch(() => {});
  }
  return session.user;
}

