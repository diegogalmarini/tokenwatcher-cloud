// File: dashboard/tokenwatcher-app/src/components/watchers/WatcherFormModal.tsx
"use client";

import React, { useState, useEffect, FormEvent, ReactNode } from "react";
import Button from "@/components/ui/button";
import { Watcher } from "@/lib/useWatchers";
import { useAuth } from "@/contexts/AuthContext";

// Interfaz para la info del token que recibimos de la API
interface TokenInfo {
  price: number;
  suggested_threshold: number;
  minimum_threshold: number;
}

export type WatcherFormData = {
  name: string;
  token_address: string;
  threshold: number;
  webhook_url: string;
};

type InitialModalData = Partial<
  Omit<Watcher, "id" | "owner_id" | "created_at" | "updated_at">
> & { id?: number };

type Props = {
  isOpen: boolean;
  initialData?: InitialModalData | null;
  onClose: () => void;
  onSave: (data: WatcherFormData & { is_active?: boolean }) => Promise<void>;
};

export default function WatcherFormModal({
  isOpen,
  initialData,
  onClose,
  onSave,
}: Props) {
  const { token } = useAuth();
  const [name, setName] = useState("");
  const [tokenAddress, setTokenAddress] = useState("");
  const [threshold, setThreshold] = useState<number | string>("");
  const [webhookUrl, setWebhookUrl] = useState<string>("");
  const [error, setError] = useState<ReactNode | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isFetchingInfo, setIsFetchingInfo] = useState(false);
  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setTokenInfo(null);
      setIsSaving(false);
      setIsFetchingInfo(false);
      
      if (initialData) {
        setName(initialData.name || "");
        setTokenAddress(initialData.token_address || "");
        setThreshold(initialData.threshold ?? "");
        setWebhookUrl(initialData.webhook_url || "");
      } else {
        setName("");
        setTokenAddress("");
        setThreshold("");
        setWebhookUrl("");
      }
    }
  }, [initialData, isOpen]);

  const handleTokenAddressBlur = async () => {
    if (!/^0x[a-fA-F0-9]{40}$/.test(tokenAddress) || !token) {
      setTokenInfo(null);
      return;
    }
    
    setIsFetchingInfo(true);
    setTokenInfo(null);
    setError(null);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tokens/info/${tokenAddress}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.detail || "Could not fetch token info. Please check the address.");
      }
      const data: TokenInfo = await response.json();
      setTokenInfo(data);
      if (!initialData?.id) { // Solo auto-rellenar en la creación
        setThreshold(data.suggested_threshold.toFixed(2));
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsFetchingInfo(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSaving(true);

    const currentThreshold = parseFloat(String(threshold));
    if (isNaN(currentThreshold) || currentThreshold < 0) {
      setError("Threshold must be a non-negative number.");
      setIsSaving(false);
      return;
    }

    if (!initialData?.id && (!webhookUrl.trim() || !isValidHttpUrl(webhookUrl.trim()))) {
      setError("A valid Webhook URL is required for new watchers.");
      setIsSaving(false);
      return;
    }

    try {
      await onSave({
        name: name.trim(),
        token_address: tokenAddress.trim(),
        threshold: currentThreshold,
        webhook_url: webhookUrl.trim(),
      });
      onClose();
    } catch (err: unknown) {
      console.error("Error in WatcherFormModal handleSubmit:", err);
      if (err instanceof Error) {
        if (err.message.includes("Watcher limit reached")) {
          const feedbackFormUrl = 'https://forms.gle/GyuMXTX88PN1gppS8';
          const errorMessage = (
            <span>
              {err.message} To request more, please{' '}
              <a href={feedbackFormUrl} target="_blank" rel="noopener noreferrer" className="font-bold underline hover:text-blue-400">
                fill out our feedback form
              </a>.
            </span>
          );
          setError(errorMessage);
        } else {
          setError(err.message);
        }
      } else {
        setError("An unexpected error occurred.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const isValidHttpUrl = (stringToValidate: string) => {
    try {
      const url = new URL(stringToValidate);
      return url.protocol === "http:" || url.protocol === "https:";
    } catch {
      return false;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0000009c] px-4 py-8 overflow-y-auto" onClick={onClose}>
      <div className="relative bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md shadow-xl m-4" onClick={(e) => e.stopPropagation()}>
        <button type="button" onClick={onClose} disabled={isSaving} className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-100 disabled:opacity-50" aria-label="Close modal">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-gray-100">{initialData?.id ? "Edit Watcher" : "Create New Watcher"}</h2>
        {error && (
          <div className="mb-4 text-sm text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900 p-3 rounded-md">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="watcher-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Watcher Name</label>
            <input id="watcher-name" type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400" placeholder="E.g., My DAI Watcher" required />
          </div>
          <div>
            <label htmlFor="token-address" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Token Address</label>
            <input id="token-address" type="text" value={tokenAddress} onChange={(e) => setTokenAddress(e.target.value)} onBlur={handleTokenAddressBlur} className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400" placeholder="0x..." required disabled={!!initialData?.id || isFetchingInfo}/>
          </div>
          {isFetchingInfo && <p className="text-sm text-gray-500 dark:text-gray-400 animate-pulse">Fetching token info...</p>}
          {tokenInfo && (
            <div className="text-xs p-3 bg-blue-50 dark:bg-blue-900/30 rounded-md border border-blue-200 dark:border-blue-800">
              <p><strong>Current Price:</strong> ${tokenInfo.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 8 })}</p>
              <p><strong>Suggested Threshold:</strong> ${tokenInfo.suggested_threshold.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              <p className="text-gray-500 dark:text-gray-400 mt-1">Minimum allowed: ${tokenInfo.minimum_threshold.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
          )}
          <div>
            <label htmlFor="threshold" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Threshold in USD</label>
            <input id="threshold" type="number" value={threshold} onChange={(e) => setThreshold(e.target.value)} className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400" min={0} step="any" required />
          </div>
          <div>
            <label htmlFor="webhook-url" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Webhook URL (Discord or Slack)</label>
            <input id="webhook-url" type="url" value={webhookUrl} onChange={(e) => setWebhookUrl(e.target.value)} className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400" placeholder="https://hooks.slack.com/... or https://discord.com/api/webhooks/..." required={!initialData?.id} />
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" intent="default" className="bg-gray-200 hover:bg-gray-300 text-gray-700 dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-gray-200" onClick={onClose} size="md" disabled={isSaving}>Cancel</Button>
            <Button type="submit" intent="default" size="md" className="bg-blue-600 hover:bg-blue-700 text-white" disabled={isSaving}>
              {isSaving ? 'Saving...' : (initialData?.id ? "Save Changes" : "Create Watcher")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}