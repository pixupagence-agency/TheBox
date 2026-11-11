import type { Metadata, Viewport } from 'next';
import './globals.css'; // Global styles
import PWARegister from '@/components/PWARegister';
import ConfirmDialogHost from '@/components/ConfirmDialog';

export const viewport: Viewport = {
  themeColor: '#111319',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: "The Box - Zone de décision tactique",
  description: "Application professionnelle de coaching et tableau blanc tactique.",
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'The Box',
  },
  icons: {
    icon: [
      { url: "/logo.svg", type: "image/svg+xml" },
      { url: "/pwa-192x192.png", sizes: "192x192", type: "image/png" },
    ],
    shortcut: "/logo.svg",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "The Box - Zone de décision tactique",
    description: "Application professionnelle de coaching et tableau blanc tactique.",
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "The Box - Zone de décision tactique",
    description: "Application professionnelle de coaching et tableau blanc tactique.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* crossOrigin : permet à html-to-image (captures PNG / vue 3D) de lire les règles @font-face sans SecurityError */}
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap" rel="stylesheet" crossOrigin="anonymous" />
      </head>
      <body suppressHydrationWarning>
        <PWARegister />
        {children}
        <ConfirmDialogHost />
      </body>
    </html>
  );
}
