export function CodeCell({ children }: { children: React.ReactNode }) {
  return <span className="inline-flex min-w-8 items-center justify-center rounded-lg bg-surface-muted px-2 py-1 font-mono text-xs font-semibold text-ink">{children}</span>;
}
