type SectionCardProps = {
  title?: string;
  children: React.ReactNode;
  className?: string;
};

export function SectionCard({ title, children, className = '' }: SectionCardProps) {
  return (
    <section className={`rounded-[1.5rem] border border-zinc-200 bg-white p-6 shadow-sm ${className}`}>
      {title ? <h2 className="mb-5 text-lg font-semibold tracking-[-0.03em] text-zinc-950">{title}</h2> : null}
      {children}
    </section>
  );
}
