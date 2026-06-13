import type { ReactNode } from 'react';

type StatCardProps = {
  title: string;
  value: string | number;
  icon?: ReactNode;
  tone?: 'neutral' | 'success' | 'warning' | 'danger';
  trend?: {
    value: number;
    label: string;
  };
  className?: string;
};

const toneStyles = {
  neutral: {
    border: 'border-line',
    icon: 'text-muted',
    value: 'text-ink'
  },
  success: {
    border: 'border-accent/25',
    icon: 'text-accent',
    value: 'text-accent'
  },
  warning: {
    border: 'border-amber-200',
    icon: 'text-amber-600',
    value: 'text-amber-700'
  },
  danger: {
    border: 'border-red-200',
    icon: 'text-red-600',
    value: 'text-red-700'
  }
};

export function StatCard({ title, value, icon, tone = 'neutral', trend, className = '' }: StatCardProps) {
  const styles = toneStyles[tone];

  return (
    <div className={`rounded-[1.35rem] border bg-surface px-5 py-4 shadow-warm-sm ${styles.border} ${className}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted">{title}</p>
          <p className={`mt-1 font-mono text-2xl font-semibold tracking-[-0.04em] tabular-nums ${styles.value}`}>{value}</p>
          {trend && (
            <p className={`mt-1 text-xs font-medium ${trend.value >= 0 ? 'text-accent' : 'text-red-600'}`}>
              {trend.value >= 0 ? '+' : ''}{trend.value}% {trend.label}
            </p>
          )}
        </div>
        {icon && <div className={`${styles.icon}`}>{icon}</div>}
      </div>
    </div>
  );
}
