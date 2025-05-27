// dashboard/tokenwatcher-app/src/components/EventFilterBar.tsx
import React from 'react';

// Definimos la forma de los valores de los filtros
export interface EventFilters {
  tokenAddress: string;
  startDate: string; // Formato YYYY-MM-DD
  endDate: string;   // Formato YYYY-MM-DD
  fromAddress: string;
  toAddress: string;
  minUsdValue: string; // Lo manejamos como string en el input
}

// Definimos las props que recibirá el componente
interface EventFilterBarProps {
  filters: EventFilters;
  onFilterChange: (field: keyof EventFilters, value: string) => void;
  onApplyFilters: () => void;
  onClearFilters: () => void;
  isLoading: boolean; // Para deshabilitar botones mientras carga
}

// Componente Input reutilizable para mantener estilo consistente
const FilterInput: React.FC<{
  label: string;
  id: keyof EventFilters;
  value: string;
  onChange: (id: keyof EventFilters, value: string) => void;
  placeholder?: string;
  type?: string;
}> = ({ label, id, value, onChange, placeholder = '', type = 'text' }) => (
  <div className="flex flex-col">
    <label htmlFor={id} className="mb-1 text-sm font-medium text-gray-600">
      {label}
    </label>
    <input
      id={id}
      type={type}
      value={value}
      onChange={(e) => onChange(id, e.target.value)}
      placeholder={placeholder}
      className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white"
    />
  </div>
);

export const EventFilterBar: React.FC<EventFilterBarProps> = ({
  filters,
  onFilterChange,
  onApplyFilters,
  onClearFilters,
  isLoading,
}) => {
  return (
    <div className="p-4 mb-6 bg-gray-50 border border-gray-200 rounded-lg shadow-sm">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        {/* Fila 1 */}
        <FilterInput
          label="Token Address"
          id="tokenAddress"
          value={filters.tokenAddress}
          onChange={onFilterChange}
          placeholder="0x..."
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
          placeholder="1000"
          type="number"
        />
        {/* Fila 2 - Fechas */}
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
      {/* Botones */}
      <div className="flex justify-end mt-4 pt-4 border-t border-gray-200">
          <button
            onClick={onClearFilters}
            disabled={isLoading}
            className="px-4 py-2 mr-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Limpiar Filtros
          </button>
          <button
            onClick={onApplyFilters}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Aplicando...' : 'Aplicar Filtros'}
          </button>
        </div>
    </div>
  );
};