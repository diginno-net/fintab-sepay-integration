'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/forms/button';
import { ApiClientError, apiFetch } from '@/lib/api/client';
import type { ArtifactResponse } from './download-artifact';

type Props = {
  invoiceJobId: string;
  invoiceNumber?: string;
  open: boolean;
  onClose: () => void;
};

export function PdfPreviewModal({ invoiceJobId, invoiceNumber, open, onClose }: Props) {
  const [pdfData, setPdfData] = useState<ArtifactResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copyLinkMsg, setCopyLinkMsg] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const objectRef = useRef<HTMLObjectElement>(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError(null);
    setPdfData(null);
    apiFetch<ArtifactResponse>(`/v1/invoices/jobs/${invoiceJobId}/download/pdf`, { method: 'GET' })
      .then(data => setPdfData(data))
      .catch((err: unknown) => setError(err instanceof ApiClientError ? err.message : 'Không tải được PDF.'))
      .finally(() => setLoading(false));
  }, [open, invoiceJobId]);

  function handleDownloadPdf() {
    if (!pdfData) return;
    if (pdfData.type === 'url' && pdfData.url) {
      const a = document.createElement('a');
      a.href = pdfData.url;
      a.download = `HD_${invoiceNumber ?? invoiceJobId.slice(0, 8)}.pdf`;
      a.target = '_blank';
      a.click();
      return;
    }
    if ((pdfData.type === 'base64' || pdfData.type === 'binary') && pdfData.data) {
      const binary = atob(pdfData.data);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const blob = new Blob([bytes], { type: pdfData.contentType ?? 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `HD_${invoiceNumber ?? invoiceJobId.slice(0, 8)}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  }

  function handleCopyLink() {
    if (!pdfData?.url) return;
    navigator.clipboard.writeText(pdfData.url).then(() => {
      setCopyLinkMsg('Đã copy link!');
      setTimeout(() => setCopyLinkMsg(null), 2000);
    }).catch(() => setCopyLinkMsg('Không copy được'));
  }

  if (!open) return null;

  const filename = `HD_${invoiceNumber ?? invoiceJobId.slice(0, 8)}.pdf`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="flex h-[90vh] w-[90vw] max-w-4xl flex-col rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-zinc-950">Xem PDF</h2>
            {invoiceNumber && <p className="text-sm text-zinc-500">Hóa đơn số: {invoiceNumber}</p>}
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600">
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-auto bg-zinc-100 p-4">
          {loading && (
            <div className="flex h-64 items-center justify-center text-zinc-500">Đang tải PDF...</div>
          )}
          {error && !loading && (
            <div className="flex h-64 flex-col items-center justify-center gap-3">
              <p className="text-red-600">{error}</p>
              <Button size="sm" variant="secondary" onClick={handleDownloadPdf}>Thử tải file</Button>
            </div>
          )}
          {!loading && !error && pdfData?.type === 'url' && pdfData.url && (
            <iframe
              ref={iframeRef}
              src={pdfData.url}
              className="h-full w-full rounded-xl"
              title={filename}
            />
          )}
          {!loading && !error && (pdfData?.type === 'base64' || pdfData?.type === 'binary') && pdfData?.data && (
            <object
              ref={objectRef}
              data={`data:${pdfData.contentType ?? 'application/pdf'};base64,${pdfData.data}`}
              type={pdfData.contentType ?? 'application/pdf'}
              className="h-full w-full rounded-xl"
            >
              <div className="flex h-64 flex-col items-center justify-center gap-3">
                <p className="text-zinc-600">Trình duyệt không hỗ trợ xem PDF trực tiếp.</p>
                <Button size="sm" variant="secondary" onClick={handleDownloadPdf}>Tải PDF</Button>
              </div>
            </object>
          )}
          {!loading && !error && pdfData && !(pdfData.type === 'url' && pdfData.url) && !(pdfData.type === 'base64' || pdfData.type === 'binary') && pdfData.data && (
            <div className="flex h-64 items-center justify-center text-zinc-500">
              Không có file PDF để hiển thị.
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-zinc-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <Button size="sm" onClick={handleDownloadPdf} disabled={!pdfData}>
              Tải PDF
            </Button>
            {pdfData?.url && (
              <>
                <Button size="sm" variant="secondary" onClick={handleCopyLink}>
                  Sao chép liên kết
                </Button>
                {copyLinkMsg && <span className="text-sm text-emerald-600">{copyLinkMsg}</span>}
              </>
            )}
          </div>
          <Button size="sm" variant="secondary" onClick={onClose}>
            Đóng
          </Button>
        </div>
      </div>
    </div>
  );
}
