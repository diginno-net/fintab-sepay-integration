'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/forms/button';
import { TextInput } from '@/components/forms/input';
import { SelectInput } from '@/components/forms/select';
import { ApiClientError, apiFetch } from '@/lib/api/client';

type OnboardingState = {
  tenantName: string;
  shopId: string;
  shopName: string;
  externalShopId: string;
  pancakeApiKey: string;
  pancakeWebhookSecret: string;
  sepayClientId: string;
  sepayClientSecret: string;
  sepayEnv: string;
  sepayProviderAccountId: string;
  sepayTemplateCode: string;
  sepayInvoiceSeries: string;
  sepayPaymentMethod: string;
  defaultTaxRate: string;
  unknownProductPolicy: string;
};

const initialState: OnboardingState = {
  tenantName: '',
  shopId: '',
  shopName: '',
  externalShopId: '',
  pancakeApiKey: '',
  pancakeWebhookSecret: '',
  sepayClientId: '',
  sepayClientSecret: '',
  sepayEnv: 'sandbox',
  sepayProviderAccountId: '',
  sepayTemplateCode: '2',
  sepayInvoiceSeries: '',
  sepayPaymentMethod: 'TM/CK',
  defaultTaxRate: '10',
  unknownProductPolicy: 'warn',
};

const STEPS = [
  { num: 1, label: 'Tenant info' },
  { num: 2, label: 'Create shop' },
  { num: 3, label: 'Pancake config' },
  { num: 4, label: 'SePay config' },
  { num: 5, label: 'Tax defaults' },
  { num: 6, label: 'Complete' },
];

export function OnboardingWizard({ initialTenantName }: { initialTenantName: string }) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [state, setState] = useState<OnboardingState>({ ...initialState, tenantName: initialTenantName });
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function update<K extends keyof OnboardingState>(key: K, value: OnboardingState[K]) {
    setState(prev => ({ ...prev, [key]: value }));
    setError(null);
  }

  async function saveStep1() {
    setError(null);
    return new Promise<void>((resolve, reject) => {
      startTransition(async () => {
        try {
          await apiFetch('/v1/tenant', {
            method: 'PUT',
            body: JSON.stringify({ name: state.tenantName })
          });
          resolve();
        } catch (e) {
          setError(e instanceof ApiClientError ? e.message : 'Không cập nhật được thông tin tenant.');
          reject(e);
        }
      });
    });
  }

  async function saveStep2() {
    setError(null);
    return new Promise<void>((resolve, reject) => {
      startTransition(async () => {
        try {
          const result = await apiFetch<{ data: { id: string } }>('/v1/tenant-shops', {
            method: 'POST',
            body: JSON.stringify({ external_shop_id: state.externalShopId, shop_name: state.shopName })
          });
          update('shopId', result.data.id);
          resolve();
        } catch (e) {
          setError(e instanceof ApiClientError ? e.message : 'Không tạo được shop.');
          reject(e);
        }
      });
    });
  }

  async function saveStep3() {
    setError(null);
    return new Promise<void>((resolve, reject) => {
      startTransition(async () => {
        try {
          await apiFetch(`/v1/shops/${state.shopId}/pancake/config`, {
            method: 'PUT',
            body: JSON.stringify({
              shop_id: state.externalShopId,
              shop_name: state.shopName,
              api_key: state.pancakeApiKey || undefined,
              webhook_secret: state.pancakeWebhookSecret || undefined,
              default_order_status_for_issue: [3, 16],
              allow_create_draft_statuses: [1, 2, 3, 16]
            })
          });
          resolve();
        } catch (e) {
          setError(e instanceof ApiClientError ? e.message : 'Không lưu được cấu hình Pancake.');
          reject(e);
        }
      });
    });
  }

  async function testPancake() {
    setError(null);
    return new Promise<void>((resolve, reject) => {
      startTransition(async () => {
        try {
          await apiFetch(`/v1/shops/${state.shopId}/test-pancake`, { method: 'POST', body: JSON.stringify({}) });
          resolve();
        } catch (e) {
          setError(e instanceof ApiClientError ? e.message : 'Kết nối Pancake thất bại.');
          reject(e);
        }
      });
    });
  }

  async function saveStep4() {
    setError(null);
    return new Promise<void>((resolve, reject) => {
      startTransition(async () => {
        try {
          await apiFetch(`/v1/shops/${state.shopId}/sepay/config`, {
            method: 'PUT',
            body: JSON.stringify({
              env: state.sepayEnv,
              client_id: state.sepayClientId || undefined,
              client_secret: state.sepayClientSecret || undefined,
              provider_account_id: state.sepayProviderAccountId,
              template_code: state.sepayTemplateCode,
              invoice_series: state.sepayInvoiceSeries,
              default_payment_method: state.sepayPaymentMethod,
              default_tax_rate: Number(state.defaultTaxRate)
            })
          });
          resolve();
        } catch (e) {
          setError(e instanceof ApiClientError ? e.message : 'Không lưu được cấu hình SePay.');
          reject(e);
        }
      });
    });
  }

  async function testSepay() {
    setError(null);
    return new Promise<void>((resolve, reject) => {
      startTransition(async () => {
        try {
          await apiFetch(`/v1/shops/${state.shopId}/sepay/test`, { method: 'POST', body: JSON.stringify({}) });
          resolve();
        } catch (e) {
          setError(e instanceof ApiClientError ? e.message : 'Kết nối SePay thất bại.');
          reject(e);
        }
      });
    });
  }

  async function saveStep5() {
    setError(null);
    return new Promise<void>((resolve, reject) => {
      startTransition(async () => {
        try {
          await apiFetch(`/v1/shops/${state.shopId}/tax/defaults`, {
            method: 'PUT',
            body: JSON.stringify({
              defaultTaxRate: Number(state.defaultTaxRate),
              defaultInvoiceType: 'ban_hang',
              unknownProductPolicy: state.unknownProductPolicy
            })
          });
          resolve();
        } catch (e) {
          setError(e instanceof ApiClientError ? e.message : 'Không lưu được tax defaults.');
          reject(e);
        }
      });
    });
  }

  function complete() {
    router.push('/dashboard');
    router.refresh();
  }

  async function handleNext() {
    setError(null);
    try {
      if (step === 1) await saveStep1();
      else if (step === 2) await saveStep2();
      else if (step === 3) { await saveStep3(); await testPancake(); }
      else if (step === 4) { await saveStep4(); await testSepay(); }
      else if (step === 5) await saveStep5();
      setStep(s => s + 1);
    } catch {}
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        {STEPS.map(s => (
          <div key={s.num} className="flex items-center gap-2">
            <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${step >= s.num ? 'bg-emerald-700 text-white' : 'bg-zinc-200 text-zinc-500'}`}>
              {s.num}
            </div>
            <span className={`hidden text-sm md:block ${step >= s.num ? 'text-zinc-900' : 'text-zinc-400'}`}>{s.label}</span>
            {s.num < STEPS.length && <div className={`h-px w-6 bg-zinc-200 ${step > s.num ? 'bg-emerald-700' : ''}`} />}
          </div>
        ))}
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">{error}</div>
      ) : null}

      {step === 1 && (
        <div className="space-y-5">
          <h2 className="text-lg font-semibold text-zinc-900">Thông tin công ty</h2>
          <p className="text-sm text-zinc-600">Xác nhận tên công ty/tenant của bạn.</p>
          <TextInput label="Tên công ty" value={state.tenantName} onChange={e => update('tenantName', e.target.value)} placeholder="Công ty TNHH ABC" required />
        </div>
      )}

      {step === 2 && (
        <div className="space-y-5">
          <h2 className="text-lg font-semibold text-zinc-900">Tạo shop đầu tiên</h2>
          <p className="text-sm text-zinc-600">Tạo shop để kết nối với Pancake POS.</p>
          <div className="grid gap-5 md:grid-cols-2">
            <TextInput label="Pancake shop ID" value={state.externalShopId} onChange={e => update('externalShopId', e.target.value)} placeholder="shop_123" required />
            <TextInput label="Tên shop" value={state.shopName} onChange={e => update('shopName', e.target.value)} placeholder="Cửa hàng trung tâm" required />
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-5">
          <h2 className="text-lg font-semibold text-zinc-900">Cấu hình Pancake</h2>
          <p className="text-sm text-zinc-600">Nhập API key và webhook secret từ Pancake POS.</p>
          <div className="grid gap-5 md:grid-cols-2">
            <TextInput label="Pancake API key" value={state.pancakeApiKey} onChange={e => update('pancakeApiKey', e.target.value)} type="password" placeholder="pk_live_..." helper="Để trống nếu không đổi." />
            <TextInput label="Webhook secret" value={state.pancakeWebhookSecret} onChange={e => update('pancakeWebhookSecret', e.target.value)} type="password" placeholder="whsec_..." helper="Để trống nếu không đổi." />
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-5">
          <h2 className="text-lg font-semibold text-zinc-900">Cấu hình SePay</h2>
          <p className="text-sm text-zinc-600">Nhập thông tin tài khoản SePay eInvoice.</p>
          <div className="grid gap-5 md:grid-cols-2">
            <SelectInput label="Environment" value={state.sepayEnv} onChange={e => update('sepayEnv', e.target.value)}>
              <option value="sandbox">Sandbox</option>
              <option value="production">Production</option>
            </SelectInput>
            <TextInput label="Provider account ID" value={state.sepayProviderAccountId} onChange={e => update('sepayProviderAccountId', e.target.value)} required />
            <TextInput label="Client ID" value={state.sepayClientId} onChange={e => update('sepayClientId', e.target.value)} type="password" placeholder="•" helper="Để trống nếu không đổi." />
            <TextInput label="Client secret" value={state.sepayClientSecret} onChange={e => update('sepayClientSecret', e.target.value)} type="password" placeholder="•" helper="Để trống nếu không đổi." />
            <TextInput label="Invoice series" value={state.sepayInvoiceSeries} onChange={e => update('sepayInvoiceSeries', e.target.value)} placeholder="MYCO" required />
            <SelectInput label="Template" value={state.sepayTemplateCode} onChange={e => update('sepayTemplateCode', e.target.value)}>
              <option value="2">Bán hàng</option>
              <option value="1">GTGT</option>
            </SelectInput>
            <SelectInput label="Payment method" value={state.sepayPaymentMethod} onChange={e => update('sepayPaymentMethod', e.target.value)}>
              <option value="TM">TM</option>
              <option value="CK">CK</option>
              <option value="TM/CK">TM/CK</option>
              <option value="KHAC">KHAC</option>
            </SelectInput>
          </div>
        </div>
      )}

      {step === 5 && (
        <div className="space-y-5">
          <h2 className="text-lg font-semibold text-zinc-900">Cấu hình thuế mặc định</h2>
          <p className="text-sm text-zinc-600">Đặt thuế suất mặc định và policy cho sản phẩm chưa map.</p>
          <div className="grid gap-5 md:grid-cols-2">
            <SelectInput label="Default tax rate" value={state.defaultTaxRate} onChange={e => update('defaultTaxRate', e.target.value)}>
              <option value="-2">Không chịu thuế</option>
              <option value="-1">Không kê khai</option>
              <option value="0">0%</option>
              <option value="5">5%</option>
              <option value="8">8%</option>
              <option value="10">10%</option>
            </SelectInput>
            <SelectInput label="Unknown product policy" value={state.unknownProductPolicy} onChange={e => update('unknownProductPolicy', e.target.value)}>
              <option value="warn">Warn - cảnh báo nhưng vẫn tiếp tục</option>
              <option value="block">Block - dừng lại để map trước</option>
              <option value="use_default">Use default - dùng tax mặc định</option>
            </SelectInput>
          </div>
        </div>
      )}

      {step === 6 && (
        <div className="space-y-5 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
            <svg className="h-8 w-8 text-emerald-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-zinc-900">Hoàn tất cấu hình!</h2>
          <p className="text-zinc-600">Tài khoản của bạn đã được thiết lập. Bạn có thể bắt đầu sử dụng ngay.</p>
        </div>
      )}

      <div className="flex gap-3">
        {step > 1 && (
          <Button type="button" variant="secondary" onClick={() => setStep(s => s - 1)} disabled={isPending}>
            Back
          </Button>
        )}
        {step < 6 && (
          <Button type="button" onClick={handleNext} disabled={isPending}>
            {isPending ? 'Đang xử lý...' : step === 3 ? 'Save & Test Pancake' : step === 4 ? 'Save & Test SePay' : 'Continue'}
          </Button>
        )}
        {step === 6 && (
          <Button type="button" onClick={complete}>
            Go to dashboard
          </Button>
        )}
      </div>
    </div>
  );
}
