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
    border: 'border-zinc-200',
    icon: 'text-zinc-500',
    value: 'text-zinc-900'
  },
  success: {
    border: 'border-emerald-200',
    icon: 'text-emerald-600',
    value: 'text-emerald-700'
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
    <div className={`rounded-xl border bg-white px-5 py-4 ${styles.border} ${className}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-zinc-500">{title}</p>
          <p className={`mt-1 text-2xl font-bold ${styles.value}`}>{value}</p>
          {trend && (
            <p className={`mt-1 text-xs font-medium ${trend.value >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {trend.value >= 0 ? '+' : ''}{trend.value}% {trend.label}
            </p>
          )}
        </div>
        {icon && <div className={`${styles.icon}`}>{icon}</div>}
      </div>
    </div>
  );
}
