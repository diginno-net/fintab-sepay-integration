import Link from 'next/link';

export default function HomePage() {
  const pipeline = [
    ['01', 'Đơn Pancake', 'Lấy đơn đã thanh toán và giữ nguyên ngữ cảnh nguồn.'],
    ['02', 'Hồ sơ thuế', 'Chuẩn hóa quy tắc thuế sản phẩm trước khi tạo hóa đơn.'],
    ['03', 'Nháp SePay', 'Tạo hóa đơn nháp qua hàng đợi tác vụ nền.'],
    ['04', 'Kiểm soát phát hành', 'Theo dõi trạng thái phát hành, file và nhật ký kiểm toán.']
  ];

  return (
    <main className="min-h-[100dvh] bg-canvas px-6 py-8 text-ink md:py-12">
      <section className="mx-auto grid max-w-7xl gap-8 rounded-[2.25rem] border border-line bg-surface p-6 shadow-warm md:grid-cols-[1.12fr_0.88fr] md:p-10 lg:p-12">
        <div className="flex min-h-[560px] flex-col justify-between gap-12">
          <div>
            <p className="mb-6 text-sm font-semibold uppercase tracking-[0.28em] text-accent">Fintab x SePay</p>
            <h1 className="max-w-4xl text-balance text-5xl font-semibold tracking-[-0.065em] text-ink md:text-7xl">
              Kiểm soát hóa đơn từ order đến phát hành.
            </h1>
          </div>
          <div className="flex max-w-xl flex-col gap-6">
            <p className="text-pretty text-lg leading-8 text-muted">
              Nền tảng kết nối Pancake POS với SePay eInvoice, có cấu hình riêng theo shop, kiểm soát tax profile sản phẩm và luồng phát hành hóa đơn an toàn.
            </p>
            <Link
              href="/login"
              className="inline-flex min-h-12 w-fit items-center rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white transition duration-200 hover:bg-[#1f604f] active:translate-y-px active:scale-[0.98]"
            >
              Đăng nhập hệ thống
            </Link>
          </div>
        </div>
        <div className="rounded-[2rem] border border-line bg-[#211f1a] p-5 text-white shadow-warm md:p-6">
          <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#9ad6c6]">Luồng hóa đơn</p>
              <p className="mt-2 text-2xl font-semibold tracking-[-0.05em]">Quy trình vận hành</p>
            </div>
            <div className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 font-mono text-xs text-white/70">ĐANG CHẠY</div>
          </div>
          <div className="mt-6 grid gap-3">
            {pipeline.map(([step, title, description]) => (
              <div key={step} className="grid grid-cols-[3rem_1fr] gap-4 rounded-2xl border border-white/10 bg-white/[0.06] p-4">
                <span className="font-mono text-sm text-[#9ad6c6]">{step}</span>
                <div>
                  <p className="text-sm font-semibold text-white">{title}</p>
                  <p className="mt-1 text-sm leading-6 text-white/55">{description}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-white/[0.06] p-4">
              <p className="font-mono text-2xl font-semibold tabular-nums">4.8s</p>
              <p className="mt-1 text-xs text-white/55">thời gian chuyển hàng đợi</p>
            </div>
            <div className="rounded-2xl bg-white/[0.06] p-4">
              <p className="font-mono text-2xl font-semibold tabular-nums">12</p>
              <p className="mt-1 text-xs text-white/55">điểm kiểm toán</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
