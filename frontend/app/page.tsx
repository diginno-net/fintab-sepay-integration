import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-[100dvh] bg-[#f7f6f2] px-6 py-10 text-zinc-950">
      <section className="mx-auto grid max-w-6xl gap-8 rounded-[2rem] border border-zinc-200 bg-white p-8 shadow-sm md:grid-cols-[1.1fr_0.9fr] md:p-12">
        <div className="flex min-h-[520px] flex-col justify-between">
          <div>
            <p className="mb-6 text-sm font-semibold uppercase tracking-[0.28em] text-emerald-700">Fintab x SePay</p>
            <h1 className="max-w-3xl text-5xl font-semibold tracking-[-0.05em] text-zinc-950 md:text-7xl">
              Chuyển dữ liệu bán hàng thành hóa đơn đúng thuế.
            </h1>
          </div>
          <div className="max-w-xl space-y-6">
            <p className="text-lg leading-8 text-zinc-600">
              Nền tảng kết nối Pancake POS với SePay eInvoice, có cấu hình riêng theo shop, kiểm soát tax profile sản phẩm và luồng phát hành hóa đơn an toàn.
            </p>
            <Link
              href="/login"
              className="inline-flex rounded-full bg-emerald-700 px-6 py-3 text-sm font-semibold text-white transition active:scale-[0.98]"
            >
              Đi đến đăng nhập
            </Link>
          </div>
        </div>
        <div className="grid content-end gap-3 rounded-[1.5rem] bg-zinc-950 p-5 text-white">
          {['Per-shop SePay config', 'Product tax profiles', 'Background invoice jobs', 'Audit-ready workflow'].map(item => (
            <div key={item} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-zinc-200">
              {item}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
