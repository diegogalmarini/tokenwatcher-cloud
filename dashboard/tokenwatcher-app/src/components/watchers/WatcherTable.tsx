// src/components/watchers/WatcherTable.tsx
"use client";

import React, { useState } from "react";
import { Watcher } from "@/lib/useWatchers";
import Image from "next/image";
import ConfirmationModal from "@/components/common/ConfirmationModal";

interface Props {
  watchers: Watcher[];
  onEdit: (watcher: Watcher) => void;
  onDelete: (watcherId: number) => void;
  onToggleActive: (watcher: Watcher) => void;
}

const ETHERSCAN_BASE_URL = process.env.NEXT_PUBLIC_ETHERSCAN_URL || "https://etherscan.io";

export default function WatcherTable({ watchers, onEdit, onDelete, onToggleActive }: Props) {
  // Estados para gestionar el modal de confirmación
  const [isModalOpen, setIsModalOpen] = useState(false);
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

  if (!watchers || watchers.length === 0) {
    return (
      <p className="text-center text-gray-500 dark:text-gray-400 py-8">
        No watchers yet. Create one to get started!
      </p>
    );
  }

  const shortenAddress = (address: string) => {
    if (!address) return "N/A";
    return `${address.slice(0, 6)}…${address.slice(-4)}`;
  };

  return (
    <>
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
                    <a href={`${ETHERSCAN_BASE_URL}/address/${watcher.token_address}`} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 dark:text-blue-400 hover:underline truncate block max-w-[150px]" title={watcher.token_address}>
                      {shortenAddress(watcher.token_address)}
                    </a>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap w-1/6">
                    <div className="text-sm text-gray-700 dark:text-gray-300">{watcher.threshold}</div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap w-1/4 max-w-xs">
                    <a href={watcher.webhook_url || "#"} className={`text-sm truncate block ${watcher.webhook_url ? "text-blue-600 dark:text-blue-400 hover:underline" : "text-gray-400 dark:text-gray-500"}`} title={watcher.webhook_url || "No webhook configured"} target="_blank" rel="noopener noreferrer">
                      {watcher.webhook_url ? `${watcher.webhook_url.slice(0, 35)}...` : "N/A"}
                    </a>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap w-1/6">
                    <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${watcher.is_active ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200" : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300"}`}>
                      {watcher.is_active ? "Active" : "Paused"}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium space-x-2 w-40">
                    <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md text-xs" onClick={() => onEdit(watcher)}>Edit</button>
                    <button
                      className={`px-3 py-1 rounded-md text-white text-xs ${watcher.is_active ? "bg-orange-500 hover:bg-orange-600" : "bg-green-500 hover:bg-green-600"}`}
                      onClick={() => openModal(
                        watcher.is_active ? 'Pause Watcher' : 'Activate Watcher',
                        `Are you sure you want to ${watcher.is_active ? 'pause' : 'activate'} watcher "${watcher.name}"?`,
                        () => onToggleActive(watcher),
                        watcher.is_active ? 'Yes, Pause' : 'Yes, Activate',
                        'primary'
                      )}
                    >
                      {watcher.is_active ? "Pause" : "Activate"}
                    </button>
                    <button
                      className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-md text-xs"
                      onClick={() => openModal(
                        'Delete Watcher',
                        `Are you sure you want to delete watcher "${watcher.name}"? This action cannot be undone.`,
                        () => onDelete(watcher.id),
                        'Yes, Delete',
                        'danger'
                      )}
                    >
                      Delete
                    </button>
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
        onConfirm={modalContent.confirmAction}
        title={modalContent.title}
        confirmButtonText={modalContent.confirmText}
        confirmButtonVariant={modalContent.variant}
      >
        <p>{modalContent.message}</p>
      </ConfirmationModal>
    </>
  );
}