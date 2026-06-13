import { PageHeader } from '@/components/layout/page-header';
import { SectionCard } from '@/components/layout/section-card';

export default function WebhookSettingsPage() {
  const webhookPath = '/v1/webhooks/pancake';
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '') || 'https://<backend-domain>';
  const webhookUrl = `${apiBaseUrl}${webhookPath}`;

  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Webhook" title="Webhook Pancake" description="Cấu hình webhook URL và chính sách tự động theo cửa hàng." />
      <SectionCard title="Trạng thái cấu hình">
        <div className="grid gap-5 text-sm text-zinc-700 md:grid-cols-2">
          <div className="rounded-2xl border border-line bg-surface p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">Endpoint nhận webhook</p>
            <p className="mt-3 rounded-xl bg-zinc-950 px-3 py-2 font-mono text-xs text-white">{webhookUrl}</p>
            <p className="mt-3 leading-6">Dùng URL backend production này để khai báo trong Pancake. Backend sẽ tự xác định shop bằng cấu hình Pancake và webhook secret.</p>
          </div>
          <div className="rounded-2xl border border-line bg-surface p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">Bảo mật</p>
            <p className="mt-3 leading-6">Webhook secret được quản lý trong tab cấu hình Pancake. Trang này không hiển thị secret thô và chỉ dùng để hướng dẫn vận hành.</p>
          </div>
        </div>
      </SectionCard>
      <SectionCard title="Ghi chú vận hành">
        <ul className="list-disc space-y-2 pl-5 text-sm leading-6 text-zinc-700">
          <li>Chỉ bật webhook cho shop đã cấu hình Pancake API key và webhook secret.</li>
          <li>Kiểm tra trang Jobs sau khi Pancake gửi webhook để xác nhận job được enqueue và xử lý.</li>
          <li>Nếu cần phát hành tự động, bật chính sách automation ở phần cấu hình hóa đơn trước khi go-live.</li>
        </ul>
      </SectionCard>
    </div>
  );
}
