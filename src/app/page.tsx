import Dashboard from "@/components/Dashboard";
import ErrorBoundary from "@/components/ErrorBoundary";
import FitBot from "@/components/fitbot/FitBot";

export default function Home() {
  return (
    <>
      <Dashboard />
      <ErrorBoundary title="FitBot yüklenemedi" compact>
        <FitBot />
      </ErrorBoundary>
    </>
  );
}
