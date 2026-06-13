type StatusPillProps = {
  children: React.ReactNode;
  tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'info';
};

const tones = {
  neutral: 'border-line bg-surface-muted text-muted',
  success: 'border-emerald-200 bg-emerald-100 text-emerald-800',
  warning: 'border-amber-200 bg-amber-100 text-amber-800',
  danger: 'border-red-200 bg-red-100 text-red-800',
  info: 'border-cyan-200 bg-cyan-50 text-cyan-800'
};

export function StatusPill({ children, tone = 'neutral' }: StatusPillProps) {
  return <span className={`inline-flex h-[22px] items-center whitespace-nowrap rounded-md border px-2 text-[0.68rem] font-semibold uppercase leading-none ${tones[tone]}`}>{children}</span>;
}
