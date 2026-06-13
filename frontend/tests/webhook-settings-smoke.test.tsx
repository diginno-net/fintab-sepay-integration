import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import WebhookSettingsPage from '@/app/(platform)/shops/[shopId]/settings/webhook/page';

describe('WebhookSettingsPage', () => {
  it('shows production-safe webhook guidance without placeholder copy', () => {
    render(<WebhookSettingsPage />);

    expect(screen.getByText('Webhook Pancake')).toBeInTheDocument();
    expect(screen.getByText(/\/v1\/webhooks\/pancake/)).toBeInTheDocument();
    expect(screen.queryByText(/FE-102/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/sẽ được nối API/i)).not.toBeInTheDocument();
  });
});
