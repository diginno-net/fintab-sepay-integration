import Link from 'next/link';
import { ErpPageHeader } from '@/components/layout/erp-page-header';
import { ErpPagination } from '@/components/ui/erp-pagination';
import { ErpTable, erpTd, erpTh } from '@/components/ui/erp-table';
import { CodeCell } from '@/components/ui/code-cell';
import { StatusPill } from '@/components/ui/status-pill';
import { ProductImportForm } from '@/features/product-catalog/product-import-form';
import { SyncButton } from '@/features/products/sync-button-client';
import { listProducts } from '@/features/products/api';
import { getCurrentSession } from '@/features/auth/session';

export default async function ProductsPage({ searchParams }: { searchParams: Promise<{ shopId?: string; search?: string; status?: string }> }) {
  const params = await searchParams;
  const session = await getCurrentSession();
  const currentShopId = params.shopId ?? session?.currentShopId ?? session?.shops[0]?.id ?? '';
  const products = await listProducts({ shopId: currentShopId || undefined, search: params.search, status: params.status }).catch(() => []);

  return (
    <div className="space-y-4">
      <ErpPageHeader
        breadcrumbs={[{ label: 'Danh mục' }, { label: 'Sản phẩm' }]}
        title="Sản phẩm"
        count={products.length}
        backHref="/dashboard"
        actions={
          <>
            {currentShopId ? <SyncButton shopId={currentShopId} /> : null}
            <details className="relative">
              <summary className="inline-flex h-9 cursor-pointer items-center rounded-lg border border-line bg-white px-3 text-sm font-medium text-ink hover:bg-surface-muted">Nhập</summary>
              <div className="absolute right-0 z-20 mt-2 w-[420px] rounded-xl border border-line bg-white p-4 shadow-panel">
                <ProductImportForm />
              </div>
            </details>
            <button className="h-9 rounded-lg border border-line bg-white px-3 text-sm font-medium text-ink hover:bg-surface-muted">Xuất</button>
          </>
        }
      />

      <div className="flex flex-col gap-3 border-b border-line bg-surface px-4 pb-4 md:flex-row md:items-center md:justify-between">
        <form className="flex max-w-xl flex-1 gap-2">
          <input type="hidden" name="shopId" value={currentShopId} />
          <input className="h-10 flex-1 rounded-lg border border-line bg-white px-3 text-sm outline-none focus:border-accent" name="search" defaultValue={params.search ?? ''} placeholder="Tìm mã hoặc tên sản phẩm" />
          <button className="h-10 rounded-lg bg-accent px-4 text-sm font-semibold text-white">Tìm</button>
        </form>
        <p className="text-sm text-muted">Shop: <span className="font-medium text-ink">{session?.shops.find(shop => shop.id === currentShopId)?.name ?? (currentShopId || 'Chưa chọn')}</span></p>
      </div>

      <ErpTable footer={<ErpPagination page={1} totalPages={1} pageSize={products.length || 30} totalItems={products.length} itemLabel="sản phẩm" />}>
        <table className="w-full min-w-[1040px] border-collapse text-left">
          <colgroup>
            <col className="w-9" />
            <col className="w-[120px]" />
            <col />
            <col className="w-[100px]" />
            <col className="w-[130px]" />
            <col className="w-[180px]" />
            <col className="w-[150px]" />
            <col className="w-[120px]" />
          </colgroup>
          <thead>
            <tr>
              <th className={`${erpTh} w-10`}><input type="checkbox" className="size-4 rounded border-line" /></th>
              <th className={erpTh}>Mã</th>
              <th className={erpTh}>Tên sản phẩm</th>
              <th className={erpTh}>Đơn vị</th>
              <th className={erpTh}>Nguồn</th>
              <th className={erpTh}>Nhóm</th>
              <th className={erpTh}>Thuế</th>
              <th className={`${erpTh} text-right`}>Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line/70">
            {products.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-10 text-center text-sm text-muted">Chưa có sản phẩm phù hợp.</td></tr>
            ) : products.map(product => <ProductRowItem key={product.id} product={product} shopId={currentShopId} />)}
          </tbody>
        </table>
      </ErpTable>
    </div>
  );
}

type ProductItem = Awaited<ReturnType<typeof listProducts>>[number];

function SourceBadge({ source }: { source: ProductItem['source'] }) {
  const label = source === 'pancake_pos' ? 'Pancake' : source;
  return <StatusPill tone={source === 'pancake_pos' ? 'success' : 'neutral'}>{label}</StatusPill>;
}

function ProductRowItem({ product, shopId }: { product: ProductItem; shopId: string }) {
  const configured = Boolean(product.group_name);
  return (
    <tr className="h-11 hover:bg-surface-muted/55">
      <td className={erpTd}><input type="checkbox" className="size-4 rounded border-line" /></td>
      <td className={erpTd}><CodeCell>{product.source_product_code}</CodeCell></td>
      <td className={erpTd}><p className="max-w-[520px] truncate font-medium">{product.product_name}</p><p className="mt-0.5 truncate text-xs leading-4 text-muted">{product.product_type}</p></td>
      <td className={`${erpTd} whitespace-nowrap`}>{product.default_invoice_unit}</td>
      <td className={erpTd}><SourceBadge source={product.source} /></td>
      <td className={erpTd}>{product.group_name ? <span className="block truncate">{product.group_name}</span> : <span className="text-muted">Chưa nhóm</span>}</td>
      <td className={erpTd}><StatusPill tone={configured ? 'success' : 'warning'}>{configured ? 'Đã cấu hình' : 'Cần cấu hình'}</StatusPill></td>
      <td className={`${erpTd} text-right`}><Link className={`inline-flex h-8 items-center whitespace-nowrap rounded-full px-3 text-xs font-semibold ${configured ? 'border border-line bg-white text-ink hover:bg-surface-muted' : 'bg-accent text-white'}`} href={`/products/${product.id}/tax?shopId=${shopId}`}>{configured ? 'Xem' : 'Cấu hình'}</Link></td>
    </tr>
  );
}
