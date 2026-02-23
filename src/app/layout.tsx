import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Timber Yard Management System',
  description: 'GPS-based timber yard operations dashboard with real-time loader tracking',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          crossOrigin=""
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
