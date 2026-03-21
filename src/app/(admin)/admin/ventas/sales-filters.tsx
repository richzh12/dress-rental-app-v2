"use client";

import { useState } from "react";

interface SalesFiltersProps {
  statusFilter: string;
  methodFilter: string;
  fromFilter: string;
  toFilter: string;
}

export default function SalesFilters({
  statusFilter,
  methodFilter,
  fromFilter,
  toFilter,
}: SalesFiltersProps) {
  const [showMobileFilters, setShowMobileFilters] = useState(
    Boolean(statusFilter || methodFilter || fromFilter || toFilter)
  );

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => setShowMobileFilters((prev) => !prev)}
        className="atelier-btn-soft w-full px-3 py-2 text-sm md:hidden"
      >
        {showMobileFilters ? "Ocultar filtros" : "Filtrar"}
      </button>

      <form
        className={`${showMobileFilters ? "grid" : "hidden"} gap-3 md:grid md:grid-cols-4`}
        method="get"
      >
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Estado</label>
          <select
            name="status"
            defaultValue={statusFilter}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos</option>
            <option value="PENDING">Pendiente</option>
            <option value="COMPLETED">Completada</option>
            <option value="CANCELLED">Cancelada</option>
            <option value="REFUNDED">Reembolsada</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Metodo pago</label>
          <select
            name="method"
            defaultValue={methodFilter}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos</option>
            <option value="CASH">Efectivo</option>
            <option value="CARD">Tarjeta</option>
            <option value="TRANSFER">Transferencia</option>
            <option value="OTHER">Otro</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Desde</label>
          <input
            type="date"
            name="from"
            defaultValue={fromFilter}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Hasta</label>
          <input
            type="date"
            name="to"
            defaultValue={toFilter}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="md:col-span-4 flex gap-2">
          <button type="submit" className="atelier-btn-primary px-4 py-2 text-sm font-medium">
            Aplicar filtros
          </button>
          <a href="/admin/ventas" className="atelier-btn-soft px-4 py-2 text-sm font-medium">
            Limpiar
          </a>
        </div>
      </form>
    </div>
  );
}
