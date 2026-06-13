type SectionCardProps = {
  title?: string;
  children: React.ReactNode;
  className?: string;
};

export function SectionCard({ title, children, className = '' }: SectionCardProps) {
  return (
    <section className={`rounded-[1.35rem] border border-line bg-surface p-5 shadow-warm-sm ${className}`}>
      {title ? <h2 className="mb-4 text-base font-semibold tracking-[-0.025em] text-ink">{title}</h2> : null}
      {children}
    </section>
  );
}
