'use client';

import type { ReactNode } from 'react';
import { useState } from 'react';

type Column<T> = {
  id: string;
  header: string;
  accessor: (row: T) => ReactNode;
  sortable?: boolean;
  width?: string;
};

type DataTableProps<T> = {
  columns: Column<T>[];
  data: T[];
  selectable?: boolean;
  onSelectionChange?: (selectedIds: string[]) => void;
  getRowId: (row: T) => string;
  expandable?: boolean;
  renderExpandedRow?: (row: T) => ReactNode;
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    onPageChange: (page: number) => void;
  };
  loading?: boolean;
  emptyState?: ReactNode;
  className?: string;
};

export function DataTable<T>({
  columns,
  data,
  selectable = false,
  onSelectionChange,
  getRowId,
  expandable = false,
  renderExpandedRow,
  pagination,
  loading = false,
  emptyState,
  className = ''
}: DataTableProps<T>) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleSelectAll = () => {
    if (selectedIds.size === data.length) {
      setSelectedIds(new Set());
      onSelectionChange?.([]);
    } else {
      const allIds = new Set(data.map(getRowId));
      setSelectedIds(allIds);
      onSelectionChange?.(Array.from(allIds));
    }
  };

  const handleSelectRow = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
    onSelectionChange?.(Array.from(newSelected));
  };

  const handleSort = (columnId: string) => {
    if (sortColumn === columnId) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnId);
      setSortDirection('asc');
    }
  };

  const handleToggleExpand = (id: string) => {
    const newExpanded = new Set(expandedIds);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedIds(newExpanded);
  };

  const totalPages = pagination ? Math.ceil(pagination.total / pagination.pageSize) : 1;
  const startItem = pagination ? (pagination.page - 1) * pagination.pageSize + 1 : 1;
  const endItem = pagination ? Math.min(pagination.page * pagination.pageSize, pagination.total) : data.length;

  if (loading) {
    return (
      <div className={`rounded-xl border border-zinc-200 bg-white ${className}`}>
        <div className="animate-pulse p-4">
          <div className="mb-4 h-10 rounded bg-zinc-100" />
          {[...Array(5)].map((_, i) => (
            <div key={i} className="mb-3 h-12 rounded bg-zinc-100" />
          ))}
        </div>
      </div>
    );
  }

  if (data.length === 0 && emptyState) {
    return (
      <div className={`rounded-xl border border-zinc-200 bg-white ${className}`}>
        {emptyState}
      </div>
    );
  }

  return (
    <div className={`overflow-hidden rounded-xl border border-zinc-200 bg-white ${className}`}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50">
              {selectable && (
                <th className="w-12 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={data.length > 0 && selectedIds.size === data.length}
                    onChange={handleSelectAll}
                    className="h-4 w-4 rounded border-zinc-300 text-emerald-700 focus:ring-emerald-700"
                  />
                </th>
              )}
              {expandable && <th className="w-12 px-4 py-3" />}
              {columns.map((col) => (
                <th
                  key={col.id}
                  className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500 ${
                    col.sortable ? 'cursor-pointer select-none hover:text-zinc-700' : ''
                  }`}
                  style={{ width: col.width }}
                  onClick={() => col.sortable && handleSort(col.id)}
                >
                  <div className="flex items-center gap-1">
                    {col.header}
                    {col.sortable && sortColumn === col.id && (
                      <span className="text-emerald-700">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {data.map((row) => {
              const rowId = getRowId(row);
              const isSelected = selectedIds.has(rowId);
              const isExpanded = expandedIds.has(rowId);

              return (
                <>
                  <tr
                    key={rowId}
                    className={`transition-colors ${
                      isSelected ? 'bg-emerald-50' : 'hover:bg-zinc-50'
                    }`}
                  >
                    {selectable && (
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectRow(rowId)}
                          className="h-4 w-4 rounded border-zinc-300 text-emerald-700 focus:ring-emerald-700"
                        />
                      </td>
                    )}
                    {expandable && (
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleToggleExpand(rowId)}
                          className="text-zinc-500 hover:text-zinc-700"
                        >
                          {isExpanded ? '−' : '+'}
                        </button>
                      </td>
                    )}
                    {columns.map((col) => (
                      <td key={col.id} className="px-4 py-3 text-sm text-zinc-900">
                        {col.accessor(row)}
                      </td>
                    ))}
                  </tr>
                  {expandable && isExpanded && renderExpandedRow && (
                    <tr key={`${rowId}-expanded`} className="bg-zinc-50">
                      <td colSpan={columns.length + (selectable ? 2 : 1)} className="px-4 py-3">
                        {renderExpandedRow(row)}
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>
      </div>

      {pagination && data.length > 0 && (
        <div className="flex items-center justify-between border-t border-zinc-200 px-4 py-3">
          <p className="text-sm text-zinc-500">
            Hiển thị {startItem}–{endItem} của {pagination.total}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="rounded border border-zinc-200 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Trước
            </button>
            <span className="text-sm text-zinc-500">
              Trang {pagination.page} / {totalPages}
            </span>
            <button
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              disabled={pagination.page >= totalPages}
              className="rounded border border-zinc-200 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Sau
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
