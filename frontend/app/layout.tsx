import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Fintab SePay Integration',
  description: 'Pancake POS to SePay eInvoice integration platform'
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
