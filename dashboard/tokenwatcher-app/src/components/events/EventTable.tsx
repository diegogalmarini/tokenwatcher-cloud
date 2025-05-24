// src/components/events/EventTable.tsx
"use client";

import React from "react";
import Image from "next/image";
import { Event } from "@/lib/useEvents";
import Button from "@components/ui/button"; // Importamos Button por si lo usamos para 'Copy'

interface Props {
  events: Event[];
}

const ETHERSCAN_BASE_URL = process.env.NEXT_PUBLIC_ETHERSCAN_URL || "https://etherscan.io";

export function EventTable({ events }: Props) {
  if (!events || events.length === 0) {
    return <p className="text-center text-gray-500 dark:text-gray-400 py-8">No events to display for the selected criteria.</p>;
  }

  const shortenAddress = (address: string) => {
      if (!address) return 'N/A';
      return `${address.slice(0, 6)}…${address.slice(-4)}`;
  }

  // --- NUEVA FUNCIÓN PARA COPIAR ---
  const handleCopy = (text: string, elementId: string) => {
    navigator.clipboard.writeText(text).then(() => {
      // Feedback visual simple (opcional pero útil)
      const el = document.getElementById(elementId);
      if (el) {
          const originalText = el.innerText;
          el.innerText = 'Copied!';
          setTimeout(() => {
              el.innerText = originalText;
          }, 1500); // Vuelve al texto original después de 1.5s
      }
    }).catch(err => {
      console.error('Failed to copy text: ', err);
      alert('Failed to copy. Please copy manually.');
    });
  };

  return (
    <div className="overflow-x-auto rounded-lg shadow border border-gray-200 dark:border-gray-700">
      <table className="min-w-full table-auto bg-white dark:bg-gray-800">
        <thead className="bg-gray-50 dark:bg-gray-700">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Event ID</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Watcher ID</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Token</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">From</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">To</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Amount</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Block</th> {/* <-- OK */}
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Transaction Hash</th> {/* <-- OK */}
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Detected At (UTC)</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {events.map((event, index) => { // Añadimos 'index' para IDs únicos
            const logoUrl = `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/${event.token_address_observed}/logo.png`;
            const txHashCopyId = `copy-tx-${event.id}-${index}`; // ID único para el feedback visual

            return (
              <tr key={event.id + '-' + index} className="hover:bg-gray-50 dark:hover:bg-gray-750"> {/* Key más robusta */}
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{event.id}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{event.watcher_id}</td>
                <td className="px-4 py-3 whitespace-nowrap">
                   <div className="flex items-center">
                       <div className="flex-shrink-0 h-8 w-8 mr-3 relative">
                           <Image src={logoUrl} width={32} height={32} alt="token logo" className="rounded-full bg-gray-200 dark:bg-gray-600 object-cover"
                               onError={(e) => {
                                   const target = e.target as HTMLImageElement;
                                   target.style.visibility = "hidden";
                                   const placeholder = target.nextElementSibling;
                                   if (placeholder) (placeholder as HTMLElement).style.display = 'flex';
                               }}/>
                           <div className="absolute inset-0 hidden h-8 w-8 rounded-full bg-gray-300 dark:bg-gray-500 items-center justify-center text-xs font-bold text-gray-600 dark:text-gray-200">?</div>
                       </div>
                       <a href={`${ETHERSCAN_BASE_URL}/token/${event.token_address_observed}`} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 dark:text-blue-400 hover:underline truncate" title={event.token_address_observed}>
                           {shortenAddress(event.token_address_observed)}
                       </a>
                   </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm max-w-[100px] truncate" title={event.from_address}>
                  <a href={`${ETHERSCAN_BASE_URL}/address/${event.from_address}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">
                    {shortenAddress(event.from_address)}
                  </a>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm max-w-[100px] truncate" title={event.to_address}>
                  <a href={`${ETHERSCAN_BASE_URL}/address/${event.to_address}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">
                    {shortenAddress(event.to_address)}
                  </a>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300 text-right">{event.amount.toFixed(4)}</td>
                {/* --- BLOCK AHORA ES UN ENLACE --- */}
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                  <a href={`${ETHERSCAN_BASE_URL}/block/${event.block_number}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">
                    {event.block_number}
                  </a>
                </td>
                {/* --- TX HASH AHORA TIENE BOTÓN DE COPIAR --- */}
                <td className="px-4 py-3 whitespace-nowrap text-sm max-w-[200px]"> {/* Aumentamos un poco el ancho */}
                    <div className="flex items-center space-x-2">
                        <a href={`${ETHERSCAN_BASE_URL}/tx/${event.transaction_hash}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline truncate" title={event.transaction_hash}>
                            {shortenAddress(event.transaction_hash)}
                        </a>
                        <button
                            id={txHashCopyId}
                            onClick={() => handleCopy(event.transaction_hash, txHashCopyId)}
                            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none transition-colors duration-150"
                            title="Copy Transaction Hash"
                        >
                           {/* Icono SVG de Copiar - Simple */}
                           <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                             <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 4h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                           </svg>
                        </button>
                    </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                  {new Date(event.created_at).toLocaleString('sv-SE', { timeZone: 'UTC' })}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}