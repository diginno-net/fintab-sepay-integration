import Link from 'next/link';
import { ChartBar, ClipboardText, GearSix, House, ListChecks, Package, Receipt, Scroll, Storefront } from '@phosphor-icons/react/dist/ssr';
import type { Session } from '@/features/auth/session';
import { can } from '@/features/auth/session';
import { withShopId } from '@/features/shop-switcher/shop-context';

const navItems = [
  { href: '/dashboard', label: 'Tổng quan', permission: 'tenant:read', icon: House },
  { href: '/shops', label: 'Cửa hàng', permission: 'tenant_shop:read', icon: Storefront },
  { href: '/orders', label: 'Đơn hàng', permission: 'orders:read', icon: ClipboardText },
  { href: '/products', label: 'Sản phẩm', permission: 'products:read', icon: Package },
  { href: '/invoices', label: 'Hóa đơn', permission: 'invoice:preview', icon: Receipt },
  { href: '/jobs', label: 'Tác vụ', permission: 'jobs:read', icon: ListChecks },
  { href: '/audit', label: 'Nhật ký', permission: 'audit:read', icon: Scroll },
  { href: '/settings', label: 'Cài đặt', permission: 'tenant:read', icon: GearSix },
  { href: '/settings/shop-access', label: 'Phân quyền cửa hàng', permission: 'shop_access:read', icon: Storefront }
];

export function MainNav({ session, currentShopId }: { session: Session | null; currentShopId?: string | null }) {
  return (
    <nav className="grid gap-1.5">
      {navItems.filter(item => can(session, item.permission)).map(item => {
        const Icon = item.icon;
        return (
          <Link key={item.href} href={withShopId(item.href, currentShopId ?? null)} className="flex min-h-11 items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium text-white/64 transition duration-200 hover:bg-white/[0.08] hover:text-white">
            <Icon size={18} weight="duotone" />
            {item.label}
          </Link>
        );
      })}
      <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.06] p-3">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#9ad6c6]">
          <ChartBar size={16} weight="duotone" />
          Nền tảng
        </div>
        <p className="mt-2 text-xs leading-5 text-white/55">Pancake, SePay, cấu hình thuế và tác vụ hóa đơn.</p>
      </div>
    </nav>
  );
}
