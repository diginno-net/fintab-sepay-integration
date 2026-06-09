type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  children?: React.ReactNode;
};

export function PageHeader({ eyebrow, title, description, children }: PageHeaderProps) {
  return (
    <header className="flex flex-col gap-6 border-b border-zinc-200 pb-8 md:flex-row md:items-end md:justify-between">
      <div>
        {eyebrow ? <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">{eyebrow}</p> : null}
        <h1 className="text-4xl font-semibold tracking-[-0.05em] text-zinc-950 md:text-5xl">{title}</h1>
        {description ? <p className="mt-4 max-w-2xl text-sm leading-6 text-zinc-600">{description}</p> : null}
      </div>
      {children}
    </header>
  );
}
