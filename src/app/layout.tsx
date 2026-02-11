import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import Script from "next/script";

export const metadata: Metadata = {
  title: "RutaSegura",
  description: "Sistema de rastreo de autobuses escolares.",
  manifest: "/manifest.json",
  themeColor: "#01C998",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "RutaSegura",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap"
          rel="stylesheet"
        />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png"></link>
        <Script src="/js/EasyPlayer-pro.js" strategy="beforeInteractive" />
      </head>
      <body className="font-body antialiased bg-background text-foreground">
        {children}
        <Toaster />
        <Script id="service-worker-registration" strategy="afterInteractive">
          {`
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', () => {
                console.log('[SW] Page loaded. Attempting to register Service Worker...');
                navigator.serviceWorker.register('/sw.js', { scope: '/' })
                  .then(registration => {
                    console.log('%c[SW] Registration successful!', 'color: green', 'Scope is:', registration.scope);
                  })
                  .catch(registrationError => {
                    console.error('%c[SW] Registration failed!', 'color: red', registrationError);
                  });
              });
            }
          `}
        </Script>
      </body>
    </html>
  );
}
