// src/components/layout/Footer.tsx
"use client";

import React, { useState } from "react";
import Link from 'next/link'; // Importamos Link para la nueva página de contacto
import {
  ClipboardDocumentIcon,
  ClipboardDocumentCheckIcon,
} from "@heroicons/react/24/outline";
import { FaXTwitter, FaDiscord, FaGithub, FaLinkedin } from "react-icons/fa6";

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

        {/* Column 2: Quick Links */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-white mb-2">Quick Links</h3>
          <ul className="space-y-1.5">
            <li><Link href="/what-is-tokenwatcher" className="hover:text-white transition">What is Tokenwatcher</Link></li>
            <li><Link href="/how-it-works" className="hover:text-white transition">How it works</Link></li>
            <li><Link href="/about" className="hover:text-white transition">About</Link></li>
            <li><Link href="/whitepaper" className="hover:text-white transition">Whitepaper</Link></li>
          </ul>
        </div>

        {/* === COLUMNA 3 CORREGIDA === */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-white mb-2">Legal & Contact</h3>
          <ul className="space-y-1.5">
            <li><Link href="/privacy" className="hover:text-white transition">Privacy Policy</Link></li>
            <li><Link href="/terms" className="hover:text-white transition">Terms of Service</Link></li>
            {/* ENLACE A LA PÁGINA DE CONTACTO AÑADIDO */}
            <li><Link href="/contact" className="hover:text-white transition">Contact Us</Link></li>
          </ul>
          <div className="pt-2">
            <p className="font-medium text-white">Follow us:</p>
          </div>
          <div className="flex space-x-4 pt-1">
            <a href="https://x.com/TokenWatcherApp" target="_blank" rel="noopener noreferrer" title="Twitter / X" className="text-neutral-400 hover:text-white transition">
              <FaXTwitter className="h-6 w-6" />
            </a>
            <a href="https://discord.gg/SZ3RTEam" target="_blank" rel="noopener noreferrer" title="Discord" className="text-neutral-400 hover:text-white transition">
              <FaDiscord className="h-6 w-6" />
            </a>
            <a href="https://github.com/diegogalmarini/tokenwatcher-cloud" target="_blank" rel="noopener noreferrer" title="GitHub Repository" className="text-neutral-400 hover:text-white transition">
              <FaGithub className="h-6 w-6" />
            </a>
            <a href="https://www.linkedin.com/in/diegogalmarini/" target="_blank" rel="noopener noreferrer" title="LinkedIn" className="text-neutral-400 hover:text-white transition">
              <FaLinkedin className="h-6 w-6" />
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