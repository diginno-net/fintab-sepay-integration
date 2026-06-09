import { getCurrentSession } from '@/features/auth/session';
import { OnboardingWizard } from '@/features/onboarding/onboarding-wizard';
import { SectionCard } from '@/components/layout/section-card';

export default async function OnboardingPage() {
  const session = await getCurrentSession();

  return (
    <main className="min-h-[100dvh] bg-[#f7f6f2] px-6 py-10">
      <div className="mx-auto max-w-3xl space-y-8">
        <div>
          <p className="mb-1 text-sm font-medium uppercase tracking-[0.1em] text-emerald-700">Setup</p>
          <h1 className="text-3xl font-bold text-zinc-900">Welcome aboard</h1>
          <p className="mt-2 text-zinc-600">Hoàn tất cấu hình để bắt đầu sử dụng nền tảng.</p>
        </div>
        <SectionCard>
          <OnboardingWizard initialTenantName={session?.tenant?.name ?? ''} />
        </SectionCard>
      </div>
    </main>
  );
}
