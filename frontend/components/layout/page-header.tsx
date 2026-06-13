type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  children?: React.ReactNode;
};

export function PageHeader({ eyebrow, title, description, children }: PageHeaderProps) {
  return (
    <header className="rounded-[1.5rem] border border-line bg-surface/95 px-5 py-5 shadow-warm-sm md:px-6 md:py-6">
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
      <div>
        {eyebrow ? <p className="mb-2 text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-accent">{eyebrow}</p> : null}
        <h1 className="max-w-4xl text-balance text-3xl font-semibold tracking-[-0.055em] text-ink md:text-4xl">{title}</h1>
        {description ? <p className="mt-3 max-w-2xl text-pretty text-sm leading-6 text-muted">{description}</p> : null}
      </div>
      {children}
      </div>
    </header>
  );
}
