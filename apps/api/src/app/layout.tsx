import type { ReactNode } from 'react';

export const metadata = {
  title: 'Mini Jira API',
  description: 'Backend API del MVP de Mini Jira',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
