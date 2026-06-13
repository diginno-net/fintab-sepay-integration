import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { JobActions } from '../features/job-history/job-actions';

const mockApiFetch = vi.fn();

vi.mock('../lib/api/client', () => ({
  apiFetch: (...args: unknown[]) => mockApiFetch(...args),
  ApiClientError: class extends Error {
    constructor(
      public readonly message: string,
      public readonly status: number,
      public readonly code: string
    ) { super(message); }
  }
}));

describe('JobActions - button visibility by status', () => {
  it('draft_create_queued: shows refresh, no issue/PDF/retry', () => {
    render(<JobActions invoiceJobId="job-123" status="draft_create_queued" />);
    expect(screen.getByRole('button', { name: /làm mới hóa đơn/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /phát hành/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /xem pdf/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /tải pdf/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /thử lại/i })).not.toBeInTheDocument();
  });

  it('draft_create_polling: shows refresh, no issue/PDF/retry', () => {
    render(<JobActions invoiceJobId="job-123" status="draft_create_polling" />);
    expect(screen.getByRole('button', { name: /làm mới hóa đơn/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /phát hành/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /xem pdf/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /tải pdf/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /thử lại/i })).not.toBeInTheDocument();
  });

  it('draft_created: shows refresh, issue, view PDF, download PDF', () => {
    render(<JobActions invoiceJobId="job-123" status="draft_created" />);
    expect(screen.getByRole('button', { name: /làm mới hóa đơn/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /phát hành/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /xem pdf/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /tải pdf/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /thử lại/i })).not.toBeInTheDocument();
  });

  it('issued: shows view PDF and download PDF, no refresh/issue/retry', () => {
    render(<JobActions invoiceJobId="job-123" status="issued" />);
    expect(screen.queryByRole('button', { name: /làm mới hóa đơn/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /phát hành/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /xem pdf/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /tải pdf/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /thử lại/i })).not.toBeInTheDocument();
  });

  it('failed: shows retry, no PDF/issue', () => {
    render(<JobActions invoiceJobId="job-123" status="failed" />);
    expect(screen.queryByRole('button', { name: /làm mới hóa đơn/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /thử lại/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /xem pdf/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /tải pdf/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /phát hành/i })).not.toBeInTheDocument();
  });

  it('timeout: shows retry', () => {
    render(<JobActions invoiceJobId="job-123" status="timeout" />);
    expect(screen.queryByRole('button', { name: /làm mới hóa đơn/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /thử lại/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /xem pdf/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /tải pdf/i })).not.toBeInTheDocument();
  });

  it('displays status label', () => {
    render(<JobActions invoiceJobId="job-123" status="draft_create_polling" />);
    expect(screen.getByText((content) => content.includes('draft_create_polling'))).toBeInTheDocument();
  });

  it('issued status shows green label', () => {
    render(<JobActions invoiceJobId="job-123" status="issued" />);
    expect(screen.getByText((content) => content.includes('issued'))).toBeInTheDocument();
  });
});
