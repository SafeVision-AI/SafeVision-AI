import 'maplibre-gl/dist/maplibre-gl.css';
import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import './globals.css';
import { ConnectivityProvider } from '@/components/ConnectivityProvider';
import { ThemeProvider } from '@/components/ThemeProvider';
import { PageShell } from '@/components/PageShell';
import { AnalyticsProvider } from '@/lib/analytics-provider';
import { EnterpriseClientAppHooks } from '@/components/EnterpriseClientAppHooks';

export const metadata: Metadata = {
  title: 'SafeVixAI - AI-Powered Road Safety',
  description:
    'Find nearest hospitals, police stations and ambulances instantly. AI chatbot for road laws and first aid. Works offline. IIT Madras Road Safety Hackathon 2026.',
  keywords: ['road safety', 'emergency', 'hospital finder', 'traffic laws', 'first aid', 'accident help', 'India'],
  authors: [{ name: 'SafeVixAI Team' }],
  manifest: '/manifest.json',
  appleWebApp: {
    statusBarStyle: 'black-translucent',
    title: 'SafeVixAI',
  },
  openGraph: {
    title: 'SafeVixAI - AI-Powered Road Safety',
    description: 'Emergency help, AI legal assistant and road reporter. Works offline.',
    type: 'website',
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: 'var(--bg-primary)' },
    { media: '(prefers-color-scheme: light)', color: '#F0F4F8' },
  ],
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className="font-sans">
      <head>
        <link rel="icon" type="image/png" href="/icons/favicon.png" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@100..900&family=JetBrains+Mono:wght@400;500;600;700;800&family=Space+Grotesk:wght@300..700&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
        <Script src="/theme-init.js" strategy="beforeInteractive" />
      </head>
      <body>
        <AnalyticsProvider>
          <ThemeProvider>
            <ConnectivityProvider>
              <EnterpriseClientAppHooks />
              <PageShell>{children}</PageShell>
            </ConnectivityProvider>
          </ThemeProvider>
        </AnalyticsProvider>
      </body>
    </html>
  );
}
