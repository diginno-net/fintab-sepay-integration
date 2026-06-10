'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { listOrders } from '@/features/orders/api';
import type { PancakeOrder } from '@/features/orders/api';

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
  const [orders, setOrders] = useState<PancakeOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const selectedOrder = orders.find((o) => o.id === value);

  const fetchOrders = useCallback(async (query: string) => {
    if (!shopId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await listOrders({ shopId, search: query, limit: 50 });
      setOrders(data.orders || []);
    } catch (err) {
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
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    if (isOpen && search !== undefined) {
      debounceRef.current = setTimeout(() => {
        fetchOrders(search);
      }, 300);
    }
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
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

  const handleSelect = (orderId: string) => {
    onChange(orderId);
    setIsOpen(false);
    setSearch('');
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-10 w-full items-center justify-between rounded-2xl border border-zinc-200 bg-white px-4 py-2 text-sm transition focus:border-emerald-700 focus:outline-none"
      >
        <span className={selectedOrder ? 'text-zinc-900' : 'text-zinc-400'}>
          {selectedOrder ? `#${selectedOrder.id} - ${selectedOrder.customer?.name || 'Khách lẻ'}` : placeholder}
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
            {loading && (
              <div className="p-4 text-center text-sm text-zinc-500">Đang tải...</div>
            )}

            {error && (
              <div className="p-4 text-center text-sm text-red-600">{error}</div>
            )}

            {!loading && !error && orders.length === 0 && (
              <div className="p-4 text-center text-sm text-zinc-500">Không tìm thấy đơn hàng</div>
            )}

            {!loading && !error && orders.map((order) => (
              <button
                key={order.id}
                type="button"
                onClick={() => handleSelect(order.id)}
                className="flex w-full items-center justify-between px-4 py-2.5 text-left hover:bg-zinc-50"
              >
                <div>
                  <p className="text-sm font-medium text-zinc-900">#{order.id}</p>
                  <p className="text-xs text-zinc-500">{order.customer?.name || 'Khách lẻ'}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-zinc-900">{formatCurrency(order.total || 0)}</p>
                  <p className="text-xs text-zinc-500">{formatDate(order.created_at || order.updated_at)}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
