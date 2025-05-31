// File: dashboard/tokenwatcher-app/src/components/layout/Footer.tsx
import React from "react";
// import Link from "next/link"; // <--- LÍNEA ELIMINADA O COMENTADA

export default function Footer() {
  return (
    <footer className="bg-white dark:bg-gray-800 py-6">
      <div className="max-w-6xl mx-auto px-4 text-center text-gray-700 dark:text-gray-300">
        <p>
          Created by{" "}
          <a
            href="https://www.linkedin.com/in/diegogalmarini/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-blue-600 hover:underline dark:text-blue-400"
          >
            Diego Galmarini
          </a>
          .
          <span className="mx-1">|</span>
          <a
            href="https://etherscan.io/address/0xd924750a51cd789813cab62e3665725cce8b0c61"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-blue-600 hover:underline dark:text-blue-400"
          >
            Donate ETH
          </a>
        </p>
        <p className="mt-2 text-sm">
          © {new Date().getFullYear()} TokenWatcher. All rights reserved.
        </p>
      </div>
    </footer>
  );
}