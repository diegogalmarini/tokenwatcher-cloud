// src/app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import Script from 'next/script';
import ClientProviders from "./ClientProviders";
import Navbar from "@/components/layout/Navbar"; // 1. Importamos Navbar
import Footer from "@/components/layout/Footer"; // 2. Importamos Footer

export const metadata: Metadata = {
  title: {
    default: 'TokenWatcher - Real-Time ERC-20 Event Monitoring',
    template: '%s | TokenWatcher',
  },
  description:
    "TokenWatcher – Monitor, track, and get real-time alerts for significant ERC-20 token transfers.",
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const GTM_ID = 'GTM-N4JTJV7V';

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <Script
          id="gtm-script-head"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
              'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer','${GTM_ID}');
            `,
          }}
        />
      </head>
      <body>
        <noscript>
          <iframe
            src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
            height="0"
            width="0"
            style={{ display: 'none', visibility: 'hidden' }}
          ></iframe>
        </noscript>
        
        <ClientProviders>
          <div className="flex flex-col min-h-screen">
            {/* 3. Renderizamos el Navbar aquí */}
            <Navbar />
            {/* 4. El contenido de cada página se insertará aquí */}
            <main className="flex-grow">
              {children}
            </main>
            {/* 5. Renderizamos el Footer aquí */}
            <Footer />
          </div>
        </ClientProviders>
      </body>
    </html>
  );
}