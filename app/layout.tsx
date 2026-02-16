import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Script from 'next/script'

// Ottimizzazione font loading con display swap
const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap', // Migliora il rendering del font
  preload: true,
})

export const viewport: Viewport = {
  themeColor: '#f97316',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

export const metadata: Metadata = {
  title: 'Mistral Impianti - Gestionale Interventi',
  description: 'Gestionale per interventi, manutenzioni e rapportini di Mistral Impianti',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Mistral Impianti',
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/logo.jpg',
  },
  openGraph: {
    title: 'Mistral Impianti - Gestionale Interventi',
    description: 'Gestionale per interventi, manutenzioni e rapportini di Mistral Impianti',
    images: [
      {
        url: '/logo.jpg',
        width: 1200,
        height: 630,
        alt: 'Mistral Impianti Logo',
      },
    ],
    type: 'website',
    locale: 'it_IT',
    siteName: 'Mistral Impianti - Gestionale Interventi',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Mistral Impianti - Gestionale Interventi',
    description: 'Gestionale per interventi, manutenzioni e rapportini di Mistral Impianti',
    images: ['/logo.jpg'],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const isProduction = process.env.NODE_ENV === 'production'

  return (
    <html lang="it">
      <head>
        <link rel="apple-touch-icon" href="/logo.jpg" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body className={inter.className}>
        {children}
        {isProduction ? (
          <Script
            id="register-sw"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                if ('serviceWorker' in navigator) {
                  window.addEventListener('load', function() {
                    navigator.serviceWorker.register('/sw.js').then(
                      function() {
                        console.log('ServiceWorker registration successful');
                      },
                      function(err) {
                        console.log('ServiceWorker registration failed: ', err);
                      }
                    );
                  });
                }
              `,
            }}
          />
        ) : (
          <Script
            id="cleanup-sw-dev"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                if ('serviceWorker' in navigator) {
                  navigator.serviceWorker.getRegistrations().then(function(registrations) {
                    registrations.forEach(function(registration) {
                      registration.unregister();
                    });
                  });
                }
                if ('caches' in window) {
                  caches.keys().then(function(keys) {
                    keys.forEach(function(key) {
                      caches.delete(key);
                    });
                  });
                }
              `,
            }}
          />
        )}
      </body>
    </html>
  )
}
