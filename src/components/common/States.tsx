import type { ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { Link } from "@tanstack/react-router";

export function EmptyState({ icon, title, body, action }: { icon?: ReactNode; title: string; body?: string; action?: ReactNode }) {
  return (
    <div className="glass flex flex-col items-center rounded-[26px] px-6 py-12 text-center">
      {icon && <div className="mb-3 grid size-12 place-items-center rounded-2xl bg-secondary text-primary">{icon}</div>}
      <h3 className="font-display text-lg font-semibold">{title}</h3>
      {body && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{body}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="glass flex items-center gap-3 rounded-2xl border-destructive/30 p-4 text-sm">
      <AlertTriangle className="size-4 shrink-0 text-destructive" />
      <span className="flex-1 text-muted-foreground">{message}</span>
      {onRetry && (
        <button onClick={onRetry} className="rounded-full bg-secondary px-3 py-1.5 text-xs font-semibold hover:bg-surface-strong">
          Retry
        </button>
      )}
    </div>
  );
}

export function SignInPrompt({ what }: { what: string }) {
  return (
    <EmptyState
      title={`Sign in to ${what}`}
      body="Your library, history and AI tools are saved to your Shivkaran account."
      action={
        <Link to="/auth" className="rounded-full bg-primary px-5 py-2.5 font-display text-[13px] font-semibold text-primary-foreground">
          Sign in
        </Link>
      }
    />
  );
}

export function SectionHeader({ title, sub, action }: { title: string; sub?: string; action?: ReactNode }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div className="min-w-0">
        <h2 className="font-display text-[20px] font-semibold">{title}</h2>
        {sub && <p className="mt-0.5 truncate text-[13px] text-muted-foreground">{sub}</p>}
      </div>
      {action}
    </div>
  );
}
