import { Flame } from "lucide-react";
import Dashboard from "@/components/Dashboard";
import FitBot from "@/components/FitBot";

export default function Home() {
  return (
    <>
      <header className="border-b border-border bg-surface/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 w-full max-w-7xl items-center gap-3 px-4 sm:px-6">
          <div aria-hidden className="flex size-7 items-center justify-center rounded-md bg-accent text-accent-fg shadow-xs">
            <Flame className="size-4" strokeWidth={2.25} />
          </div>
          <div className="min-w-0">
            <h1 className="text-[15px] leading-tight font-semibold">Calorie Tracker</h1>
            <p className="truncate text-xs text-fg-subtle">Snap your meal, we&apos;ll do the math.</p>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 pt-4 pb-24 sm:px-6 lg:pt-8">
        <Dashboard />
      </main>
      <FitBot />
    </>
  );
}
