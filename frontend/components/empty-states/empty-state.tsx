import Link from 'next/link';

type EmptyStateProps = {
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
};

export function EmptyState({ title, description, actionHref, actionLabel }: EmptyStateProps) {
  return (
    <div className="rounded-[1.75rem] border border-dashed border-line bg-surface p-8 text-center shadow-warm-sm">
      <div className="mx-auto mb-5 h-2 w-24 rounded-full bg-accent/25" />
      <h2 className="text-xl font-semibold tracking-[-0.035em] text-ink">{title}</h2>
      <p className="mx-auto mt-3 max-w-xl text-pretty text-sm leading-6 text-muted">{description}</p>
      {actionHref && actionLabel ? (
        <Link href={actionHref} className="mt-6 inline-flex min-h-11 items-center rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white transition duration-200 hover:bg-[#1f604f] active:translate-y-px active:scale-[0.98]">
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}
