import { LoginForm } from '@/features/auth/login-form';

export default function LoginPage() {
  return (
    <main className="grid min-h-[100dvh] place-items-center bg-[#f7f6f2] px-6 py-10 text-zinc-950">
      <section className="w-full max-w-md rounded-[1.75rem] border border-zinc-200 bg-white p-8 shadow-sm">
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.22em] text-emerald-700">Web Admin</p>
        <h1 className="text-3xl font-semibold tracking-[-0.04em]">Đăng nhập</h1>
        <p className="mt-3 text-sm leading-6 text-zinc-600">Tài khoản dùng để cấu hình Pancake, SePay và thuế riêng cho từng shop.</p>
        <LoginForm />
      </section>
    </main>
  );
}
