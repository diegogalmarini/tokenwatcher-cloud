"use client";

import React, { useState, useEffect, FormEvent } from 'react';
import Button from '@/components/ui/button';
import { Plan, PlanCreatePayload, PlanUpdatePayload } from '@/lib/usePlans';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: PlanCreatePayload | PlanUpdatePayload, id?: number) => Promise<void>;
  initialData?: Plan | null;
};

export default function PlanFormModal({ isOpen, onClose, onSave, initialData }: Props) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [watcherLimit, setWatcherLimit] = useState<number | string>('');
  const [priceMonthly, setPriceMonthly] = useState<number | string>('');
  const [priceAnnually, setPriceAnnually] = useState<number | string>('');
  const [stripePriceIdMonthly, setStripePriceIdMonthly] = useState('');
  const [stripePriceIdAnnually, setStripePriceIdAnnually] = useState('');
  const [isActive, setIsActive] = useState(true);
  
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setName(initialData.name || '');
        setDescription(initialData.description || '');
        setWatcherLimit(initialData.watcher_limit ?? '');
        setPriceMonthly(initialData.price_monthly / 100); // Convertir de centavos a dólares/euros
        setPriceAnnually(initialData.price_annually / 100);
        setStripePriceIdMonthly(initialData.stripe_price_id_monthly || '');
        setStripePriceIdAnnually(initialData.stripe_price_id_annually || '');
        setIsActive(initialData.is_active);
      } else {
        // Resetear para un nuevo plan
        setName('');
        setDescription('');
        setWatcherLimit('');
        setPriceMonthly('');
        setPriceAnnually('');
        setStripePriceIdMonthly('');
        setStripePriceIdAnnually('');
        setIsActive(true);
      }
      setError(null);
      setIsSaving(false);
    }
  }, [initialData, isOpen]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSaving(true);

    const payload = {
      name,
      description,
      watcher_limit: Number(watcherLimit),
      price_monthly: Math.round(Number(priceMonthly) * 100), // Convertir a centavos
      price_annually: Math.round(Number(priceAnnually) * 100),
      stripe_price_id_monthly: stripePriceIdMonthly,
      stripe_price_id_annually: stripePriceIdAnnually,
      is_active: isActive,
    };

    try {
      await onSave(payload, initialData?.id);
      onClose();
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0000009c] px-4">
      <div className="relative bg-white dark:bg-[#404040] rounded-lg p-6 w-full max-w-lg shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-gray-100">
          {initialData ? 'Edit Plan' : 'Create New Plan'}
        </h2>
        
        {error && <div className="mb-4 text-sm text-red-500 bg-red-100 dark:bg-red-900/50 p-3 rounded-md">{error}</div>}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="plan-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Plan Name</label>
              <input id="plan-name" type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full input-class" />
            </div>
            <div>
              <label htmlFor="watcher-limit" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Watcher Limit</label>
              <input id="watcher-limit" type="number" value={watcherLimit} onChange={(e) => setWatcherLimit(e.target.value)} required className="w-full input-class" />
            </div>
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
            <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full input-class" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="price-monthly" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Monthly Price ($)</label>
              <input id="price-monthly" type="number" value={priceMonthly} onChange={(e) => setPriceMonthly(e.target.value)} required min="0" step="0.01" className="w-full input-class" />
            </div>
            <div>
              <label htmlFor="price-annually" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Annual Price ($)</label>
              <input id="price-annually" type="number" value={priceAnnually} onChange={(e) => setPriceAnnually(e.target.value)} required min="0" step="0.01" className="w-full input-class" />
            </div>
          </div>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="stripe-monthly" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Stripe Price ID (Monthly)</label>
              <input id="stripe-monthly" type="text" value={stripePriceIdMonthly} onChange={(e) => setStripePriceIdMonthly(e.target.value)} className="w-full input-class" placeholder="price_..."/>
            </div>
            <div>
              <label htmlFor="stripe-annually" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Stripe Price ID (Annually)</label>
              <input id="stripe-annually" type="text" value={stripePriceIdAnnually} onChange={(e) => setStripePriceIdAnnually(e.target.value)} className="w-full input-class" placeholder="price_..."/>
            </div>
          </div>
          <div>
            <label className="flex items-center space-x-2 cursor-pointer">
                <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="form-checkbox h-4 w-4 rounded text-blue-600 focus:ring-blue-500" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Plan is Active</span>
            </label>
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" intent="secondary" onClick={onClose} disabled={isSaving}>Cancel</Button>
            <Button type="submit" intent="default" disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Plan'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}