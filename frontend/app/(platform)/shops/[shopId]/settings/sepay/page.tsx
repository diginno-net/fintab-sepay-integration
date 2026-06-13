import { PageHeader } from '@/components/layout/page-header';
import { SepayConfigForm } from '@/features/sepay-config/sepay-config-form';
import { SepaySettingsLayout } from '@/features/shops/sepay-settings-layout';
import { getSepayConfig } from '@/features/shops/api';

export default async function SepaySettingsPage({ params }: { params: Promise<{ shopId: string }> }) {
  const { shopId } = await params;
  const config = await getSepayConfig(shopId);
  const isConnected = !!(config?.has_client_id && config?.has_client_secret);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Cấu hình"
        title="Cài đặt SePay"
        description="Cấu hình tài khoản, mẫu hóa đơn và phương thức thanh toán"
      />

      {!config?.has_client_id || !config?.has_client_secret ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Shop này chưa cấu hình SePay. Vui lòng nhập Client ID và Client Secret để tiếp tục.
        </div>
      ) : null}

      <SepaySettingsLayout
        integrationStatus={{
          connected: isConnected,
          lastSync: config?.last_updated_at ? new Date(config.last_updated_at).toLocaleString('vi-VN') : undefined,
        }}
        notes={
          <div className="space-y-2 text-sm text-zinc-600">
            <p><strong>Môi trường:</strong> Sandbox để test, Production để phát hành thực.</p>
            <p><strong>Mẫu hóa đơn:</strong> 1 = GTGT, 2 = Bán hàng.</p>
            <p><strong>Thuế suất:</strong> Đặt mặc định cho các sản phẩm không có hồ sơ thuế.</p>
          </div>
        }
      >
        <div className="rounded-xl border border-zinc-200 bg-white p-6">
          <h3 className="mb-5 text-lg font-semibold text-zinc-950">Thông tin tài khoản SePay</h3>
          <SepayConfigForm shopId={shopId} config={config} />
        </div>
      </SepaySettingsLayout>
    </div>
  );
}
