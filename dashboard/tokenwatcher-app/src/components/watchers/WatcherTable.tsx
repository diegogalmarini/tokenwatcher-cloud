// src/components/watchers/WatcherTable.tsx
"use client";

import React from "react";
import { Watcher } from "@/lib/useWatchers";
import Button from "@/components/ui/button";
import Image from "next/image";

interface Props {
  watchers: Watcher[];
  onEdit: (watcher: Watcher) => void;
  onDelete: (watcherId: number) => void;
  onToggleActive: (watcher: Watcher) => void;
}

// Asumimos que tienes una variable de entorno para la URL base de Etherscan
const ETHERSCAN_BASE_URL = process.env.NEXT_PUBLIC_ETHERSCAN_URL || "https://etherscan.io";

export default function WatcherTable({ watchers, onEdit, onDelete, onToggleActive }: Props) {
  if (!watchers || watchers.length === 0) {
    return <p className="text-center text-gray-500 dark:text-gray-400 py-8">No watchers yet. Create one to get started!</p>;
  }

  // Función para acortar direcciones
  const shortenAddress = (address: string) => {
      if (!address) return 'N/A';
      return `${address.slice(0, 6)}…${address.slice(-4)}`;
  }

  return (
    <div className="overflow-x-auto rounded-lg shadow border border-gray-200 dark:border-gray-700">
      <table className="min-w-full table-auto bg-white dark:bg-gray-800">
        <thead className="bg-gray-50 dark:bg-gray-700">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Token</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Token Address</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Threshold</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Webhook URL</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {watchers.map((watcher) => {
            const logoUrl = `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/${watcher.token_address}/logo.png`;

            return (
              <tr key={watcher.id} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                {/* Token Name & Logo */}
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-8 w-8 mr-3 relative"> {/* Añadido 'relative' */}
                      <Image
                        src={logoUrl}
                        width={32}
                        height={32}
                        alt={`${watcher.name} logo`}
                        className="rounded-full bg-gray-200 dark:bg-gray-600 object-cover"
                        onError={(e) => {
                           // Oculta la imagen y muestra el placeholder
                           const target = e.target as HTMLImageElement;
                           target.style.visibility = "hidden"; // Oculta en lugar de display none
                           const placeholder = target.nextElementSibling;
                           if (placeholder) (placeholder as HTMLElement).style.display = 'flex';
                        }}
                      />
                      {/* Placeholder (siempre presente, oculto por defecto) */}
                      <div
                          className="absolute inset-0 hidden h-8 w-8 rounded-full bg-gray-300 dark:bg-gray-500 items-center justify-center text-xs font-bold text-gray-600 dark:text-gray-200"
                      >
                         {watcher.name ? watcher.name.charAt(0).toUpperCase() : '?'}
                      </div>
                    </div>
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate max-w-[100px]" title={watcher.name}>
                        {watcher.name}
                    </div>
                  </div>
                </td>
                {/* Token Address */}
                <td className="px-4 py-3 whitespace-nowrap">
                   <a
                      href={`${ETHERSCAN_BASE_URL}/address/${watcher.token_address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 dark:text-blue-400 hover:underline truncate block max-w-[150px]"
                      title={watcher.token_address}
                    >
                      {shortenAddress(watcher.token_address)}
                   </a>
                </td>
                {/* Threshold */}
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="text-sm text-gray-700 dark:text-gray-300">{watcher.threshold}</div>
                </td>
                {/* Webhook URL */}
                <td className="px-4 py-3 whitespace-nowrap max-w-xs"> {/* Mantenemos max-w-xs */}
                  <a
                    href={watcher.webhook_url || "#"}
                    className={`text-sm truncate block ${watcher.webhook_url ? 'text-blue-600 dark:text-blue-400 hover:underline' : 'text-gray-400 dark:text-gray-500'}`}
                    title={watcher.webhook_url || "No webhook configured"}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {watcher.webhook_url ? `${watcher.webhook_url.slice(0, 35)}...` : "N/A"}
                  </a>
                </td>
                {/* Status */}
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    watcher.is_active
                      ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300" // Cambiado a Gris
                  }`}>
                    {watcher.is_active ? "Active" : "Paused"}
                  </span>
                </td>
                {/* Actions */}
                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium space-x-2">
                  <Button
                    intent="default"
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md" // Estilo Primario
                    onClick={() => onEdit(watcher)}
                  >
                    Edit
                  </Button>
                  <Button
                    intent="default"
                    size="sm"
                    className={`px-3 py-1 rounded-md text-white ${watcher.is_active
                        ? "bg-orange-500 hover:bg-orange-600" // Naranja para Pausar
                        : "bg-green-500 hover:bg-green-600" // Verde para Activar
                    }`}
                    onClick={() => onToggleActive(watcher)}
                  >
                    {watcher.is_active ? "Pause" : "Activate"}
                  </Button>
                  <Button
                    intent="destructive" // Usamos tu intent si aplica colores, sino className lo fuerza
                    size="sm"
                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-md" // Estilo Destructivo
                    onClick={() => onDelete(watcher.id)}
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
  );
}