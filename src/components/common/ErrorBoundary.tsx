import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";
import styles from "./ErrorBoundary.module.css";

interface Props {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Class-based error boundary. Catches render errors from descendant components,
 * shows a recoverable fallback, and exposes a reset callback to restart the tree.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // In a real app this would feed Sentry/Datadog.
    console.error("Unhandled error:", error, info);
  }

  reset = () => this.setState({ error: null });

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    if (this.props.fallback) return this.props.fallback(error, this.reset);
    return (
      <div role="alert" className={styles.alert}>
        <p className={styles.title}>Something went wrong</p>
        <p className={styles.message}>{error.message}</p>
        <button type="button" onClick={this.reset} className={styles.button}>
          Try again
        </button>
      </div>
    );
  }
}
