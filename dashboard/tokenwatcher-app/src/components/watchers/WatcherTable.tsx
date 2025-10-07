// src/components/watchers/WatcherTable.tsx
"use client";

import React, { useState } from "react";
import { Watcher, Transport } from "@/lib/useWatchers";
import Image from "next/image";
import ConfirmationModal from "@/components/common/ConfirmationModal";
import Button from "@/components/ui/button";
import { EnvelopeIcon, LinkIcon } from '@heroicons/react/24/outline';
import { FaTelegramPlane } from "react-icons/fa";

interface Props {
  watchers: Watcher[];
  onEdit: (watcher: Watcher) => void;
  onDelete: (watcherId: number) => Promise<void>; // Aseguramos que sea una promesa
  onToggleActive: (watcher: Watcher) => Promise<void>; // Aseguramos que sea una promesa
  onTest: (watcher: Watcher) => void;
}

const ETHERSCAN_BASE_URL = process.env.NEXT_PUBLIC_ETHERSCAN_URL || "https://etherscan.io";

const TransportDisplay = ({ transport }: { transport: Transport | null }) => {
    if (!transport) {
      return <span className="text-sm text-gray-400 dark:text-gray-500">N/A</span>;
    }
  
    const { type, config } = transport;

    if (type === 'email') {
      const email = config.email || "Invalid Email";
      return (
        <div className="flex items-center space-x-2" title={email}>
          <EnvelopeIcon className="h-4 w-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
          <span className="text-sm text-gray-700 dark:text-gray-300 truncate">{email}</span>
        </div>
      );
    }
  
    if (type === 'discord' || type === 'slack') {
      const url = config.url || "";
      return (
        <a 
          href={url || "#"} 
          className={`flex items-center space-x-2 ${url ? "text-blue-600 dark:text-blue-400 hover:underline" : "text-gray-400 dark:text-gray-500"}`} 
          title={url || "No webhook configured"} 
          target="_blank" 
          rel="noopener noreferrer"
        >
          <LinkIcon className="h-4 w-4 flex-shrink-0" />
          <span className="truncate block">{url ? `${url.slice(0, 35)}...` : "Invalid Webhook"}</span>
        </a>
      );
    }

    // --- CORRECCIÓN EN LA LÓGICA DE TELEGRAM ---
    // El tipo de transporte en la BD es 'telegram', y la config debería tener bot_token y chat_id
    if (type === 'telegram') {
        // Asumimos que config puede tener chat_id, aunque el tipo original no lo mostraba
        // TypeScript puede quejarse aquí si el tipo Transport no se actualiza
        const chatId = (config as any).chat_id || "Invalid Chat ID";
        return (
          <div className="flex items-center space-x-2" title={`Chat ID: ${chatId}`}>
            <FaTelegramPlane className="h-4 w-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
            <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
              Telegram
            </span>
          </div>
        );
    }
  
    return <span className="text-sm text-gray-400 dark:text-gray-500">Unknown type</span>;
};


export default function WatcherTable({ watchers, onEdit, onDelete, onToggleActive, onTest }: Props) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false); // Estado de carga para el botón
  const [modalContent, setModalContent] = useState({
    title: "", message: "", confirmAction: async () => {}, confirmText: "Confirm",
    variant: "primary" as "primary" | "danger",
  });

  const openModal = (title: string, message: string, confirmAction: () => Promise<void>, confirmText: string, variant: "primary" | "danger") => {
    setModalContent({ title, message, confirmAction, confirmText, variant });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setIsConfirming(false); // Reseteamos el estado de carga al cerrar
  };
  
  // --- FUNCIÓN onConfirm MEJORADA ---
  const handleConfirm = async () => {
    setIsConfirming(true);
    try {
      await modalContent.confirmAction();
      closeModal(); // Se cierra solo si la acción tuvo éxito
    } catch (error) {
      console.error("Confirmation action failed:", error);
      // Opcional: mostrar un error al usuario sin cerrar el modal
    } finally {
      // Nos aseguramos de que no se quede en estado de carga si falla
      if (isModalOpen) {
        setIsConfirming(false);
      }
    }
  };


  if (!watchers || watchers.length === 0) {
    return (
      <div className="bg-white dark:bg-[#404040] shadow-lg rounded-lg p-8 mt-6 text-center">
        <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">No Watchers Found</h3>
        <p className="text-gray-500 dark:text-gray-400 mt-2">You haven't created any watchers yet. Click on "+ New Watcher" to get started!</p>
      </div>
    );
  }

  const shortenAddress = (address: string) => {
    if (!address) return "N/A";
    return `${address.slice(0, 6)}…${address.slice(-4)}`;
  };

  return (
    <>
      <div className="overflow-x-auto rounded-lg shadow border border-gray-200 dark:border-neutral-700">
        <table className="w-full table-auto bg-white dark:bg-[#404040]">
          <thead className="bg-gray-50 dark:bg-neutral-800/50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Token</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Token Address</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Threshold (USD)</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Notification Target</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-neutral-700">
            {watchers.map((watcher) => {
              const logoUrl = `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/${watcher.token_address}/logo.png`;
              const firstTransport = watcher.transports && watcher.transports.length > 0 ? watcher.transports[0] : null;

              return (
                <tr key={watcher.id} className="hover:bg-gray-50 dark:hover:bg-neutral-800/40">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8 mr-3 relative">
                        <Image
                          src={logoUrl}
                          width={32} height={32} alt={`${watcher.name} logo`}
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
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate max-w-[120px]" title={watcher.name}>
                        {watcher.name}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <a href={`${ETHERSCAN_BASE_URL}/address/${watcher.token_address}`} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 dark:text-blue-400 hover:underline truncate block max-w-[150px]" title={watcher.token_address}>
                      {shortenAddress(watcher.token_address)}
                    </a>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm text-gray-700 dark:text-gray-300">${watcher.threshold.toLocaleString()}</div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap max-w-xs">
                    <TransportDisplay transport={firstTransport} />
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${watcher.is_active ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200" : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300"}`}>
                      {watcher.is_active ? "Active" : "Paused"}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium space-x-2">
                    <Button intent="default" size="sm" onClick={() => onEdit(watcher)}>Edit</Button>
                    <Button
                      intent="secondary" size="sm"
                      onClick={() => openModal(
                        watcher.is_active ? 'Pause Watcher' : 'Activate Watcher',
                        `Are you sure you want to ${watcher.is_active ? 'pause' : 'activate'} watcher "${watcher.name}"?`,
                        () => onToggleActive(watcher),
                        watcher.is_active ? 'Yes, Pause' : 'Yes, Activate', 'primary'
                      )}
                    >
                      {watcher.is_active ? "Pause" : "Activate"}
                    </Button>
                    <Button intent="secondary" size="sm" onClick={() => onTest(watcher)}>Test</Button>
                    <Button
                      intent="destructive" size="sm"
                      onClick={() => openModal(
                        'Delete Watcher',
                        `Are you sure you want to delete watcher "${watcher.name}"? This action cannot be undone.`,
                        () => onDelete(watcher.id),
                        'Yes, Delete', 'danger'
                      )}
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <ConfirmationModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onConfirm={handleConfirm} // --- CAMBIO CLAVE 1 ---
        isConfirming={isConfirming} // --- CAMBIO CLAVE 2 ---
        title={modalContent.title}
        confirmButtonText={modalContent.confirmText}
        confirmButtonVariant={modalContent.variant}
      >
        <p>{modalContent.message}</p>
      </ConfirmationModal>
    </>
  );
}