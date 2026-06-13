import { getCurrentSession } from '@/features/auth/session';
import { OnboardingWizard } from '@/features/onboarding/onboarding-wizard';
import { SectionCard } from '@/components/layout/section-card';

export default async function OnboardingPage() {
  const session = await getCurrentSession();

  return (
    <main className="min-h-[100dvh] bg-canvas px-6 py-10 text-ink">
      <div className="mx-auto flex max-w-4xl flex-col gap-8">
        <div>
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.18em] text-accent">Thiết lập</p>
          <h1 className="text-4xl font-semibold tracking-[-0.055em] text-ink">Chào mừng bạn</h1>
          <p className="mt-3 max-w-2xl text-muted">Hoàn tất cấu hình để bắt đầu sử dụng nền tảng.</p>
        </div>
        <SectionCard>
          <OnboardingWizard initialTenantName={session?.tenant?.name ?? ''} />
        </SectionCard>
      </div>
    </main>
  );
}
