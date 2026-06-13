'use client';

import { useState } from 'react';
import { Badge } from '@/components/status/badge';
import type { AuditLogEntry } from './types';
import { formatActorType, formatDate } from './types';

type Props = {
  logs: AuditLogEntry[];
};

export function AuditLogTable({ logs }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const safeLogs = logs ?? [];

  if (safeLogs.length === 0) {
    return <p className="py-8 text-center text-sm text-zinc-500">Chưa có audit log.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="text-xs uppercase tracking-[0.14em] text-zinc-500">
          <tr>
            <th className="py-3 pr-4">Thời gian</th>
            <th className="py-3 pr-4">Tác nhân</th>
            <th className="py-3 pr-4">Loại</th>
            <th className="py-3 pr-4">Thao tác</th>
            <th className="py-3 pr-4">Tài nguyên</th>
            <th className="py-3">Chi tiết</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {safeLogs.map(log => (
            <tr key={log.id} className="group">
              <td className="py-3 pr-4 font-mono text-xs text-zinc-500">{formatDate(log.created_at)}</td>
              <td className="py-3 pr-4">{log.actor}</td>
              <td className="py-3 pr-4"><Badge>{formatActorType(log.actor_type)}</Badge></td>
              <td className="py-3 pr-4 font-medium">{log.action}</td>
              <td className="py-3 pr-4 text-zinc-600">{log.resource}</td>
              <td className="py-3">
                <button
                  onClick={() => setExpanded(expanded === log.id ? null : log.id)}
                  className="text-xs text-emerald-700 hover:underline"
                >
                  {expanded === log.id ? 'Ẩn' : 'Chi tiết kiểm toán'}
                </button>
                {expanded === log.id && log.diff && (
                  <pre className="mt-2 max-h-48 overflow-auto rounded-xl bg-zinc-950 p-3 text-xs text-zinc-100">
                    {JSON.stringify(log.diff, null, 2)}
                  </pre>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
