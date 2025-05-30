// dashboard/tokenwatcher-app/src/components/watchers/WatcherFormModal.tsx
"use client";

import React, { useState, useEffect, FormEvent } from "react";
import Button from "@/components/ui/button";
import { Watcher } from "@/lib/useWatchers";

export type WatcherFormData = {
  name: string;
  token_address: string;
  threshold: number;
  webhook_url: string;
};

type InitialModalData = Partial<Omit<Watcher, 'id' | 'owner_id' | 'created_at' | 'updated_at'>> & {id?: number};

type Props = {
  isOpen: boolean;
  initialData?: InitialModalData | null;
  onClose: () => void;
  onSave: (data: WatcherFormData & {is_active?: boolean}) => Promise<void>;
};

export default function WatcherFormModal({
  isOpen,
  initialData,
  onClose,
  onSave,
}: Props) {
  const [name, setName] = useState("");
  const [tokenAddress, setTokenAddress] = useState("");
  const [threshold, setThreshold] = useState<number | string>("");
  const [webhookUrl, setWebhookUrl] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      if (initialData) {
        setName(initialData.name || "");
        setTokenAddress(initialData.token_address || "");
        setThreshold(initialData.threshold !== undefined ? initialData.threshold : "");
        setWebhookUrl(initialData.webhook_url || "");
      } else {
        setName("");
        setTokenAddress("");
        setThreshold("");
        setWebhookUrl("");
      }
    }
  }, [initialData, isOpen]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    const currentThreshold = parseFloat(String(threshold));
    if (isNaN(currentThreshold) || currentThreshold < 0) {
        setError("Threshold must be a non-negative number.");
        return;
    }

    if (!initialData?.id && (!webhookUrl.trim() || !isValidHttpUrl(webhookUrl.trim()))) {
      setError("A valid Webhook URL is required for new watchers.");
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
        setError(err.message);
      } else if (typeof err === 'string') {
        setError(err);
      } else {
        setError("An unexpected error occurred.");
      }
    }
  };

  const isValidHttpUrl = (stringToValidate: string) => {
    try {
      const url = new URL(stringToValidate);
      return url.protocol === "http:" || url.protocol === "https:";
    } catch { // <--- CORRECCIÓN AQUÍ: Se omite la variable del error
      return false;
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 px-4 py-8 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md shadow-xl m-4">
        <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-gray-100">
          {initialData?.id ? "Edit Watcher" : "Create New Watcher"}
        </h2>

        {error && <p className="mb-4 text-sm text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900 p-3 rounded-md">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="watcher-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Watcher Name
            </label>
            <input
              id="watcher-name" type="text" value={name} onChange={(e) => setName(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              placeholder="E.g., My DAI Watcher" required
            />
          </div>
          <div>
            <label htmlFor="token-address" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Token Address
            </label>
            <input
              id="token-address" type="text" value={tokenAddress} onChange={(e) => setTokenAddress(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              placeholder="0x..." required
            />
          </div>
          <div>
            <label htmlFor="threshold" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Threshold
            </label>
            <input
              id="threshold" type="number" value={threshold} onChange={(e) => setThreshold(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              min={0} step="any" required
            />
          </div>
          <div>
            <label htmlFor="webhook-url" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Webhook URL (Discord or Slack)
            </label>
            <input
              id="webhook-url" type="url" value={webhookUrl} onChange={(e) => setWebhookUrl(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              placeholder="https://hooks.slack.com/... or https://discord.com/api/webhooks/..."
              required={!initialData?.id}
            />
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" intent="default" className="bg-gray-200 hover:bg-gray-300 text-gray-700 dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-gray-200" onClick={onClose} size="md">
              Cancel
            </Button>
            <Button type="submit" intent="default" size="md" className="bg-blue-600 hover:bg-blue-700 text-white">
              {initialData?.id ? "Save Changes" : "Create Watcher"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}