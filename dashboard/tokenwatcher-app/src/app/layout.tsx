// src/app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import ClientProviders from "./ClientProviders";

export const metadata: Metadata = {
  title: "TokenWatcher Dashboard",
  description: "Create watchers, view recent events, and receive real-time alerts.",
  openGraph: {
    title: "TokenWatcher Dashboard",
    description: "Create watchers, view recent events, and receive real-time alerts.",
    url: "https://tu-dominio.com",           // Cambia esto a tu dominio real
    siteName: "TokenWatcher",
    images: [
      {
        url: "/og-image.png",                  // Asegúrate de tener public/og-image.png
        width: 1200,
        height: 630,
        alt: "TokenWatcher Open Graph Image",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "TokenWatcher Dashboard",
    description: "Create watchers, view recent events, and receive real-time alerts.",
    images: ["/og-image.png"],
  },
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
  weight: ["400", "700"],
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  weight: ["400", "700"],
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geist.variable} ${geistMono.variable} bg-gray-50 dark:bg-gray-900`}
    >
      <head>
        {/* Si necesitas agregar meta tags adicionales o favicon, hazlo aquí */}
      </head>
      <body>
        {/* 
          NOTA: ClientProviders está marcado como "use client", por lo que
          todo lo que dependa de contextos/hook de cliente debe ir dentro de este wrapper.
        */}
        <ClientProviders>
          {children}
        </ClientProviders>
      </body>
    </html>
  );
}
