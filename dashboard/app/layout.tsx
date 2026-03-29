import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Jenny · Doctor Dashboard',
  description: 'Manage patient check-ins and review data.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
