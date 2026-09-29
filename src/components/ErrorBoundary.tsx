"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import ErrorFallback from "./ui/ErrorFallback";

interface Props {
  children: ReactNode;
  /** Title of the fallback card, e.g. "Geçmiş yüklenemedi". */
  title?: string;
  compact?: boolean;
}

interface State {
  error: Error | null;
}

/**
 * Catches render errors in a section so one broken block doesn't blank the whole page. "Tekrar
 * dene" remounts the section. (Error boundaries must be class components.)
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("UI section crashed:", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return <ErrorFallback title={this.props.title} compact={this.props.compact} onRetry={() => this.setState({ error: null })} />;
    }
    return this.props.children;
  }
}
