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
  it('draft_create_queued: shows Refresh invoice, no Issue/PDF/Retry', () => {
    render(<JobActions invoiceJobId="job-123" status="draft_create_queued" />);
    expect(screen.getByRole('button', { name: /refresh invoice/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /issue/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /view pdf/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /download pdf/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /retry/i })).not.toBeInTheDocument();
  });

  it('draft_create_polling: shows Refresh invoice, no Issue/PDF/Retry', () => {
    render(<JobActions invoiceJobId="job-123" status="draft_create_polling" />);
    expect(screen.getByRole('button', { name: /refresh invoice/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /issue/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /view pdf/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /download pdf/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /retry/i })).not.toBeInTheDocument();
  });

  it('draft_created: shows Refresh invoice, Issue, View PDF, Download PDF', () => {
    render(<JobActions invoiceJobId="job-123" status="draft_created" />);
    expect(screen.getByRole('button', { name: /refresh invoice/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /issue/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /view pdf/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /download pdf/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /retry/i })).not.toBeInTheDocument();
  });

  it('issued: shows View PDF and Download PDF, no Refresh/Issue/Retry', () => {
    render(<JobActions invoiceJobId="job-123" status="issued" />);
    expect(screen.queryByRole('button', { name: /refresh invoice/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /issue/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /view pdf/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /download pdf/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /retry/i })).not.toBeInTheDocument();
  });

  it('failed: shows Refresh invoice and Retry, no PDF/Issue', () => {
    render(<JobActions invoiceJobId="job-123" status="failed" />);
    expect(screen.queryByRole('button', { name: /refresh invoice/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /view pdf/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /download pdf/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /issue/i })).not.toBeInTheDocument();
  });

  it('timeout: shows Refresh invoice and Retry', () => {
    render(<JobActions invoiceJobId="job-123" status="timeout" />);
    expect(screen.queryByRole('button', { name: /refresh invoice/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /view pdf/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /download pdf/i })).not.toBeInTheDocument();
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
