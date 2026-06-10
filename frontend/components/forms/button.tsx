import type { ButtonHTMLAttributes } from 'react';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
};

const variants = {
  primary: 'bg-emerald-700 text-white hover:bg-emerald-800',
  secondary: 'border border-zinc-200 bg-white text-zinc-950 hover:border-zinc-300',
  ghost: 'bg-transparent text-zinc-700 hover:bg-zinc-100'
};

const sizes = {
  sm: 'h-8 px-3 text-xs gap-1.5',
  md: 'h-10 px-5 text-sm gap-2',
  lg: 'h-12 px-6 text-base gap-2'
};

export function Button({ className = '', variant = 'primary', size = 'md', ...props }: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-full font-semibold transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    />
  );
}
