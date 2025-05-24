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

export default function WatcherTable({ watchers, onEdit, onDelete, onToggleActive }: Props) {
  if (!watchers || watchers.length === 0) {
    return <p className="text-center text-gray-500 dark:text-gray-400 py-8">No watchers yet. Create one to get started!</p>;
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
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-8 w-8 mr-3">
                      <Image
                        src={logoUrl}
                        width={32}
                        height={32}
                        alt="token logo"
                        className="rounded-full bg-gray-200 dark:bg-gray-600" // Added background for placeholder feel
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = "none"; // Hide broken image
                          // Optionally, show a placeholder div instead of hiding
                           if (target.parentElement) {
                             const placeholder = target.parentElement.querySelector('.logo-placeholder');
                             if (placeholder) (placeholder as HTMLElement).style.display = 'flex';
                           }
                        }}
                      />
                       {/* Placeholder, initially hidden, shown on image error */}
                      <div className="logo-placeholder hidden h-8 w-8 rounded-full bg-gray-300 dark:bg-gray-500 items-center justify-center text-xs text-gray-500 dark:text-gray-300">?</div>
                    </div>
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate max-w-[100px]" title={watcher.name}>
                        {watcher.name}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="text-sm text-gray-700 dark:text-gray-300 truncate max-w-[150px]" title={watcher.token_address}>
                    {watcher.token_address}
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="text-sm text-gray-700 dark:text-gray-300">{watcher.threshold}</div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap max-w-xs"> {/* <-- AJUSTE DE ANCHO MAXIMO */}
                  <a
                    href={watcher.webhook_url || "#"}
                    className={`text-sm truncate block ${watcher.webhook_url ? 'text-blue-600 dark:text-blue-400 hover:underline' : 'text-gray-400 dark:text-gray-500'}`}
                    title={watcher.webhook_url || "No webhook configured"}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {watcher.webhook_url || "N/A"}
                  </a>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    watcher.is_active 
                      ? "bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-100" 
                      : "bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-100"
                  }`}>
                    {watcher.is_active ? "Active" : "Paused"}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium space-x-2">
                  <Button
                    intent="default" 
                    size="sm"
                    className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 px-3 py-1 border border-indigo-300 dark:border-indigo-500 rounded-md hover:bg-indigo-50 dark:hover:bg-gray-700"
                    onClick={() => onEdit(watcher)}
                  >
                    Edit
                  </Button>
                  <Button
                    intent="default" 
                    size="sm"
                    className={`px-3 py-1 rounded-md text-white ${watcher.is_active 
                        ? "bg-yellow-500 hover:bg-yellow-600 focus:ring-yellow-400" 
                        : "bg-green-500 hover:bg-green-600 focus:ring-green-400"   
                    }`}
                    onClick={() => onToggleActive(watcher)}
                  >
                    {watcher.is_active ? "Pause" : "Activate"}
                  </Button>
                  <Button
                    intent="destructive"
                    size="sm"
                    className="px-3 py-1" // Clases de ejemplo para tu botón destructivo
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