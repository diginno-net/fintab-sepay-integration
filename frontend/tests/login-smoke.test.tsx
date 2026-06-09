import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LoginForm } from '../features/auth/login-form';

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

describe('Login form rendering', () => {
  it('renders email and password fields', () => {
    render(<LoginForm />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/mật khẩu/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /đăng nhập/i })).toBeInTheDocument();
  });

  it('renders with no error message initially', () => {
    render(<LoginForm />);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
