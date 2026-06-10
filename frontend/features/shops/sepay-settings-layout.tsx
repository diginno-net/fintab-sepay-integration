'use client';

import type { ReactNode } from 'react';
import { StatCard } from '@/components/ui/stat-card';
import { Badge } from '@/components/status/badge';

type SepaySettingsLayoutProps = {
  children: ReactNode;
  integrationStatus?: {
    connected: boolean;
    lastSync?: string;
    quotaUsed?: number;
    quotaTotal?: number;
  };
  notes?: ReactNode;
  className?: string;
};

export function SepaySettingsLayout({ children, integrationStatus, notes, className = '' }: SepaySettingsLayoutProps) {
  return (
    <div className={`grid gap-6 lg:grid-cols-3 ${className}`}>
      <div className="lg:col-span-2">
        {children}
      </div>

      <div className="space-y-6">
        {integrationStatus && (
          <div className="rounded-xl border border-zinc-200 bg-white p-5">
            <h3 className="mb-4 text-sm font-semibold text-zinc-950">Tình trạng tích hợp</h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-600">Trạng thái</span>
                <div className="flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${integrationStatus.connected ? 'bg-emerald-500' : 'bg-red-500'}`} />
                  <span className={`text-sm font-medium ${integrationStatus.connected ? 'text-emerald-700' : 'text-red-700'}`}>
                    {integrationStatus.connected ? 'Đã kết nối' : 'Chưa kết nối'}
                  </span>
                </div>
              </div>

              {integrationStatus.lastSync && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-600">Đồng bộ cuối</span>
                  <span className="text-sm text-zinc-900">{integrationStatus.lastSync}</span>
                </div>
              )}

              {integrationStatus.quotaUsed !== undefined && integrationStatus.quotaTotal !== undefined && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-zinc-600">Đã sử dụng</span>
                    <span className="text-sm font-medium text-zinc-900">
                      {integrationStatus.quotaUsed} / {integrationStatus.quotaTotal}
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100">
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-all"
                      style={{ width: `${Math.min(100, (integrationStatus.quotaUsed / integrationStatus.quotaTotal) * 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {notes && (
          <div className="rounded-xl border border-zinc-200 bg-white p-5">
            <h3 className="mb-3 text-sm font-semibold text-zinc-950">Lưu ý vận hành</h3>
            {notes}
          </div>
        )}

        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <h3 className="mb-3 text-sm font-semibold text-zinc-950">Hỗ trợ</h3>
          <p className="text-sm text-zinc-600">
            Nếu gặp lỗi khi phát hành hóa đơn, vui lòng kiểm tra:
          </p>
          <ul className="mt-2 space-y-1 text-sm text-zinc-600">
            <li>• Client ID và Client Secret đúng</li>
            <li>• Tài khoản phát hành đã được kích hoạt</li>
            <li>• Template và Series đúng định dạng</li>
            <li>• Đã đủ hạn mức phát hành</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
