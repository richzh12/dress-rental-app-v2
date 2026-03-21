"use client";

import Link from "next/link";
import { useState } from "react";

interface RentalsFiltersProps {
  currentStatus: string;
}

const FILTERS = [
  { key: "all", label: "Todas" },
  { key: "RESERVED", label: "Reservado" },
  { key: "RENTED", label: "Rentado" },
  { key: "RETURNED", label: "Devuelto" },
  { key: "COMPLETED", label: "Completado" },
  { key: "CANCELLED", label: "Cancelado" },
] as const;

export default function RentalsFilters({ currentStatus }: RentalsFiltersProps) {
  const [showMobileFilters, setShowMobileFilters] = useState(currentStatus !== "all");

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => setShowMobileFilters((prev) => !prev)}
        className="atelier-btn-soft w-full px-3 py-2 text-sm md:hidden"
      >
        {showMobileFilters ? "Ocultar filtros" : "Filtrar"}
      </button>

      <div className={`${showMobileFilters ? "flex" : "hidden"} flex-wrap gap-2 md:flex`}>
        {FILTERS.map((filter) => (
          <Link
            key={filter.key}
            href={`/admin/rentas${filter.key === "all" ? "" : `?status=${filter.key}`}`}
            className={`rounded-full px-3 py-1 text-xs font-medium transition sm:text-sm ${
              currentStatus === filter.key
                ? "bg-[#b78a1f] text-[#fff9ef]"
                : "bg-[#f3ecde] text-[#8a7350] hover:bg-[#ebdfcb]"
            }`}
          >
            {filter.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
