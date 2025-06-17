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

// El tipo de datos del formulario ahora incluye 'telegram'
export type WatcherFormData = {
  name: string;
  token_address: string;
  threshold: number;
  transport_type: 'discord' | 'slack' | 'email' | 'telegram';
  transport_target: string;
};

type InitialModalData = Partial<Watcher> & { id?: number };

type Props = {
  isOpen: boolean;
  initialData?: InitialModalData | null;
  onClose: () => void;
  onSave: (data: WatcherFormData) => Promise<void>;
};

export default function WatcherFormModal({
  isOpen,
  initialData,
  onClose,
  onSave,
}: Props) {
  const { token } = useAuth();
  
  // --- ESTADOS PARA EL FORMULARIO DINÁMICO ---
  const [name, setName] = useState("");
  const [tokenAddress, setTokenAddress] = useState("");
  const [threshold, setThreshold] = useState<number | string>("");
  const [transportType, setTransportType] = useState<'webhook' | 'email' | 'telegram'>('webhook');
  
  // Estados para los diferentes tipos de destino
  const [webhookUrl, setWebhookUrl] = useState("");
  const [emailAddress, setEmailAddress] = useState("");
  const [telegramBotToken, setTelegramBotToken] = useState("");
  const [telegramChatId, setTelegramChatId] = useState("");
  
  const [error, setError] = useState<ReactNode | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isFetchingInfo, setIsFetchingInfo] = useState(false);
  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Resetear estados al abrir el modal
      setError(null); setTokenInfo(null); setIsSaving(false); setIsFetchingInfo(false);
      
      if (initialData?.id && Array.isArray(initialData.transports) && initialData.transports.length > 0) {
        // Rellenar formulario para editar un watcher existente
        const firstTransport = initialData.transports[0];
        setName(initialData.name || "");
        setTokenAddress(initialData.token_address || "");
        setThreshold(initialData.threshold ?? "");
        
        const type = firstTransport.type;
        if (type === 'email') {
          setTransportType('email');
          setEmailAddress(firstTransport.config.email || "");
        } else if (type === 'telegram') {
          setTransportType('telegram');
          setTelegramBotToken(firstTransport.config.bot_token || "");
          setTelegramChatId(firstTransport.config.chat_id || "");
        } else { // Asumimos que 'slack' o 'discord' son de tipo webhook
          setTransportType('webhook');
          setWebhookUrl(firstTransport.config.url || "");
        }
      } else {
        // Resetear para un nuevo watcher
        setName(""); setTokenAddress(""); setThreshold("");
        setTransportType('webhook'); setWebhookUrl("");
        setEmailAddress(""); setTelegramBotToken(""); setTelegramChatId("");
      }
    }
  }, [initialData, isOpen]);

  const handleTokenAddressBlur = async () => {
    if (!/^0x[a-fA-F0-9]{40}$/.test(tokenAddress) || !token) {
      setTokenInfo(null); return;
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
      if (!initialData?.id) {
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
      setIsSaving(false); return;
    }
    
    let payload: WatcherFormData;

    // --- LÓGICA DE VALIDACIÓN Y CONSTRUCCIÓN DE PAYLOAD ACTUALIZADA ---
    if (transportType === 'webhook') {
      if (!webhookUrl.trim() || !isValidHttpUrl(webhookUrl.trim())) {
        setError("A valid Webhook URL is required."); setIsSaving(false); return;
      }
      payload = { name: name.trim(), token_address: tokenAddress.trim(), threshold: currentThreshold, transport_type: 'discord', transport_target: webhookUrl.trim() };
    } else if (transportType === 'email') {
      if (!emailAddress.trim()) {
        setError("Email address is required."); setIsSaving(false); return;
      }
      payload = { name: name.trim(), token_address: tokenAddress.trim(), threshold: currentThreshold, transport_type: 'email', transport_target: emailAddress.trim() };
    } else if (transportType === 'telegram') {
      if (!telegramBotToken.trim() || !telegramChatId.trim()) {
        setError("Bot Token and Chat ID are required for Telegram."); setIsSaving(false); return;
      }
      const telegramConfig = { bot_token: telegramBotToken.trim(), chat_id: telegramChatId.trim() };
      payload = { name: name.trim(), token_address: tokenAddress.trim(), threshold: currentThreshold, transport_type: 'telegram', transport_target: JSON.stringify(telegramConfig) };
    } else {
        setError("Invalid transport type selected."); setIsSaving(false); return;
    }

    try {
      await onSave(payload);
      onClose();
    } catch (err: unknown) {
      console.error("Error in WatcherFormModal handleSubmit:", err);
      if (err instanceof Error) {
        if (err.message.includes("Watcher limit reached")) {
          const feedbackFormUrl = 'https://forms.gle/GyuMXTX88PN1gppS8';
          const errorMessage = (
            <span>{err.message} To request more, please{' '}
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
      <div className="relative bg-white dark:bg-[#404040] rounded-lg p-6 w-full max-w-md shadow-xl m-4" onClick={(e) => e.stopPropagation()}>
        <button type="button" onClick={onClose} disabled={isSaving} className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-100 disabled:opacity-50" aria-label="Close modal">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
        <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-gray-100">{initialData?.id ? "Edit Watcher" : "Create New Watcher"}</h2>
        {error && (<div className="mb-4 text-sm text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/50 p-3 rounded-md">{error}</div>)}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="watcher-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Watcher Name</label>
            <input id="watcher-name" type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-[#525252] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="E.g., My DAI Watcher" required />
          </div>
          <div>
            <label htmlFor="token-address" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Token Address</label>
            <input id="token-address" type="text" value={tokenAddress} onChange={(e) => setTokenAddress(e.target.value)} onBlur={handleTokenAddressBlur} className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-[#525252] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="0x..." required disabled={isSaving || isFetchingInfo || !!initialData?.id}/>
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
            <input id="threshold" type="number" value={threshold} onChange={(e) => setThreshold(e.target.value)} className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-[#525252] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500" min={0} step="any" required />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Notification Type</label>
            <div className="flex flex-wrap gap-x-4 gap-y-2 p-1">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input type="radio" name="transportType" value="webhook" checked={transportType === 'webhook'} onChange={() => setTransportType('webhook')} className="form-radio text-blue-600 focus:ring-blue-500 dark:bg-gray-700" />
                <span className="text-sm text-gray-800 dark:text-gray-200">Webhook</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input type="radio" name="transportType" value="email" checked={transportType === 'email'} onChange={() => setTransportType('email')} className="form-radio text-blue-600 focus:ring-blue-500 dark:bg-gray-700" />
                <span className="text-sm text-gray-800 dark:text-gray-200">Email</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input type="radio" name="transportType" value="telegram" checked={transportType === 'telegram'} onChange={() => setTransportType('telegram')} className="form-radio text-blue-600 focus:ring-blue-500 dark:bg-gray-700" />
                <span className="text-sm text-gray-800 dark:text-gray-200">Telegram</span>
              </label>
            </div>
          </div>
          
          {transportType === 'webhook' && (
            <div>
              <label htmlFor="webhook-url" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Webhook URL</label>
              <input id="webhook-url" type="url" value={webhookUrl} onChange={(e) => setWebhookUrl(e.target.value)} className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-[#525252]" placeholder="https://discord.com/api/webhooks/..." required />
            </div>
          )}
          {transportType === 'email' && (
            <div>
              <label htmlFor="email-address" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email Address</label>
              <input id="email-address" type="email" value={emailAddress} onChange={(e) => setEmailAddress(e.target.value)} className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-[#525252]" placeholder="you@example.com" required />
            </div>
          )}
          {transportType === 'telegram' && (
            <div className="space-y-4">
              <div>
                <label htmlFor="bot-token" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Telegram Bot Token</label>
                <input id="bot-token" type="text" value={telegramBotToken} onChange={(e) => setTelegramBotToken(e.target.value)} className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-[#525252]" placeholder="123456:ABC-DEF1234..." required />
              </div>
              <div>
                <label htmlFor="chat-id" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Telegram Chat ID</label>
                <input id="chat-id" type="text" value={telegramChatId} onChange={(e) => setTelegramChatId(e.target.value)} className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-[#525252]" placeholder="-100123456789" required />
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" intent="secondary" onClick={onClose} size="md" disabled={isSaving}>Cancel</Button>
            <Button type="submit" intent="default" size="md" disabled={isSaving}>
              {isSaving ? 'Saving...' : (initialData?.id ? "Save Changes" : "Create Watcher")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}