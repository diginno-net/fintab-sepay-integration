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
      <div className={`rounded-[1.35rem] border border-line bg-surface shadow-warm-sm ${className}`}>
        <div className="animate-pulse p-4">
          <div className="mb-4 h-10 rounded-xl bg-surface-muted" />
          {[...Array(5)].map((_, i) => (
            <div key={i} className="mb-3 h-12 rounded-xl bg-surface-muted/80" />
          ))}
        </div>
      </div>
    );
  }

  if (data.length === 0 && emptyState) {
    return (
      <div className={`rounded-[1.35rem] border border-line bg-surface shadow-warm-sm ${className}`}>
        {emptyState}
      </div>
    );
  }

  return (
    <div className={`overflow-hidden rounded-[1.35rem] border border-line bg-surface shadow-warm-sm ${className}`}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-line bg-surface-muted/75">
              {selectable && (
                <th className="w-12 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={data.length > 0 && selectedIds.size === data.length}
                    onChange={handleSelectAll}
                    className="size-4 rounded border-line text-accent focus:ring-accent"
                  />
                </th>
              )}
              {expandable && <th className="w-12 px-4 py-3" />}
              {columns.map((col) => (
                <th
                  key={col.id}
                  className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-muted ${
                    col.sortable ? 'cursor-pointer select-none hover:text-ink' : ''
                  }`}
                  style={{ width: col.width }}
                  onClick={() => col.sortable && handleSort(col.id)}
                >
                  <div className="flex items-center gap-1">
                    {col.header}
                    {col.sortable && sortColumn === col.id && (
                      <span className="text-accent">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line/70">
            {data.map((row) => {
              const rowId = getRowId(row);
              const isSelected = selectedIds.has(rowId);
              const isExpanded = expandedIds.has(rowId);

              return (
                <>
                  <tr
                    key={rowId}
                    className={`transition-colors ${
                      isSelected ? 'bg-accent/10' : 'hover:bg-surface-muted/55'
                    }`}
                  >
                    {selectable && (
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectRow(rowId)}
                          className="size-4 rounded border-line text-accent focus:ring-accent"
                        />
                      </td>
                    )}
                    {expandable && (
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleToggleExpand(rowId)}
                            className="rounded-lg px-2 py-1 text-muted transition hover:bg-surface-muted hover:text-ink"
                        >
                          {isExpanded ? '−' : '+'}
                        </button>
                      </td>
                    )}
                    {columns.map((col) => (
                      <td key={col.id} className="px-4 py-3 text-sm text-ink">
                        {col.accessor(row)}
                      </td>
                    ))}
                  </tr>
                  {expandable && isExpanded && renderExpandedRow && (
                    <tr key={`${rowId}-expanded`} className="bg-surface-muted/55">
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
        <div className="flex flex-col gap-3 border-t border-line px-4 py-3 md:flex-row md:items-center md:justify-between">
          <p className="font-mono text-sm text-muted tabular-nums">
            Hiển thị {startItem}–{endItem} của {pagination.total}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="min-h-9 rounded-full border border-line bg-surface px-3 py-1.5 text-sm font-semibold text-muted transition hover:border-accent/40 hover:text-ink disabled:cursor-not-allowed disabled:opacity-50"
            >
              Trước
            </button>
            <span className="font-mono text-sm text-muted tabular-nums">
              Trang {pagination.page} / {totalPages}
            </span>
            <button
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              disabled={pagination.page >= totalPages}
              className="min-h-9 rounded-full border border-line bg-surface px-3 py-1.5 text-sm font-semibold text-muted transition hover:border-accent/40 hover:text-ink disabled:cursor-not-allowed disabled:opacity-50"
            >
              Sau
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
