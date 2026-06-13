type ErpTableProps = {
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
};

export function ErpTable({ children, footer, className = '' }: ErpTableProps) {
  return (
    <section className={`overflow-hidden rounded-xl border border-line bg-white ${className}`}>
      <div className="overflow-x-auto">{children}</div>
      {footer ? <div className="border-t border-line bg-white px-4 py-3">{footer}</div> : null}
    </section>
  );
}

export const erpTh = 'h-10 whitespace-nowrap border-r border-line/45 bg-[#f2f2f1] px-3 py-2 text-left text-[0.68rem] font-semibold uppercase tracking-[0.08em] text-muted last:border-r-0';
export const erpTd = 'h-11 border-r border-line/35 px-3 py-2 align-middle text-sm text-ink last:border-r-0';
