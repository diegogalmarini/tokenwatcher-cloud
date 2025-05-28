// dashboard/tokenwatcher-app/src/components/events/EventFilterBar.tsx
import React from 'react';
import Button from '@/components/ui/button'; // Importamos nuestro Button

// Actualizamos la interfaz para incluir los nuevos filtros
export interface EventFilters {
  watcherName: string; // Nuevo: Para filtrar por nombre de Watcher (placeholder por ahora)
  tokenSymbol: string; // Nuevo: Para filtrar por símbolo de Token (placeholder por ahora)
  fromAddress: string;
  toAddress: string;
  minUsdValue: string;
  maxUsdValue: string; // Nuevo: Max USD Value
  startDate: string;
  endDate: string;
}

interface EventFilterBarProps {
  filters: EventFilters;
  onFilterChange: (field: keyof EventFilters, value: string) => void;
  onApplyFilters: () => void;
  onClearFilters: () => void;
  isLoading: boolean;
  showActiveOnlyEvents: boolean; // Nuevo: para el texto del botón y la lógica
  onToggleShowActiveOnly: () => void; // Nuevo: manejador para el botón
}

// Componente Input reutilizable (sin cambios, solo lo usamos más veces)
const FilterInput: React.FC<{
  label: string;
  id: keyof EventFilters; // Ahora se refiere a la nueva interfaz EventFilters
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
}) => {
  return (
    <div className="p-4 mb-6 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
      {/* Aumentamos el número de columnas para acomodar más filtros */}
      <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        <FilterInput
          label="Watcher Name" // Placeholder para futuro dropdown
          id="watcherName"
          value={filters.watcherName}
          onChange={onFilterChange}
          placeholder="Enter Watcher Name..."
        />
        <FilterInput
          label="Token Symbol" // Placeholder para futuro dropdown/autocomplete
          id="tokenSymbol"
          value={filters.tokenSymbol}
          onChange={onFilterChange}
          placeholder="E.g., WETH, DAI"
        />
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
          label="Max. USD Value" // Nuevo campo
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

      {/* Botones de acción agrupados */}
      <div className="flex flex-wrap items-center justify-end mt-6 pt-4 border-t border-gray-200 dark:border-gray-600 gap-2">
        <Button
            intent="secondary" // Usamos nuestro intent secundario
            onClick={onToggleShowActiveOnly}
            disabled={isLoading}
            size="md"
            className="order-first md:order-none" // Para que en móviles aparezca primero si se apilan
        >
            {showActiveOnlyEvents ? "Show All Events" : "Show Active Only"}
        </Button>
        <div className="flex-grow md:flex-grow-0"></div> {/* Espaciador para empujar los siguientes botones a la derecha en pantallas grandes */}
        <Button
            intent="secondary" // Usamos nuestro intent secundario
            onClick={onClearFilters}
            disabled={isLoading}
            size="md"
        >
            Clear Filters
        </Button>
        <Button
            intent="default" // Botón primario
            onClick={onApplyFilters}
            disabled={isLoading}
            size="md"
            className="bg-blue-600 hover:bg-blue-700 text-white" // Asegurando el estilo primario
        >
            {isLoading ? 'Applying...' : 'Apply Filters'}
        </Button>
      </div>
    </div>
  );
};