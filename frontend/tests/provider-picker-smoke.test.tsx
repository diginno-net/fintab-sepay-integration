import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProviderAccountPicker } from '../features/sepay-config/provider-account-picker';
import { downloadArtifact, viewArtifact, type ArtifactResponse } from '../features/invoices/download-artifact';

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

describe('ProviderAccountPicker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders load accounts button', () => {
    render(<ProviderAccountPicker shopId="shop-1" />);
    expect(screen.getByRole('button', { name: /tải tài khoản từ sepay/i })).toBeInTheDocument();
  });

  it('shows error when no accounts returned', async () => {
    mockApiFetch.mockResolvedValueOnce({ data: [] });
    render(<ProviderAccountPicker shopId="shop-1" />);
    await userEvent.click(screen.getByRole('button', { name: /tải tài khoản từ sepay/i }));
    await waitFor(() => {
      expect(screen.getByText(/không tìm thấy tài khoản/i)).toBeInTheDocument();
    });
  });

  it('shows accounts dropdown when accounts are loaded', async () => {
    mockApiFetch.mockResolvedValueOnce({
      data: [
        { id: 'acc-1', name: 'Account 1' },
        { id: 'acc-2', name: 'Account 2' },
      ]
    });
    render(<ProviderAccountPicker shopId="shop-1" />);
    await userEvent.click(screen.getByRole('button', { name: /tải tài khoản từ sepay/i }));
    await waitFor(() => {
      expect(screen.getByLabelText(/tài khoản phát hành/i)).toBeInTheDocument();
    });
  });
});

describe('download-artifact', () => {
  const originalOpen = window.open;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('viewArtifact', () => {
    it('opens URL for type=url artifact', async () => {
      const openSpy = vi.fn();
      window.open = openSpy;
      const artifact: ArtifactResponse = { type: 'url', url: 'https://example.com/file.pdf' };
      await viewArtifact('job-123', artifact);
      expect(openSpy).toHaveBeenCalledWith('https://example.com/file.pdf', '_blank', 'noopener,noreferrer');
      window.open = originalOpen;
    });

    it('throws when no url or data in artifact', async () => {
      const artifact: ArtifactResponse = { type: 'url' };
      await expect(viewArtifact('job-123', artifact)).rejects.toThrow('Không có file để hiển thị.');
    });
  });

  describe('downloadArtifact', () => {
    it('triggers click for type=url artifact', async () => {
      const clickSpy = vi.fn();
      vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
        if (tag === 'a') {
          return {
            href: '',
            download: '',
            click: clickSpy,
            setAttribute: vi.fn(),
          } as unknown as HTMLAnchorElement;
        }
        return document.createElement(tag);
      });
      const artifact: ArtifactResponse = { type: 'url', url: 'https://example.com/file.pdf', filename: 'custom.pdf' };
      await downloadArtifact('job-123', artifact);
      expect(clickSpy).toHaveBeenCalled();
    });

    it('uses fallback filename when not provided', async () => {
      const clickSpy = vi.fn();
      vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
        if (tag === 'a') {
          return {
            href: '',
            download: '',
            click: clickSpy,
            setAttribute: vi.fn(),
          } as unknown as HTMLAnchorElement;
        }
        return document.createElement(tag);
      });
      const artifact: ArtifactResponse = { type: 'url', url: 'https://example.com/file.pdf' };
      await downloadArtifact('job-123', artifact);
      expect(clickSpy).toHaveBeenCalled();
    });

    it('throws when no url or data in artifact', async () => {
      const artifact: ArtifactResponse = { type: 'base64' };
      await expect(downloadArtifact('job-123', artifact)).rejects.toThrow('Không có file để tải.');
    });
  });
});
