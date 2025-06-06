// src/app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "TokenWatcher",
  description:
    "TokenWatcher – Monitoriza transferencias ERC-20 en tiempo real. Páginas públicas y Dashboard de usuario.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head />
      <body>{children}</body>
    </html>
  );
}
