// src/components/layout/Footer.tsx
"use client";

import React, { useState } from "react";
import {
  ClipboardDocumentIcon,
  ClipboardDocumentCheckIcon,
} from "@heroicons/react/24/outline";

export default function Footer() {
  const ethAddress = "0xd924750a51cd789813cab62e3665725cce8b0c61";
  const [ethCopied, setEthCopied] = useState(false);

  const handleEthCopy = async () => {
    try {
      await navigator.clipboard.writeText(ethAddress);
      setEthCopied(true);
      setTimeout(() => setEthCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy ETH address: ", err);
    }
  };

  return (
    <footer className="bg-[#262626] text-neutral-300 py-12 px-6">
      <div className="max-w-screen-xl mx-auto grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr] gap-8 text-sm">
        {/* Column 1: About / Creator */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-white mb-2">TokenWatcher</h3>
          <p className="text-neutral-200">
            Created by{" "}
            <a
              href="https://www.linkedin.com/in/diegogalmarini/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-neutral-100 font-medium hover:underline"
            >
              Diego Galmarini
            </a>
            . Open-source, built with{" "}
            <span role="img" aria-label="heart" className="text-red-500">
              ❤️
            </span>
            .
          </p>
          <div className="pt-2">
            <p className="mb-1">Support us with a donation (ETH):</p>
            <div className="flex items-center space-x-2">
              <span className="font-mono text-neutral-100 bg-neutral-700 px-2 py-1 rounded break-all">
                {ethAddress}
              </span>
              <button
                onClick={handleEthCopy}
                title="Copy ETH Address"
                className="p-1.5 rounded hover:bg-neutral-700 transition"
              >
                {ethCopied ? (
                  <ClipboardDocumentCheckIcon className="h-5 w-5 text-green-400" />
                ) : (
                  <ClipboardDocumentIcon className="h-5 w-5 text-neutral-400 hover:text-neutral-200" />
                )}
              </button>
            </div>
            {ethCopied && (
              <span className="text-xs text-green-400 mt-1 block">
                Address copied!
              </span>
            )}
          </div>
        </div>

        {/* Column 2: Quick Links - UPDATED */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-white mb-2">Quick Links</h3>
          <ul className="space-y-1.5">
            <li>
              <a
                href="/what-is-tokenwatcher" // Actualizado
                className="hover:text-white transition"
              >
                What is Tokenwatcher {/* Actualizado */}
              </a>
            </li>
            <li>
              <a
                href="/how-it-works" // Actualizado
                className="hover:text-white transition"
              >
                How it works {/* Actualizado */}
              </a>
            </li>
            <li>
              <a
                href="/about" // Actualizado
                className="hover:text-white transition"
              >
                About {/* Actualizado */}
              </a>
            </li>
            <li>
              <a
                href="/whitepaper" // Actualizado (antes /whitepaper.pdf)
                // target="_blank" // Puedes decidir si quieres que se abra en nueva pestaña
                // rel="noopener noreferrer"
                className="hover:text-white transition"
              >
                Whitepaper
              </a>
            </li>
          </ul>
        </div>

        {/* Column 3: Legal & Contact */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-white mb-2">
            Legal & Contact
          </h3>
          <ul className="space-y-1.5">
            <li>
              <a href="/privacy" className="hover:text-white transition">
                Privacy Policy
              </a>
            </li>
            <li>
              <a href="/terms" className="hover:text-white transition">
                Terms of Service
              </a>
            </li>
          </ul>
          <div className="pt-2">
            <p className="font-medium text-white">Contact Us:</p>
            <a
              href="mailto:support@tokenwatcher.app"
              className="hover:text-white hover:underline break-all"
            >
              support@tokenwatcher.app
            </a>
          </div>
          <div className="flex space-x-3 pt-3">
            <a
              href="https://github.com/diegogalmarini/tokenwatcher-cloud"
              target="_blank"
              rel="noopener noreferrer"
              title="GitHub Repository"
              className="text-neutral-400 hover:text-white transition"
            >
              {/* Icono GitHub */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 .5a12 12 0 00-3.79 23.39c.6.11.82-.26.82-.58 0-.29-.01-1.05-.02-2.06-3.34.73-4.04-1.61-4.04-1.61a3.18 3.18 0 00-1.34-1.76c-1.09-.75.08-.74.08-.74a2.52 2.52 0 011.84 1.24 2.55 2.55 0 003.48.99 2.54 2.54 0 01.76-1.6c-2.67-.3-5.48-1.34-5.48-5.95a4.65 4.65 0 011.24-3.23 4.32 4.32 0 01.12-3.19s1.01-.32 3.3 1.23a11.4 11.4 0 016 0c2.3-1.55 3.3-1.23 3.3-1.23a4.32 4.32 0 01.12 3.19 4.65 4.65 0 011.24 3.23c0 4.62-2.81 5.65-5.49 5.95a2.85 2.85 0 01.81 2.21c0 1.6-.01 2.88-.01 3.27 0 .32.22.7.83.58A12 12 0 0012 .5z" />
              </svg>
            </a>
            <a
              href="https://www.linkedin.com/in/diegogalmarini/"
              target="_blank"
              rel="noopener noreferrer"
              title="LinkedIn"
              className="text-neutral-400 hover:text-white transition"
            >
              {/* Icono LinkedIn */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M20.447 20.452H17.42v-5.569c0-1.328-.024-3.036-1.85-3.036-1.853 0-2.136 1.447-2.136 2.942v5.663h-3.027V9h2.907v1.561h.042c.405-.768 1.393-1.576 2.864-1.576 3.062 0 3.627 2.016 3.627 4.636v6.831zM5.337 7.433a1.76 1.76 0 11.005-3.52 1.76 1.76 0 01-.005 3.52zm1.513 13.019H3.824V9h3.026v11.452zM22.225 0H1.771C.792 0 0 .771 0 1.725v20.549C0 23.23.792 24 1.771 24h20.451c.98 0 1.778-.77 1.778-1.726V1.725C24 .771 23.205 0 22.225 0z" />
              </svg>
            </a>
          </div>
        </div>
      </div>

      <div className="mt-10 text-center text-xs text-neutral-400">
        © {new Date().getFullYear()} TokenWatcher. All rights reserved.
      </div>
    </footer>
  );
}