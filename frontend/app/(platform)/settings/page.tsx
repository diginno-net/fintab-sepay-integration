import { PageHeader } from '@/components/layout/page-header';
import { SectionCard } from '@/components/layout/section-card';
import Link from 'next/link';
import { getCurrentSession } from '@/features/auth/session';
import { resolveCurrentShopId, withShopId } from '@/features/shop-switcher/shop-context';

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ shopId?: string }> }) {
  const params = await searchParams;
  const session = await getCurrentSession();
  const shopId = resolveCurrentShopId({ urlShopId: params.shopId, session });
  return <div className="space-y-8"><PageHeader eyebrow="Tài khoản" title="Cài đặt" description="Thiết lập tài khoản và tenant." /><SectionCard title="Quản trị"><div className="grid gap-3 md:grid-cols-2"><Link href={withShopId('/settings/shop-access', shopId)} className="rounded-2xl border border-zinc-200 bg-white p-4 text-sm font-semibold text-zinc-950 transition hover:border-emerald-300 hover:bg-emerald-50">Phân quyền cửa hàng<p className="mt-1 text-xs font-normal text-zinc-500">Gán người dùng vào cửa hàng và chọn cửa hàng mặc định.</p></Link></div></SectionCard></div>;
}
