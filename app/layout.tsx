import type { Metadata, Viewport } from 'next';
import './globals.css'; // Global styles
import PWARegister from '@/components/PWARegister';

export const viewport: Viewport = {
  themeColor: '#00E599',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: "The Box - Zone de décision tactique",
  description: "Application professionnelle de coaching, tableau blanc tactique multi-sports et assistant analytique.",
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
    description: "Application professionnelle de coaching, tableau blanc tactique multi-sports et assistant analytique.",
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "The Box - Zone de décision tactique",
    description: "Application professionnelle de coaching, tableau blanc tactique multi-sports et assistant analytique.",
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <PWARegister />
        {children}
      </body>
    </html>
  );
}
