"use client";

import { ChevronDown, Download, LineChart, Loader2, LogOut, SlidersHorizontal, UserX } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useRef } from "react";
import { useAccountDeletion, useDataExport } from "@/hooks/useAccountData";
import { useAuth } from "@/hooks/useAuth";
import { useDisclosure } from "@/hooks/useDisclosure";
import { ROUTES } from "@/lib/routes";
import type { ExportFormat } from "@/types/account";
import DeleteAccountDialog from "../auth/DeleteAccountDialog";
import Avatar from "../ui/Avatar";
import LogoMark from "../ui/LogoMark";

interface Props {
  /** "Beslenme planım" on the dashboard: brings the plan card into view. Elsewhere it opens /plan. */
  onOpenProfile?: () => void;
}

const MotionLink = motion.create(Link);

/** Main sections for members; the active one wears a lime pill that slides between them. */
const NAV = [
  { href: ROUTES.panel, label: "Panel" },
  { href: ROUTES.plan, label: "Plan" },
  { href: ROUTES.progress, label: "Gelişim" },
] as const;

/**
 * Ink navigation bar: the animated brand (a calorie ring that draws itself around a flickering
 * flame; hovering closes the ring), section pills for members, then "Giriş Yap / Kayıt Ol" or
 * the profile menu.
 */
export default function SiteHeader({ onOpenProfile }: Props) {
  const { status, user, openAuth } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const openPlan = onOpenProfile ?? (() => router.push("/plan?duzenle=1"));

  return (
    <header className="bg-ink text-on-ink">
      <nav aria-label="Ana menü" className="mx-auto flex h-16 w-full max-w-7xl items-center gap-4 px-4 sm:h-20 sm:px-6">
        <MotionLink
          href="/"
          initial="hidden"
          animate="rest"
          whileHover="hover"
          className="flex min-w-0 items-center gap-3 rounded-[10px] outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <LogoMark size={40} />
          <span className="min-w-0">
            <span className="block truncate font-display text-lg leading-tight">
              Kalori <span className="text-cta">Takip</span>
            </span>
            <span className="hidden truncate text-xs text-on-ink-muted sm:block">Öğününün fotoğrafını çek, hesabı biz yapalım.</span>
          </span>
        </MotionLink>

        {user && (
          <ul className="ml-4 hidden items-center gap-1 rounded-full border border-ink-2 p-1 md:flex">
            {NAV.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`relative flex h-8 items-center rounded-full px-4 text-sm font-semibold outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-ring ${
                      active ? "text-cta-fg" : "text-on-ink-muted hover:text-on-ink"
                    }`}
                  >
                    {active && (
                      <motion.span layoutId="site-nav-pill" transition={{ type: "spring", stiffness: 380, damping: 30 }} className="absolute inset-0 rounded-full bg-cta" />
                    )}
                    <span className="relative">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}

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
  const exporter = useDataExport();
  const deletion = useAccountDeletion();
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
            <Link href={ROUTES.progress} role="menuitem" onClick={menu.close} className={item}>
              <LineChart aria-hidden className="size-4 text-fg-muted" />
              Gelişim &amp; Analiz
            </Link>
          </div>
          <div className="mt-2 border-t border-border pt-2">
            {(["json", "csv"] as ExportFormat[]).map((format) => (
              <button
                key={format}
                type="button"
                role="menuitem"
                disabled={exporter.exporting !== null}
                onClick={() => void exporter.download(format)}
                className={`${item} disabled:cursor-wait disabled:text-fg-subtle`}
              >
                {exporter.exporting === format ? (
                  <Loader2 aria-hidden className="size-4 animate-spin text-fg-muted" />
                ) : (
                  <Download aria-hidden className="size-4 text-fg-muted" />
                )}
                Verilerimi indir ({format.toUpperCase()})
              </button>
            ))}
          </div>
          <div className="mt-2 border-t border-border pt-2">
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
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                menu.close();
                deletion.ask();
              }}
              className={`${item} text-danger-text hover:bg-danger-soft`}
            >
              <UserX aria-hidden className="size-4" />
              Hesabımı sil
            </button>
          </div>
        </div>
      )}
      <DeleteAccountDialog
        open={deletion.open}
        password={deletion.password}
        error={deletion.error}
        deleting={deletion.deleting}
        onPasswordChange={deletion.setPassword}
        onSubmit={(e) => void deletion.submit(e)}
        onClose={deletion.close}
      />
    </div>
  );
}
