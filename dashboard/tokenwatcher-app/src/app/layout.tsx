// File: src/app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "@/contexts/AuthContext";

export const metadata: Metadata = {
  title: "TokenWatcher",
  description:
    "Create watchers, view recent events, and receive real-time ERC-20 token transfer alerts.",
  // Aquí podrías agregar open graph tags:
  openGraph: {
    title: "TokenWatcher – Real-Time ERC-20 Alerts",
    description:
      "Gain immediate on-chain visibility and receive instant ERC-20 token transfer alerts on Ethereum, Polygon & Arbitrum.",
    images: "/og-image.png", // Asegúrate de tener public/og-image.png
    url: "https://your-domain.com",
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
      className={`${geist.variable} ${geistMono.variable}`}
    >
      <body className="bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
