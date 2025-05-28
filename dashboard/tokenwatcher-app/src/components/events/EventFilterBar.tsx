// dashboard/tokenwatcher-app/src/components/events/EventFilterBar.tsx
import React from 'react';
import Button from '@/components/ui/button';
import type { Watcher } from '@/lib/useWatchers';

export interface EventFilters {
  watcherId: string;
  tokenSymbol: string; // Este campo ahora se llenará desde el nuevo desplegable
  fromAddress: string;
  toAddress: string;
  minUsdValue: string;
  maxUsdValue: string;
  startDate: string;
  endDate: string;
}

interface EventFilterBarProps {
  filters: EventFilters;
  onFilterChange: (field: keyof EventFilters, value: string) => void;
  onApplyFilters: () => void;
  onClearFilters: () => void;
  isLoading: boolean;
  showActiveOnlyEvents: boolean;
  onToggleShowActiveOnly: () => void;
  userWatchers: Watcher[];
  distinctTokenSymbols: string[]; // <-- NUEVA PROP para la lista de símbolos
}

// Componente Input reutilizable (sin cambios)
const FilterInput: React.FC<{
  label: string;
  id: keyof EventFilters;
  value: string;
  onChange: (id: keyof EventFilters, value: string) => void;
  placeholder?: string;
  type?: string;
  className?: string;
}> = ({ label, id, value, onChange, placeholder = '', type = 'text', className = '' }) => (
  <div className={`flex flex-col ${className}`}>
    <label htmlFor={id} className="mb-1 text-sm font-medium text-gray-600 dark:text-gray-300">
      {label}
    </label>
    <input
      id={id}
      type={type}
      value={value}
      onChange={(e) => onChange(id, e.target.value)}
      placeholder={placeholder}
      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
    />
  </div>
);

export const EventFilterBar: React.FC<EventFilterBarProps> = ({
  filters,
  onFilterChange,
  onApplyFilters,
  onClearFilters,
  isLoading,
  showActiveOnlyEvents,
  onToggleShowActiveOnly,
  userWatchers,
  distinctTokenSymbols, // <-- Recibimos la lista de símbolos
}) => {
  return (
    <div className="p-4 mb-6 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
      <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        <div className="flex flex-col">
          <label htmlFor="watcherId" className="mb-1 text-sm font-medium text-gray-600 dark:text-gray-300">
            Watcher
          </label>
          <select
            id="watcherId"
            name="watcherId"
            value={filters.watcherId}
            onChange={(e) => onFilterChange('watcherId', e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          >
            <option value="">All Watchers</option>
            {userWatchers.map((watcher) => (
              <option key={watcher.id} value={watcher.id.toString()}>
                {watcher.name} (ID: {watcher.id})
              </option>
            ))}
          </select>
        </div>

        {/* --- CAMBIO A DESPLEGABLE PARA TOKEN SYMBOL --- */}
        <div className="flex flex-col">
          <label htmlFor="tokenSymbol" className="mb-1 text-sm font-medium text-gray-600 dark:text-gray-300">
            Token Symbol
          </label>
          <select
            id="tokenSymbol"
            name="tokenSymbol"
            value={filters.tokenSymbol}
            onChange={(e) => onFilterChange('tokenSymbol', e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          >
            <option value="">All Tokens</option>
            {distinctTokenSymbols.map((symbol) => (
              <option key={symbol} value={symbol}>
                {symbol}
              </option>
            ))}
          </select>
        </div>
        {/* --- FIN CAMBIO A DESPLEGABLE --- */}

        <FilterInput
          label="From Address"
          id="fromAddress"
          value={filters.fromAddress}
          onChange={onFilterChange}
          placeholder="0x..."
        />
        <FilterInput
          label="To Address"
          id="toAddress"
          value={filters.toAddress}
          onChange={onFilterChange}
          placeholder="0x..."
        />
        <FilterInput
          label="Min. USD Value"
          id="minUsdValue"
          value={filters.minUsdValue}
          onChange={onFilterChange}
          placeholder="e.g., 1000"
          type="number"
        />
        <FilterInput
          label="Max. USD Value"
          id="maxUsdValue"
          value={filters.maxUsdValue}
          onChange={onFilterChange}
          placeholder="e.g., 50000"
          type="number"
        />
         <FilterInput
          label="Start Date"
          id="startDate"
          value={filters.startDate}
          onChange={onFilterChange}
          type="date"
        />
        <FilterInput
          label="End Date"
          id="endDate"
          value={filters.endDate}
          onChange={onFilterChange}
          type="date"
        />
      </div>

      <div className="flex flex-wrap items-center justify-end mt-6 pt-4 border-t border-gray-200 dark:border-gray-600 gap-2">
        {/* ... (botones sin cambios) ... */}
        <Button
            intent="secondary"
            onClick={onToggleShowActiveOnly}
            disabled={isLoading}
            size="md"
            className="order-first md:order-none"
        >
            {showActiveOnlyEvents ? "Show All Events" : "Show Active Only"}
        </Button>
        <div className="flex-grow md:flex-grow-0"></div>
        <Button
            intent="secondary"
            onClick={onClearFilters}
            disabled={isLoading}
            size="md"
        >
            Clear Filters
        </Button>
        <Button
            intent="default"
            onClick={onApplyFilters}
            disabled={isLoading}
            size="md"
            className="bg-blue-600 hover:bg-blue-700 text-white"
        >
            {isLoading ? 'Applying...' : 'Apply Filters'}
        </Button>
      </div>
    </div>
  );
};