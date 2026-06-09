import Link from 'next/link';

type EmptyStateProps = {
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
};

export function EmptyState({ title, description, actionHref, actionLabel }: EmptyStateProps) {
  return (
    <div className="rounded-[1.5rem] border border-dashed border-zinc-300 bg-white p-8 text-center">
      <h2 className="text-xl font-semibold tracking-[-0.03em] text-zinc-950">{title}</h2>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-zinc-600">{description}</p>
      {actionHref && actionLabel ? (
        <Link href={actionHref} className="mt-6 inline-flex rounded-full bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white transition active:scale-[0.98]">
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}
