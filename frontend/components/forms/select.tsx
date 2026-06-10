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
      <label className="block" ref={containerRef}>
        <span className="text-sm font-medium text-zinc-800">{label}</span>
        <div className="relative mt-2">
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className={`flex h-12 w-full items-center justify-between rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-700 ${className}`}
          >
            <span className={internalValue ? 'text-zinc-900' : 'text-zinc-400'}>
              {internalValue ? (options as React.ReactElement<{ children: React.ReactNode; value: string }>[])?.find(o => o.props.value === internalValue)?.props.children : 'Chọn...'}
            </span>
            <span className="text-zinc-500">{isOpen ? '▲' : '▼'}</span>
          </button>

          {isOpen && (
            <div className="absolute z-50 mt-1 w-full rounded-xl border border-zinc-200 bg-white shadow-lg">
              <div className="border-b border-zinc-100 p-2">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Tìm kiếm..."
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-emerald-700"
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
                      className={`w-full px-4 py-2.5 text-left text-sm hover:bg-zinc-50 ${
                        opt.props.value === internalValue ? 'bg-emerald-50 text-emerald-700' : 'text-zinc-900'
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
    );
  }

  return (
    <label className="block">
      <span className="text-sm font-medium text-zinc-800">{label}</span>
      <select
        value={value}
        onChange={onChange}
        className={`mt-2 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-700 ${className}`}
        {...props}
      >
        {children}
      </select>
      {error ? <span className="mt-2 block text-sm text-red-700">{error}</span> : null}
    </label>
  );
}
