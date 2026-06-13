import { LoginForm } from '@/features/auth/login-form';

export default function LoginPage() {
  return (
    <main className="min-h-[100dvh] bg-canvas px-6 py-8 text-ink md:py-12">
      <section className="mx-auto grid max-w-6xl gap-6 rounded-[2.25rem] border border-line bg-surface p-6 shadow-warm md:grid-cols-[0.92fr_1.08fr] md:p-8">
        <div className="flex min-h-[560px] flex-col justify-between rounded-[1.75rem] bg-[#211f1a] p-6 text-white md:p-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#9ad6c6]">Quản trị web</p>
            <h1 className="mt-5 max-w-md text-balance text-4xl font-semibold tracking-[-0.055em] md:text-5xl">Điều phối hóa đơn theo từng shop.</h1>
          </div>
          <div className="grid gap-3">
            {['Thông tin kết nối Pancake', 'Tài khoản nhà cung cấp SePay', 'Thuế mặc định và hồ sơ sản phẩm'].map(item => (
              <div key={item} className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-white/72">{item}</div>
            ))}
          </div>
        </div>
        <div className="flex items-center">
          <div className="w-full rounded-[1.75rem] border border-line bg-white/55 p-6 md:p-8">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.22em] text-accent">Truy cập bảo mật</p>
            <h2 className="text-3xl font-semibold tracking-[-0.045em]">Đăng nhập</h2>
            <p className="mt-3 max-w-md text-sm leading-6 text-muted">Tài khoản dùng để cấu hình Pancake, SePay và thuế riêng cho từng shop.</p>
            <LoginForm />
          </div>
        </div>
      </section>
    </main>
  );
}
