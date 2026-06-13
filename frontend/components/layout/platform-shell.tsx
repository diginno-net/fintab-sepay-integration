import Link from 'next/link';
import { Suspense } from 'react';
import { MainNav } from '@/components/navigation/main-nav';
import { getCurrentSession } from '@/features/auth/session';
import { LogoutButton } from '@/features/auth/logout-button';
import { ShopSwitcher } from '@/features/shop-switcher/shop-switcher';
import { resolveCurrentShopId, withShopId } from '@/features/shop-switcher/shop-context';

export async function PlatformShell({ children }: { children: React.ReactNode }) {
  const session = await getCurrentSession();
  const currentShopId = resolveCurrentShopId({ session });

  return (
    <div className="min-h-[100dvh] bg-canvas text-ink">
      <aside className="fixed inset-y-0 left-0 hidden w-72 border-r border-line bg-[#211f1a] p-5 text-white lg:block">
        <Link href={withShopId('/dashboard', currentShopId)} className="block rounded-[1.75rem] border border-white/10 bg-white/[0.06] p-5 shadow-warm-sm transition hover:bg-white/[0.09]">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#9ad6c6]">Fintab x SePay</p>
          <p className="mt-4 text-2xl font-semibold tracking-[-0.055em]">Vận hành hóa đơn</p>
          <p className="mt-3 text-xs leading-5 text-white/58">Trung tâm điều phối cấu hình thuế, đồng bộ đơn và phát hành hóa đơn điện tử.</p>
        </Link>
        <div className="mt-6">
          <MainNav session={session} currentShopId={currentShopId} />
        </div>
      </aside>
      <div className="lg:pl-72">
        <header className="sticky top-0 z-10 border-b border-line bg-canvas/88 px-5 py-4 backdrop-blur-xl md:px-8">
          <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Ngữ cảnh tenant</p>
              <p className="mt-1 max-w-[52vw] truncate text-sm font-semibold text-ink">{session?.user.email ?? session?.tenant.name ?? session?.tenant.id ?? 'Chưa đăng nhập'}</p>
            </div>
            <div className="flex items-center gap-3">
              <Suspense fallback={null}>
                <ShopSwitcher shops={session?.shops ?? []} currentShopId={session?.currentShopId ?? null} />
              </Suspense>
              {session ? <LogoutButton /> : null}
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-[1400px] px-5 py-8 md:px-8 md:py-10">{children}</main>
      </div>
    </div>
  );
}
