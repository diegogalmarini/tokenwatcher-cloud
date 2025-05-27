// src/components/events/EventTable.tsx
"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Event } from "@/lib/useEvents";
import { formatDistanceToNow, parseISO } from 'date-fns';
// import { enUS } from 'date-fns/locale'; // Import English locale if needed for specific formatting
import type { SortOptions } from "@/app/page";
import { ArrowUp, ArrowDown } from 'lucide-react';

interface Props {
  events: Event[];
  sortOptions: SortOptions;
  onSortChange: (newSortBy: string) => void;
}

const ETHERSCAN_BASE_URL = process.env.NEXT_PUBLIC_ETHERSCAN_URL || "https://etherscan.io";

const SortableHeader: React.FC<{
    label: string;
    columnKey: string;
    currentSort: SortOptions;
    onSort: (key: string) => void;
    className?: string;
}> = ({ label, columnKey, currentSort, onSort, className = 'text-left' }) => {
    const isCurrent = currentSort.sortBy === columnKey;
    const Icon = currentSort.sortOrder === 'asc' ? ArrowUp : ArrowDown;

    return (
        <th
            className={`px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 ${className}`}
            onClick={() => onSort(columnKey)}
        >
            <div className={`flex items-center ${className === 'text-right' ? 'justify-end' : 'justify-start'}`}>
                <span>{label}</span>
                {isCurrent ? (
                    <Icon className="ml-1 h-3 w-3" />
                ) : (
                    // Optionally, show a faint default arrow or no arrow if not sorted
                    <ArrowDown className="ml-1 h-3 w-3 text-gray-300 dark:text-gray-500 opacity-50" />
                )}
            </div>
        </th>
    );
};


export function EventTable({ events, sortOptions, onSortChange }: Props) {
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  if (!events || events.length === 0) {
    return (
      <div className="text-center text-gray-500 dark:text-gray-400 py-8">
        <p>No events to display for the selected criteria.</p> {/* English */}
      </div>
    );
  }

  const shortenAddress = (address: string | null | undefined): string => {
    if (!address) return 'N/A';
    return `${address.slice(0, 6)}…${address.slice(-4)}`;
  };

  const shortenTokenName = (name: string | null | undefined, maxLength: number = 15): string => {
    if (!name) return '';
    if (name.length > maxLength) {
      return `${name.substring(0, maxLength)}…`;
    }
    return name;
  };

  const handleCopy = (text: string, elementId: string) => {
     navigator.clipboard.writeText(text).then(() => {
      const el = document.getElementById(elementId);
      if (el) {
        const originalContent = el.innerHTML;
        el.innerHTML = 'Copied!'; // English
        el.classList.add('text-green-500');
        setTimeout(() => {
          el.innerHTML = originalContent;
          el.classList.remove('text-green-500');
        }, 1500);
      }
    }).catch(err => {
      console.error('Failed to copy text: ', err);
      alert('Failed to copy. Please copy manually.'); // English
    });
  };

  const handleCopyLink = (txHash: string) => {
    const url = `${ETHERSCAN_BASE_URL}/tx/${txHash}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedLink(txHash);
      setTimeout(() => {
        setCopiedLink(null);
      }, 2000);
    }).catch(err => {
      console.error('Failed to copy link: ', err);
      alert('Failed to copy link. Please copy manually.'); // English
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
            <SortableHeader
                label="Amount / Value"
                columnKey="usd_value" // Or 'amount', based on what you prefer to sort by
                currentSort={sortOptions}
                onSort={onSortChange}
                className="text-right"
            />
            <SortableHeader
                label="Block"
                columnKey="block_number"
                currentSort={sortOptions}
                onSort={onSortChange}
            />
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Transaction Hash</th>
            <SortableHeader
                label="Detected At"
                columnKey="created_at"
                currentSort={sortOptions}
                onSort={onSortChange}
            />
            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {events.map((event, index) => {
            const logoUrl = `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/${event.token_address_observed}/logo.png`;
            const txHashCopyId = `copy-tx-${event.id}-${index}`;
            let timeAgo = "N/A";
            let fullDate = "N/A";

            if (event.created_at) {
              try {
                const date = parseISO(event.created_at);
                // For English "ago" suffix, formatDistanceToNow usually defaults to English
                // or you can pass { locale: enUS } from 'date-fns/locale'
                timeAgo = formatDistanceToNow(date, { addSuffix: true });
                fullDate = new Date(event.created_at).toLocaleString('en-US', { timeZone: 'UTC', dateStyle: 'medium', timeStyle: 'medium' }) + " UTC";
              } catch (e) {
                console.error("Error parsing date for event:", event.id, e);
                timeAgo = event.created_at;
                fullDate = event.created_at;
              }
            }
            const etherscanTxUrl = `${ETHERSCAN_BASE_URL}/tx/${event.transaction_hash}`;

            return (
              <tr key={`${event.id}-${event.transaction_hash}-${index}`} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{event.id}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{event.watcher_id}</td>
                <td className="px-4 py-3 whitespace-nowrap">
                   <div className="flex items-center">
                       <div className="flex-shrink-0 h-8 w-8 mr-2 relative">
                           <Image
                               src={logoUrl}
                               width={32}
                               height={32}
                               alt={event.token_symbol || event.token_name || "token logo"}
                               className="rounded-full bg-gray-200 dark:bg-gray-600 object-cover"
                               onError={(e) => {
                                   const target = e.target as HTMLImageElement;
                                   target.style.visibility = "hidden";
                                   const placeholder = target.nextElementSibling;
                                   if (placeholder) (placeholder as HTMLElement).style.display = 'flex';
                               }}
                           />
                           <div
                               className="absolute inset-0 hidden h-8 w-8 rounded-full bg-gray-300 dark:bg-gray-500 items-center justify-center text-xs font-bold text-gray-600 dark:text-gray-200"
                           >{event.token_symbol ? event.token_symbol.charAt(0).toUpperCase() : "?"}</div>
                       </div>
                       <div className="flex flex-col items-start">
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate max-w-[80px]" title={event.token_name || event.token_address_observed}>
                            {event.token_symbol || shortenAddress(event.token_address_observed)}
                          </span>
                          {event.token_name && event.token_symbol && (
                            <span className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[80px]" title={event.token_name}>
                                {shortenTokenName(event.token_name)}
                            </span>
                          )}
                       </div>
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
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300 text-right">
                  <div>{event.amount.toFixed(4)}</div>
                  {(event.usd_value !== null && event.usd_value !== undefined) && (
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      (≈ ${event.usd_value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                  <a href={`${ETHERSCAN_BASE_URL}/block/${event.block_number}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">
                    {event.block_number}
                  </a>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm max-w-[200px]">
                    <div className="flex items-center space-x-2 justify-start">
                        <a href={etherscanTxUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline truncate" title={event.transaction_hash}>
                            {shortenAddress(event.transaction_hash)}
                        </a>
                        <button
                            id={txHashCopyId}
                            onClick={() => handleCopy(event.transaction_hash, txHashCopyId)}
                            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none transition-colors duration-150 p-0.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                            title="Copy Transaction Hash"
                        >
                           <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                             <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 4h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                           </svg>
                        </button>
                    </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300" title={fullDate}>
                  {timeAgo} {/* formatDistanceToNow defaults to English if locale is not specified or if 'enUS' is default */}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-center space-x-2">
                  <a
                    href={etherscanTxUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline"
                    title="View transaction on Etherscan"
                  >
                    View {/* English */}
                  </a>
                  <button
                    onClick={() => handleCopyLink(event.transaction_hash)}
                    className={`text-xs px-2 py-1 rounded ${copiedLink === event.transaction_hash ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                    title="Copy Etherscan link to transaction"
                  >
                    {copiedLink === event.transaction_hash ? 'Copied!' : 'Copy Link'} {/* English */}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}