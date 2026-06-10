'use client';

import Link from 'next/link';
import { JobActions } from '@/features/job-history/job-actions';
import { getInvoiceErrorInfo, type InvoiceErrorInfo } from './invoice-error-messages';
import { Badge } from '@/components/status/badge';

type InvoiceJobRecord = Record<string, unknown>;

const STATUS_LABELS: Record<string, string> = {
  draft_create_queued: 'Đang chờ tạo bản nháp',
  draft_create_polling: 'Đang chờ SePay tạo bản nháp',
  draft_create_running: 'Đang tạo bản nháp',
  draft_created: 'Bản nháp đã tạo',
  issue_queued: 'Đang chờ phát hành',
  issue_polling: 'Đang chờ SePay phát hành',
  issue_running: 'Đang phát hành',
  issued: 'Đã phát hành',
  failed: 'Thất bại',
  timeout: 'Hết thời gian',
  cancelled: 'Đã hủy',
};

const STATUS_TONE: Record<string, 'neutral' | 'success' | 'warning' | 'danger'> = {
  draft_create_queued: 'warning',
  draft_create_polling: 'warning',
  draft_create_running: 'warning',
  draft_created: 'warning',
  issue_queued: 'warning',
  issue_polling: 'warning',
  issue_running: 'warning',
  issued: 'success',
  failed: 'danger',
  timeout: 'danger',
  cancelled: 'neutral',
};

const FLOW_STEPS = [
  { key: 'draft_create_queued', label: 'Tạo nháp' },
  { key: 'draft_created', label: 'Nháp xong' },
  { key: 'issue_queued', label: 'Phát hành' },
  { key: 'issued', label: 'Hoàn tất' },
];

function label(s: string) {
  return STATUS_LABELS[s] ?? s;
}

function json(v: unknown) {
  if (!v) return null;
  if (typeof v === 'object') return v;
  try { return JSON.parse(String(v)); } catch { return null; }
}

function getJobErrorInfo(job: InvoiceJobRecord): InvoiceErrorInfo | null {
  const errorJson = json(job.error_json);
  if (errorJson && typeof errorJson === 'object' && 'code' in errorJson) {
    return getInvoiceErrorInfo({
      code: String((errorJson as { code: string }).code),
      message: (errorJson as { message?: string }).message,
    });
  }
  const warnings = json(job.mapping_warnings_json);
  if (Array.isArray(warnings) && warnings.length > 0) {
    const firstWarning = warnings[0] as { code?: string; message?: string };
    if (firstWarning?.code) {
      return getInvoiceErrorInfo({ code: firstWarning.code, message: firstWarning.message });
    }
  }
  return null;
}

function ErrorGuidance({ info }: { info: InvoiceErrorInfo }) {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-4 space-y-2">
      <p className="text-sm font-semibold text-red-800">{info.title}</p>
      <p className="text-sm text-red-700">{info.message}</p>
      {info.actionLabel ? (
        info.actionHref ? (
          <Link
            href={info.actionHref}
            className="inline-flex items-center rounded-lg border border-red-300 bg-white px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50"
          >
            {info.actionLabel}
          </Link>
        ) : (
          <span className="inline-flex items-center rounded-lg border border-red-300 bg-white px-3 py-1.5 text-xs font-medium text-red-700">
            {info.actionLabel}
          </span>
        )
      ) : null}
    </div>
  );
}

function InvoiceTimeline({ status }: { status: string }) {
  const currentIndex = FLOW_STEPS.findIndex(s => s.key === status);
  const isCompleted = status === 'issued';
  const isFailed = status === 'failed' || status === 'timeout';

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between">
        {FLOW_STEPS.map((step, index) => {
          const isActive = index === currentIndex;
          const isPast = index < currentIndex || isCompleted;

          return (
            <div key={step.key} className="flex flex-1 items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
                    isCompleted
                      ? 'bg-emerald-100 text-emerald-700'
                      : isPast
                      ? 'bg-emerald-100 text-emerald-700'
                      : isActive
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-zinc-100 text-zinc-400'
                  }`}
                >
                  {isCompleted || isPast ? '✓' : index + 1}
                </div>
                <span className={`mt-1 text-xs ${isActive ? 'font-medium text-amber-700' : 'text-zinc-500'}`}>
                  {step.label}
                </span>
              </div>
              {index < FLOW_STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 ${isPast || isCompleted ? 'bg-emerald-200' : 'bg-zinc-200'}`} />
              )}
            </div>
          );
        })}
      </div>
      {isFailed && (
        <p className="mt-3 text-center text-sm text-red-600">
          Luồng xử lý thất bại. Vui lòng thử lại hoặc liên hệ hỗ trợ.
        </p>
      )}
    </div>
  );
}

export function InvoiceJobDetail({ job }: { job: InvoiceJobRecord }) {
  const warnings = json(job.mapping_warnings_json);
  const payload = json(job.request_payload_json);
  const response = json(job.response_json);
  const errorInfo = getJobErrorInfo(job);
  const status = String(job.status ?? '');

  return (
    <div className="space-y-6">
      <InvoiceTimeline status={status} />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
          <p className="mb-1 text-xs font-medium uppercase tracking-widest text-zinc-400">Order</p>
          <Link href={`/orders/${job.source_order_id}`} className="font-mono text-sm font-semibold text-emerald-700 hover:underline">
            #{String(job.source_order_id ?? '-')}
          </Link>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
          <p className="mb-1 text-xs font-medium uppercase tracking-widest text-zinc-400">Loại hóa đơn</p>
          <p className="font-semibold">{job.invoice_type === 'gtgt' ? 'GTGT' : 'Bán hàng'}</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
          <p className="mb-1 text-xs font-medium uppercase tracking-widest text-zinc-400">Trạng thái</p>
          <Badge tone={STATUS_TONE[status] || 'neutral'}>{label(status)}</Badge>
        </div>
        {job.sepay_create_tracking_code ? (
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
            <p className="mb-1 text-xs font-medium uppercase tracking-widest text-zinc-400">Create tracking</p>
            <p className="font-mono text-xs">{String(job.sepay_create_tracking_code)}</p>
          </div>
        ) : null}
        {job.sepay_reference_code ? (
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
            <p className="mb-1 text-xs font-medium uppercase tracking-widest text-zinc-400">Reference code</p>
            <p className="font-mono text-xs font-semibold">{String(job.sepay_reference_code)}</p>
          </div>
        ) : null}
        {job.sepay_issue_tracking_code ? (
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
            <p className="mb-1 text-xs font-medium uppercase tracking-widest text-zinc-400">Issue tracking</p>
            <p className="font-mono text-xs">{String(job.sepay_issue_tracking_code)}</p>
          </div>
        ) : null}
        {job.invoice_number ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="mb-1 text-xs font-medium uppercase tracking-widest text-emerald-500">Số hóa đơn</p>
            <p className="font-mono text-sm font-bold text-emerald-800">{String(job.invoice_number)}</p>
          </div>
        ) : null}
      </div>

      {(status === 'failed' || status === 'timeout') && errorInfo ? (
        <ErrorGuidance info={errorInfo} />
      ) : null}

      {Array.isArray(warnings) && warnings.length > 0 ? (
        <div>
          <p className="mb-2 text-sm font-semibold text-amber-700">Cảnh báo mapping</p>
          <ul className="space-y-1">
            {warnings.map((w: unknown, i: number) => (
              <li key={i} className="text-sm text-amber-700">
                {typeof w === 'object' && w !== null && 'code' in w ? `[${(w as {code:string}).code}] ` : ''}
                {typeof w === 'object' && w !== null && 'message' in w ? (w as {message:string}).message : String(w)}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <JobActions invoiceJobId={String(job.id)} status={status} invoiceNumber={typeof job.invoice_number === 'string' ? job.invoice_number : undefined} />

      {payload ? (
        <details className="rounded-2xl border border-zinc-200">
          <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-zinc-700">Payload gửi SePay</summary>
          <pre className="max-h-64 overflow-auto px-4 pb-4 text-xs text-zinc-100">{JSON.stringify(payload, null, 2)}</pre>
        </details>
      ) : null}
      {response ? (
        <details className="rounded-2xl border border-zinc-200">
          <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-zinc-700">Response từ SePay</summary>
          <pre className="max-h-64 overflow-auto px-4 pb-4 text-xs text-zinc-100">{JSON.stringify(response, null, 2)}</pre>
        </details>
      ) : null}
    </div>
  );
}
