import type { InputHTMLAttributes } from 'react';

type TextInputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
  helper?: string;
};

export function TextInput({ label, error, helper, className = '', ...props }: TextInputProps) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-ink">{label}</span>
      <input
        className={`mt-2 min-h-11 w-full rounded-2xl border border-line bg-surface px-4 py-3 text-sm text-ink outline-none transition duration-200 placeholder:text-muted/60 focus:border-accent focus:ring-4 focus:ring-accent/10 ${error ? 'border-red-300 focus:border-red-600 focus:ring-red-100' : ''} ${className}`}
        aria-invalid={error ? true : undefined}
        {...props}
      />
      {error ? <span className="mt-2 block text-sm text-red-700">{error}</span> : null}
      {!error && helper ? <span className="mt-2 block text-sm text-muted">{helper}</span> : null}
    </label>
  );
}
