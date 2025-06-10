// src/components/watchers/WatcherTable.tsx
"use client";

import React, { useState } from "react"; // <-- 1. Importamos useState
import { Watcher } from "@/lib/useWatchers";
import Image from "next/image";
import ConfirmationModal from "@/components/common/ConfirmationModal"; // <-- 2. Importamos nuestro nuevo modal

interface Props {
  watchers: Watcher[];
  onEdit: (watcher: Watcher) => void;
  onDelete: (watcherId: number) => void;
  onToggleActive: (watcher: Watcher) => void;
}

const ETHERSCAN_BASE_URL = process.env.NEXT_PUBLIC_ETHERSCAN_URL || "https://etherscan.io";

export default function WatcherTable({ watchers, onEdit, onDelete, onToggleActive }: Props) {
  
  // --- 3. AÑADIMOS ESTADOS PARA GESTIONAR EL MODAL ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  // Guardaremos la acción a ejecutar y el contenido del modal en el estado
  const [modalContent, setModalContent] = useState({
    title: "",
    message: "",
    confirmAction: () => {},
    confirmText: "Confirm",
    variant: "primary" as "primary" | "danger",
  });

  const openModal = (
    title: string,
    message: string,
    confirmAction: () => void,
    confirmText: string,
    variant: "primary" | "danger"
  ) => {
    setModalContent({ title, message, confirmAction, confirmText, variant });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };
  
  // --- FIN DE LOS ESTADOS DEL MODAL ---


  if (!watchers || watchers.length === 0) {
    return (
      <p className="text-center text-gray-500 dark:text-gray-400 py-8">
        No watchers yet. Create one to get started!
      </p>
    );
  }

  const shortenAddress = (address: string) => {
    if (!address) return "N/A";
    return `<span class="math-inline">\{address\.slice\(0, 6\)\}…</span>{address.slice(-4)}`;
  };

  return (
    <> {/* Envolvemos todo en un Fragment para poder añadir el Modal al final */}
      <div className="overflow-x-auto rounded-lg shadow border border-gray-200 dark:border-gray-700">
        <table className="w-full table-auto bg-white dark:bg-gray-800">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-1/5">Token</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-1/5">Token Address</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-1/6">Threshold</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-1/4">Webhook URL</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-1/6">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-40">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {watchers.map((watcher) => {
              const logoUrl = `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/${watcher.token_address}/logo.png`;

              return (
                <tr key={watcher.id} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                  {/* ... (el resto de las celdas <td> se mantienen igual) ... */}
                  <td className="px-4 py-3 whitespace-nowrap w-1/5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8 mr-3 relative">
                        <Image
                          src={logoUrl}
                          width={32}
                          height={32}
                          alt={`${watcher.name} logo`}
                          className="rounded-full bg-gray-200 dark:bg-gray-600 object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.visibility = "hidden";
                            const placeholder = target.nextElementSibling;
                            if (placeholder) (placeholder as HTMLElement).style.display = "flex";
                          }}
                        />
                         <div className="absolute inset-0 hidden h-8 w-8 rounded-full bg-gray-300 dark:bg-gray-500 items-center justify-center text-xs font-bold text-gray-600 dark:text-gray-200">
                           {watcher.name ? watcher.name.charAt(0).toUpperCase() : "?"}
                         </div>
                      </div>
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate max-w-[100px]" title={watcher.name}>
                        {watcher.name}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap w-1/5">
                    <a href={`<span class="math-inline">\{ETHERSCAN\_BASE\_URL\}/address/</span>{watcher.token_address}`} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 dark:text-blue-400 hover:underline truncate block max-w-[150px]" title={watcher.token_address}>
                      {shortenAddress(watcher.token_address)}
                    </a>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap w-1/6">
                    <div className="text-sm text-gray-700 dark:text-gray-300">{watcher.threshold}</div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap w-1/4 max-w-xs">
                    <a href={watcher.webhook_url || "#"} className={`text-sm truncate block ${watcher.webhook_url ? "text-blue-600 dark:text-blue-400 hover:underline" : "text-gray-400 dark:text-gray-500"}`} title={watcher.webhook_url || "No webhook configured"} target="_blank"