"use client";

import { ChevronDown, Flame, LogOut, SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useDisclosure } from "@/hooks/useDisclosure";
import Avatar from "../ui/Avatar";

interface Props {
  /** "Beslenme planım" on the dashboard: brings the plan card into view. Elsewhere it opens /plan. */
  onOpenProfile?: () => void;
}

/** Ink navigation bar: brand on the left; "Giriş Yap / Kayıt Ol" or the profile menu on the right. */
export default function SiteHeader({ onOpenProfile }: Props) {
  const { status, user, openAuth } = useAuth();
  const router = useRouter();
  const openPlan = onOpenProfile ?? (() => router.push("/plan?duzenle=1"));

  return (
    <header className="bg-ink text-on-ink">
      <nav aria-label="Ana menü" className="mx-auto flex h-16 w-full max-w-7xl items-center gap-4 px-4 sm:h-20 sm:px-6">
        <Link href="/" className="flex min-w-0 items-center gap-3 rounded-[4px] outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <span aria-hidden className="flex size-10 shrink-0 items-center justify-center rounded-[4px] border-2 border-on-ink text-cta">
            <Flame className="size-5" strokeWidth={2.5} />
          </span>
          <span className="min-w-0">
            <span className="block truncate font-display text-lg leading-tight">Kalori Takip</span>
            <span className="hidden truncate text-xs text-on-ink-muted sm:block">Öğününün fotoğrafını çek, hesabı biz yapalım.</span>
          </span>
        </Link>

        <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-4">
          {status === "loading" ? (
            <span aria-hidden className="h-9 w-32 animate-pulse rounded-[4px] bg-ink-2" />
          ) : user ? (
            <ProfileMenu username={user.username} onOpenProfile={openPlan} />
          ) : (
            <>
              <button type="button" onClick={() => openAuth("login")} className="btn h-9 px-2 text-on-ink hover:text-cta focus-visible:ring-offset-ink">
                Giriş Yap
              </button>
              <button type="button" onClick={() => openAuth("register")} className="btn btn-on-ink h-10">
                Kayıt Ol
              </button>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}

function ProfileMenu({ username, onOpenProfile }: { username: string; onOpenProfile: () => void }) {
  const { logout } = useAuth();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menu = useDisclosure(rootRef, triggerRef);
  const item =
    "flex h-10 w-full cursor-pointer items-center gap-3 rounded-[4px] px-3 text-left text-sm font-medium text-fg outline-none hover:bg-surface-2 focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={menu.open}
        aria-controls="profile-menu"
        onClick={menu.toggle}
        className="flex h-10 cursor-pointer items-center gap-2 rounded-full border border-on-ink/30 py-1 pr-3 pl-1 outline-none transition-colors duration-150 hover:border-on-ink focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
      >
        <Avatar username={username} />
        <span className="hidden max-w-32 truncate text-sm font-semibold sm:block">{username}</span>
        <ChevronDown aria-hidden className={`size-4 transition-transform duration-200 ${menu.open ? "rotate-180" : ""}`} />
        <span className="sr-only">Profil menüsü</span>
      </button>

      {menu.open && (
        <div
          id="profile-menu"
          role="menu"
          aria-label="Profil"
          className="absolute top-full right-0 z-50 mt-2 w-64 animate-enter rounded-[10px] border border-border-strong bg-surface p-2 text-fg shadow-pop"
        >
          <div className="flex items-center gap-3 border-b border-border px-2 pt-1 pb-3">
            <Avatar username={username} large />
            <div className="min-w-0">
              <p className="truncate font-display text-base">{username}</p>
              <p className="text-xs text-fg-muted">Üye hesabı</p>
            </div>
          </div>
          <div className="pt-2">
            <button
              type="button"
              role="menuitem"
              autoFocus
              onClick={() => {
                menu.close();
                onOpenProfile();
              }}
              className={item}
            >
              <SlidersHorizontal aria-hidden className="size-4 text-fg-muted" />
              Beslenme planım
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                menu.close();
                void logout();
              }}
              className={`${item} hover:bg-danger-soft hover:text-danger-text`}
            >
              <LogOut aria-hidden className="size-4 text-fg-muted" />
              Çıkış yap
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
