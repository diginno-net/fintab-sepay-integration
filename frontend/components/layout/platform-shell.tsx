import Link from 'next/link';
import { MainNav } from '@/components/navigation/main-nav';
import { getCurrentSession } from '@/features/auth/session';
import { ShopSwitcher } from '@/features/shop-switcher/shop-switcher';

export async function PlatformShell({ children }: { children: React.ReactNode }) {
  const session = await getCurrentSession();

  return (
    <div className="min-h-[100dvh] bg-[#f7f6f2] text-zinc-950">
      <aside className="fixed inset-y-0 left-0 hidden w-72 border-r border-zinc-200 bg-[#fbfaf7] p-5 lg:block">
        <Link href="/dashboard" className="block rounded-[1.5rem] bg-zinc-950 p-5 text-white">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-300">Fintab x SePay</p>
          <p className="mt-4 text-2xl font-semibold tracking-[-0.05em]">Invoice Ops</p>
        </Link>
        <div className="mt-6">
          <MainNav session={session} />
        </div>
      </aside>
      <div className="lg:pl-72">
        <header className="sticky top-0 z-10 border-b border-zinc-200 bg-[#f7f6f2]/90 px-5 py-4 backdrop-blur md:px-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Tenant</p>
              <p className="mt-1 text-sm font-semibold text-zinc-950">{session?.tenant.name ?? session?.tenant.id ?? 'Chưa đăng nhập'}</p>
            </div>
            <ShopSwitcher shops={session?.shops ?? []} currentShopId={session?.currentShopId ?? null} />
          </div>
        </header>
        <main className="px-5 py-8 md:px-8">{children}</main>
      </div>
    </div>
  );
}
