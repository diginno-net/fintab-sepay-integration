import { PageHeader } from '@/components/layout/page-header';
import { SectionCard } from '@/components/layout/section-card';
import { ProductImportForm } from '@/features/product-catalog/product-import-form';
import { SyncButton } from '@/features/products/sync-button-client';
import { listProducts } from '@/features/products/api';
import { getCurrentSession } from '@/features/auth/session';
import Link from 'next/link';

export default async function ProductsPage({ searchParams }: { searchParams: Promise<{ search?: string; status?: string }> }) {
  const params = await searchParams;
  const session = await getCurrentSession();
  const products = await listProducts({ search: params.search, status: params.status }).catch(() => []);
  const currentShopId = session?.currentShopId ?? session?.shops[0]?.id ?? '';
  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Catalog" title="Products" description="Product catalog, import Excel và sync Pancake." />
      <SectionCard title="Import Excel"><ProductImportForm /></SectionCard>
      <SectionCard title="Sync Pancake">
        {currentShopId ? <SyncButton shopId={currentShopId} /> : <p className="text-sm text-zinc-500">Chưa có shop được chọn.</p>}
      </SectionCard>
      <SectionCard title={`Products (${products.length})`}>
        <form className="mb-5 flex gap-3"><input className="flex-1 rounded-2xl border border-zinc-200 px-4 py-3 text-sm" name="search" defaultValue={params.search ?? ''} placeholder="Search code or name" /><button className="rounded-full bg-zinc-950 px-5 py-3 text-sm font-semibold text-white">Search</button></form>
        <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="text-xs uppercase tracking-[0.14em] text-zinc-500"><tr><th className="py-3">Code</th><th>Name</th><th>Unit</th><th>Source</th><th>Group</th><th>Tax</th></tr></thead><tbody className="divide-y divide-zinc-100">{products.map(product => <tr key={product.id}><td className="py-3 font-medium font-mono text-xs">{product.source_product_code}</td><td>{product.product_name}</td><td>{product.default_invoice_unit}</td><td><span className={`rounded px-1.5 py-0.5 text-xs ${product.source === 'pancake_pos' ? 'bg-blue-100 text-blue-700' : 'bg-zinc-100 text-zinc-600'}`}>{product.source}</span></td><td>{product.group_name ?? '-'}</td><td><Link className="font-semibold text-emerald-800" href={`/products/${product.id}/tax`}>Edit tax</Link></td></tr>)}</tbody></table></div>
        {products.length === 0 ? <p className="text-sm text-zinc-600">Chưa có sản phẩm. Import Excel hoặc sync từ Pancake.</p> : null}
      </SectionCard>
    </div>
  );
}
