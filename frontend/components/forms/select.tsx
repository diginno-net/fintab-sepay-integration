'use client';

import type { SelectHTMLAttributes } from 'react';
import { useState, useRef, useEffect } from 'react';

type SelectInputProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  error?: string;
  searchable?: boolean;
};

export function SelectInput({ label, error, searchable = false, children, className = '', value, onChange, ...props }: SelectInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [internalValue, setInternalValue] = useState(value as string);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleChange = (newValue: string) => {
    setInternalValue(newValue);
    if (onChange) {
      const event = { target: { value: newValue } } as React.ChangeEvent<HTMLSelectElement>;
      onChange(event);
    }
    setIsOpen(false);
    setSearch('');
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const options = Array.isArray(children) ? children.filter(c => c && typeof c === 'object' && 'type' in c) : [];

  if (searchable) {
    return (
      <div ref={containerRef}>
        <label className="block">
          <span className="text-sm font-semibold text-ink">{label}</span>
          <div className="relative mt-2">
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className={`flex min-h-11 w-full items-center justify-between rounded-2xl border border-line bg-surface px-4 py-3 text-sm outline-none transition duration-200 focus:border-accent focus:ring-4 focus:ring-accent/10 ${className}`}
            >
              <span className={internalValue ? 'text-ink' : 'text-muted/70'}>
                {internalValue ? (options as React.ReactElement<{ children: React.ReactNode; value: string }>[])?.find(o => o.props.value === internalValue)?.props.children : 'Chọn...'}
              </span>
              <span className="text-muted">{isOpen ? '▲' : '▼'}</span>
            </button>

            {isOpen && (
              <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-2xl border border-line bg-surface shadow-warm">
                <div className="border-b border-line p-2">
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Tìm kiếm..."
                    className="w-full rounded-xl border border-line bg-white px-3 py-2 text-sm outline-none focus:border-accent focus:ring-4 focus:ring-accent/10"
                    autoFocus
                  />
                </div>
                <div className="max-h-48 overflow-y-auto">
                  {(options as React.ReactElement<{ children: React.ReactNode; value: string }>[])
                    .filter((opt) =>
                      String(opt.props.children).toLowerCase().includes(search.toLowerCase())
                    )
                    .map((opt) => (
                      <button
                        key={opt.props.value}
                        type="button"
                        onClick={() => handleChange(opt.props.value)}
                        className={`w-full px-4 py-2.5 text-left text-sm transition hover:bg-surface-muted ${
                          opt.props.value === internalValue ? 'bg-accent/10 text-accent' : 'text-ink'
                        }`}
                      >
                        {opt.props.children}
                      </button>
                    ))}
                </div>
              </div>
            )}
          </div>
          {error ? <span className="mt-2 block text-sm text-red-700">{error}</span> : null}
        </label>
      </div>
    );
  }

  return (
    <label className="block">
      <span className="text-sm font-semibold text-ink">{label}</span>
      <select
        value={value}
        onChange={onChange}
        className={`mt-2 min-h-11 w-full rounded-2xl border border-line bg-surface px-4 py-3 text-sm text-ink outline-none transition duration-200 focus:border-accent focus:ring-4 focus:ring-accent/10 ${className}`}
        aria-invalid={error ? true : undefined}
        {...props}
      >
        {children}
      </select>
      {error ? <span className="mt-2 block text-sm text-red-700">{error}</span> : null}
    </label>
  );
}
