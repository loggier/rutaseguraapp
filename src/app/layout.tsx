import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import Script from "next/script";

export const metadata: Metadata = {
  title: "RutaSegura",
  description: "Sistema de rastreo de autobuses escolares.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased">
        {children}
        <Toaster />
        <Script
          src={`https://maps.googleapis.com/maps/api/js?key=AIzaSyA8CGaBbP4noO5LGQ10Xc58XNEmO35tTQ0&libraries=places&callback=Function.prototype`}
          strategy="beforeInteractive"
        />
      </body>
    </html>
  );
}
