import Link from 'next/link';

type ErpPaginationProps = {
  page: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  itemLabel: string;
  hrefForPage?: (page: number) => string;
  onPageChange?: (page: number) => void;
};

export function ErpPagination({ page, totalPages, pageSize, totalItems, itemLabel, hrefForPage, onPageChange }: ErpPaginationProps) {
  const start = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalItems);
  const pages = compactPages(page, totalPages);

  return (
    <div className="flex flex-col gap-3 text-sm text-muted md:flex-row md:items-center md:justify-between">
      <p>Hiển thị {start}-{end} của {totalItems.toLocaleString('vi-VN')} {itemLabel}</p>
      <div className="flex items-center gap-2">
        <PageControl disabled={page <= 1} page={Math.max(1, page - 1)} href={hrefForPage?.(Math.max(1, page - 1))} onPageChange={onPageChange}>‹</PageControl>
        {pages.map((item, index) => item === '...'
          ? <span key={`ellipsis-${index}`} className="px-1 text-muted">...</span>
          : <PageControl key={item} active={item === page} page={item} href={hrefForPage?.(item)} onPageChange={onPageChange}>{item}</PageControl>)}
        <PageControl disabled={page >= totalPages} page={Math.min(totalPages, page + 1)} href={hrefForPage?.(Math.min(totalPages, page + 1))} onPageChange={onPageChange}>›</PageControl>
        <span className="ml-2 rounded-lg border border-line px-3 py-1.5 text-ink">{pageSize} / trang</span>
      </div>
    </div>
  );
}

function PageControl({ children, page, href, onPageChange, active = false, disabled = false }: { children: React.ReactNode; page?: number; href?: string; onPageChange?: (page: number) => void; active?: boolean; disabled?: boolean }) {
  const cls = `inline-flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-sm font-medium ${active ? 'bg-accent text-white' : 'text-ink hover:bg-surface-muted'} ${disabled ? 'pointer-events-none opacity-40' : ''}`;
  if (href && !disabled) return <Link href={href} className={cls}>{children}</Link>;
  if (onPageChange && page && !disabled) return <button type="button" className={cls} onClick={() => onPageChange(page)}>{children}</button>;
  return <span className={cls}>{children}</span>;
}

function compactPages(page: number, totalPages: number): Array<number | '...'> {
  if (totalPages <= 6) return Array.from({ length: totalPages }, (_, i) => i + 1);
  return [1, ...(page > 3 ? ['...' as const] : []), ...[page - 1, page, page + 1].filter(p => p > 1 && p < totalPages), ...(page < totalPages - 2 ? ['...' as const] : []), totalPages];
}
