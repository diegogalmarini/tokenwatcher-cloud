// src/app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import Script from 'next/script'; // 1. Importamos el componente Script

export const metadata: Metadata = {
  title: "TokenWatcher",
  description:
    "TokenWatcher – Monitoriza transferencias ERC-20 en tiempo real. Páginas públicas y Dashboard de usuario.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const GTM_ID = 'GTM-N4JTJV7V'; // Tu ID de GTM

  return (
    <html lang="en">
      <head>
        {/* 2. Añadimos el script de GTM para el <head> */}
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
        {/* 3. Añadimos el snippet <noscript> de GTM justo después de la apertura de <body> */}
        <noscript>
          <iframe
            src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
            height="0"
            width="0"
            style={{ display: 'none', visibility: 'hidden' }}
          ></iframe>
        </noscript>
        
        {children}
      </body>
    </html>
  );
}