import Link from 'next/link';
import { ChartBar, ClipboardText, GearSix, House, ListChecks, Package, Receipt, Scroll, Storefront } from '@phosphor-icons/react/dist/ssr';
import type { Session } from '@/features/auth/session';
import { can } from '@/features/auth/session';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', permission: 'tenant:read', icon: House },
  { href: '/shops', label: 'Shops', permission: 'tenant_shop:read', icon: Storefront },
  { href: '/orders', label: 'Orders', permission: 'orders:read', icon: ClipboardText },
  { href: '/products', label: 'Products', permission: 'products:read', icon: Package },
  { href: '/invoices', label: 'Invoices', permission: 'invoice:preview', icon: Receipt },
  { href: '/jobs', label: 'Jobs', permission: 'jobs:read', icon: ListChecks },
  { href: '/audit', label: 'Audit', permission: 'audit:read', icon: Scroll },
  { href: '/settings', label: 'Settings', permission: 'tenant:read', icon: GearSix }
];

export function MainNav({ session }: { session: Session | null }) {
  return (
    <nav className="grid gap-1">
      {navItems.filter(item => can(session, item.permission)).map(item => {
        const Icon = item.icon;
        return (
          <Link key={item.href} href={item.href} className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-950">
            <Icon size={18} weight="duotone" />
            {item.label}
          </Link>
        );
      })}
      <div className="mt-4 rounded-2xl border border-zinc-200 bg-white p-3">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
          <ChartBar size={16} weight="duotone" />
          Platform
        </div>
        <p className="mt-2 text-xs leading-5 text-zinc-500">Pancake, SePay, tax mapping và invoice jobs.</p>
      </div>
    </nav>
  );
}
