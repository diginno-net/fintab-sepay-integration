'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { listOrdersClient } from '@/features/orders/api-client';
import { extractOrderRows, orderId, orderCustomerName, orderTotal, orderDate } from '@/features/orders/order-helpers';

type OrderPickerProps = {
  shopId: string;
  value?: string;
  onChange: (orderId: string) => void;
  placeholder?: string;
  className?: string;
};

export function OrderPicker({ shopId, value, onChange, placeholder = 'Tìm kiếm đơn hàng...', className = '' }: OrderPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [orders, setOrders] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selectedOrder = orders.find((o) => orderId(o) === value);

  const fetchOrders = useCallback(async (query: string) => {
    if (!shopId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await listOrdersClient(shopId, { search: query });
      setOrders(extractOrderRows(data));
    } catch {
      setError('Không thể tải danh sách đơn hàng');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [shopId]);

  useEffect(() => {
    if (isOpen) {
      fetchOrders('');
      inputRef.current?.focus();
    }
  }, [isOpen, fetchOrders]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (isOpen && search !== undefined) {
      debounceRef.current = setTimeout(() => fetchOrders(search), 300);
    }
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [search, isOpen, fetchOrders]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (id: string) => {
    onChange(id);
    setIsOpen(false);
    setSearch('');
  };

  const handleUseDirectId = () => {
    if (search.trim()) {
      handleSelect(search.trim());
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-10 w-full items-center justify-between rounded-2xl border border-zinc-200 bg-white px-4 py-2 text-sm transition focus:border-emerald-700 focus:outline-none"
      >
        <span className={selectedOrder ? 'text-zinc-900' : 'text-zinc-400'}>
          {selectedOrder ? `#${orderId(selectedOrder)} - ${orderCustomerName(selectedOrder)}` : placeholder}
        </span>
        <span className="text-zinc-500">{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full rounded-xl border border-zinc-200 bg-white shadow-lg">
          <div className="border-b border-zinc-100 p-2">
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo mã đơn, tên khách..."
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-emerald-700"
            />
          </div>

          <div className="max-h-64 overflow-y-auto">
            {loading && <div className="p-4 text-center text-sm text-zinc-500">Đang tải...</div>}
            {error && <div className="p-4 text-center text-sm text-red-600">{error}</div>}

            {!loading && !error && orders.length === 0 && search.trim() && (
              <div className="flex flex-col gap-2 p-4">
                <p className="text-center text-sm text-zinc-500">Không tìm thấy đơn hàng</p>
                <button
                  type="button"
                  onClick={handleUseDirectId}
                  className="rounded-lg border border-emerald-700 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-100"
                >
                  Dùng mã đơn &quot;{search.trim()}&quot;
                </button>
              </div>
            )}

            {!loading && !error && orders.length === 0 && !search.trim() && (
              <div className="p-4 text-center text-sm text-zinc-500">Không tìm thấy đơn hàng</div>
            )}

            {!loading && !error && orders.map((order) => (
              <button
                key={orderId(order)}
                type="button"
                onClick={() => handleSelect(orderId(order))}
                className="flex w-full items-center justify-between px-4 py-2.5 text-left hover:bg-zinc-50"
              >
                <div>
                  <p className="text-sm font-medium text-zinc-900">#{orderId(order)}</p>
                  <p className="text-xs text-zinc-500">{orderCustomerName(order)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-zinc-900">{orderTotal(order)} đ</p>
                  <p className="text-xs text-zinc-500">{orderDate(order)}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
