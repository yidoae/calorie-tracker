import Dashboard from "@/components/Dashboard";

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Calorie Tracker</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Snap your meal, we&apos;ll do the math.</p>
      </header>
      <Dashboard />
    </main>
  );
}
