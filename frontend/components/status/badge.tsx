type BadgeProps = {
  children: React.ReactNode;
  tone?: 'neutral' | 'success' | 'warning' | 'danger';
  variant?: 'default' | 'issued' | 'draft' | 'pending' | 'failed';
};

const tones = {
  neutral: 'border-zinc-200 bg-zinc-50 text-zinc-700',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  warning: 'border-amber-200 bg-amber-50 text-amber-800',
  danger: 'border-red-200 bg-red-50 text-red-800'
};

const variants = {
  default: '',
  issued: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  draft: 'border-blue-200 bg-blue-50 text-blue-800',
  pending: 'border-amber-200 bg-amber-50 text-amber-800',
  failed: 'border-red-200 bg-red-50 text-red-800',
};

export function Badge({ children, tone = 'neutral', variant = 'default' }: BadgeProps) {
  const toneStyle = tones[tone];
  const variantStyle = variant !== 'default' ? variants[variant] : '';
  return <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${variantStyle || toneStyle}`}>{children}</span>;
}
