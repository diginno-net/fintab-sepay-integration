type BadgeProps = {
  children: React.ReactNode;
  tone?: 'neutral' | 'success' | 'warning' | 'danger';
  variant?: 'default' | 'issued' | 'draft' | 'pending' | 'failed';
};

const tones = {
  neutral: 'border-line bg-surface-muted text-muted',
  success: 'border-accent/25 bg-accent/10 text-accent',
  warning: 'border-amber-200 bg-amber-50 text-amber-800',
  danger: 'border-red-200 bg-red-50 text-red-800'
};

const variants = {
  default: '',
  issued: 'border-accent/25 bg-accent/10 text-accent',
  draft: 'border-line bg-surface-muted text-muted',
  pending: 'border-amber-200 bg-amber-50 text-amber-800',
  failed: 'border-red-200 bg-red-50 text-red-800',
};

export function Badge({ children, tone = 'neutral', variant = 'default' }: BadgeProps) {
  const toneStyle = tones[tone];
  const variantStyle = variant !== 'default' ? variants[variant] : '';
  return <span className={`inline-flex min-h-7 items-center rounded-md border px-2.5 py-1 text-xs font-semibold leading-none ${variantStyle || toneStyle}`}>{children}</span>;
}
