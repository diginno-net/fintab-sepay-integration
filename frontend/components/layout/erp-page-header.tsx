import Link from 'next/link';

type Breadcrumb = { label: string; href?: string };

type ErpPageHeaderProps = {
  breadcrumbs: Breadcrumb[];
  title: string;
  count?: number;
  backHref?: string;
  actions?: React.ReactNode;
};

export function ErpPageHeader({ breadcrumbs, title, count, backHref, actions }: ErpPageHeaderProps) {
  return (
    <header className="border-b border-line bg-surface px-4 py-3">
      <nav className="flex flex-wrap items-center gap-2 text-sm text-muted">
        {breadcrumbs.map((item, index) => (
          <span key={`${item.label}-${index}`} className="flex items-center gap-2">
            {item.href ? <Link href={item.href} className="hover:text-accent">{item.label}</Link> : <span className="font-medium text-accent">{item.label}</span>}
            {index < breadcrumbs.length - 1 ? <span className="text-line">/</span> : null}
          </span>
        ))}
      </nav>
      <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          {backHref ? <Link href={backHref} className="text-2xl leading-none text-ink hover:text-accent">‹</Link> : null}
          <h1 className="text-2xl font-semibold tracking-[-0.04em] text-ink">
            {title}{typeof count === 'number' ? <span className="text-muted"> ({count.toLocaleString('vi-VN')})</span> : null}
          </h1>
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
    </header>
  );
}
