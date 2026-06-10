'use client';

import { useState } from 'react';
import { Tabs } from '@/components/ui/tabs';
import { SelectInput } from '@/components/forms/select';
import { TextInput } from '@/components/forms/input';
import { listTenantShopsClient } from '@/features/shops/api-client';

type InvoiceFiltersProps = {
  shopId?: string;
  status?: string;
  search?: string;
  onFiltersChange: (filters: { shopId?: string; status?: string; search?: string }) => void;
  className?: string;
};

const STATUS_TABS = [
  { id: 'all', label: 'Tất cả' },
  { id: 'pending', label: 'Chưa tạo' },
  { id: 'draft_created', label: 'Đã tạo nháp' },
  { id: 'issued', label: 'Đã phát hành' },
  { id: 'failed', label: 'Lỗi' },
];

const STATUS_MAP: Record<string, string[]> = {
  all: [],
  pending: ['draft_create_queued', 'draft_create_polling', 'draft_create_running'],
  draft_created: ['draft_created'],
  issued: ['issued'],
  failed: ['failed', 'timeout'],
};

export function InvoiceFilters({ shopId, status = 'all', search, onFiltersChange, className = '' }: InvoiceFiltersProps) {
  const [shops, setShops] = useState<Array<{ id: string; shop_name: string }>>([]);
  const [localSearch, setLocalSearch] = useState(search || '');

  useState(() => {
    async function loadShops() {
      try {
        const data = await listTenantShopsClient();
        setShops(data);
      } catch {
        setShops([]);
      }
    }
    loadShops();
  });

  const handleStatusChange = (newStatus: string) => {
    onFiltersChange({ shopId, status: newStatus, search });
  };

  const handleShopChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newShopId = e.target.value || undefined;
    onFiltersChange({ shopId: newShopId, status, search });
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalSearch(e.target.value);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onFiltersChange({ shopId, status, search: localSearch || undefined });
  };

  const getTabCount = (statusId: string, jobs: Array<Record<string, unknown>>): number | undefined => {
    return undefined;
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <Tabs
        tabs={STATUS_TABS.map((tab) => ({
          ...tab,
          count: getTabCount(tab.id, [])
        }))}
        activeTab={status}
        onTabChange={handleStatusChange}
      />

      <div className="flex flex-wrap items-end gap-4">
        <div className="w-48">
          <SelectInput
            label="Cửa hàng"
            value={shopId || ''}
            onChange={handleShopChange}
          >
            <option value="">Tất cả cửa hàng</option>
            {shops.map((shop) => (
              <option key={shop.id} value={shop.id}>{shop.shop_name}</option>
            ))}
          </SelectInput>
        </div>

        <form onSubmit={handleSearchSubmit} className="flex-1 min-w-[200px]">
          <TextInput
            label="Tìm kiếm"
            placeholder="Mã đơn, mã hóa đơn..."
            value={localSearch}
            onChange={handleSearchChange}
          />
        </form>
      </div>
    </div>
  );
}
