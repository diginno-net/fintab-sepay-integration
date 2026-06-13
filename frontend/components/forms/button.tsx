import type { ButtonHTMLAttributes } from 'react';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'table';
  size?: 'sm' | 'md' | 'lg';
};

const variants = {
  primary: 'bg-accent text-white shadow-warm-sm hover:bg-[#1f604f]',
  secondary: 'border border-line bg-surface text-ink hover:border-accent/40 hover:bg-white',
  ghost: 'bg-transparent text-muted hover:bg-surface-muted/70 hover:text-ink',
  table: 'border border-line bg-white/50 text-ink hover:border-accent/35 hover:bg-surface-muted/60'
};

const sizes = {
  sm: 'min-h-8 px-3 text-xs gap-1.5',
  md: 'min-h-11 px-5 text-sm gap-2',
  lg: 'min-h-12 px-6 text-base gap-2'
};

export function Button({ className = '', variant = 'primary', size = 'md', ...props }: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-full font-semibold transition duration-200 active:translate-y-px active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    />
  );
}
