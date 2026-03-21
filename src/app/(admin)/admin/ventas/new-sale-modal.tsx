"use client";

import { useEffect, useState } from "react";
import { createSaleAction } from "./actions";
import LightboxImage from "@/components/lightbox-image";

interface CustomerOption {
  id: string;
  firstName: string;
  lastName: string;
}

interface UnitOption {
  id: string;
  inventoryCode: string;
  dress: {
    modelName: string;
    brand: string | null;
    color: string;
    size: string;
    salePriceCents: number | null;
    imageUrl: string;
  };
}

interface NewSaleModalProps {
  customers: CustomerOption[];
  availableUnitsForSale: UnitOption[];
}

function formatPrice(cents: number) {
  return `$${(cents / 100).toLocaleString("es-CO", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function NewSaleModal({ customers, availableUnitsForSale }: NewSaleModalProps) {
  const [open, setOpen] = useState(false);
  const [unitSearch, setUnitSearch] = useState("");
  const [selectedUnitId, setSelectedUnitId] = useState("");
  const disabled = availableUnitsForSale.length === 0;

  const normalizedSearch = unitSearch.trim().toLowerCase();
  const filteredUnits = normalizedSearch
    ? availableUnitsForSale.filter((unit) => {
        const searchableText = [
          unit.dress.brand ?? "",
          unit.dress.modelName,
          unit.dress.color,
          unit.dress.size,
          unit.inventoryCode,
        ]
          .join(" ")
          .toLowerCase();

        return searchableText.includes(normalizedSearch);
      })
    : availableUnitsForSale;

  useEffect(() => {
    if (!selectedUnitId) return;
    const stillVisible = filteredUnits.some((unit) => unit.id === selectedUnitId);
    if (!stillVisible) {
      setSelectedUnitId("");
    }
  }, [filteredUnits, selectedUnitId]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={disabled}
        className="atelier-btn-primary px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
      >
        + Nueva venta
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="atelier-card max-h-[90vh] w-full max-w-3xl overflow-y-auto p-5 md:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="atelier-heading-kicker">Comercial</p>
                <h2 className="atelier-title text-4xl leading-none">Registrar venta</h2>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Cerrar modal"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#d9c8ae] bg-[#f8f1e4] text-lg font-semibold leading-none text-[#8c7550] transition hover:bg-[#f1e7d6]"
              >
                X
              </button>
            </div>

            {disabled ? (
              <p className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
                No hay prendas disponibles para venta con precio configurado.
              </p>
            ) : (
              <form action={createSaleAction} className="mt-4 grid gap-4 md:grid-cols-2">
                <input type="hidden" name="dressUnitId" value={selectedUnitId} />

                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-gray-700">Buscar prenda</label>
                  <input
                    type="text"
                    value={unitSearch}
                    onChange={(e) => setUnitSearch(e.target.value)}
                    placeholder="Escribe modelo, marca, color, talla o codigo"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-gray-700">Prenda a vender</label>
                  <div className="grid max-h-64 grid-cols-1 gap-2 overflow-y-auto rounded-lg border border-[#eadfce] bg-[#fffdf9] p-2 sm:grid-cols-2">
                    {filteredUnits.map((unit) => {
                      const selected = selectedUnitId === unit.id;
                      return (
                        <div
                          role="button"
                          tabIndex={0}
                          key={unit.id}
                          aria-pressed={selected}
                          onClick={() => setSelectedUnitId(unit.id)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              setSelectedUnitId(unit.id);
                            }
                          }}
                          className={`rounded-lg border p-3 text-left transition ${
                            selected
                              ? "border-[#b78a1f] bg-[#f8edd8] ring-1 ring-[#b78a1f]"
                              : "border-[#eadfce] bg-white hover:bg-[#fbf7ef]"
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            <div className="h-14 w-12 shrink-0 overflow-hidden rounded-md border border-[#eadfce] bg-[#f6f0e5]">
                              <LightboxImage
                                src={unit.dress.imageUrl}
                                alt={`Foto de ${unit.dress.modelName}`}
                                wrapperClassName="block h-full w-full"
                                thumbClassName="h-full w-full object-cover"
                              />
                            </div>

                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-gray-900">
                                {unit.dress.brand ? `${unit.dress.brand} · ` : ""}
                                {unit.dress.modelName}
                              </p>
                              <p className="text-xs text-gray-600">
                                {unit.dress.color} - Talla {unit.dress.size}
                              </p>
                              <p className="text-xs text-gray-500">Cod: {unit.inventoryCode}</p>
                              <p className="mt-1 text-sm font-semibold text-[#7e632d]">
                                {formatPrice(unit.dress.salePriceCents ?? 0)}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {selectedUnitId ? (
                    <p className="mt-1 text-xs text-green-700">Prenda seleccionada.</p>
                  ) : (
                    <p className="mt-1 text-xs text-amber-700">Selecciona una prenda para continuar.</p>
                  )}
                  {filteredUnits.length === 0 ? (
                    <p className="mt-1 text-xs text-amber-700">
                      No hay prendas que coincidan con la busqueda.
                    </p>
                  ) : null}
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Cliente (opcional)</label>
                  <select
                    name="customerId"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Venta sin cliente registrado</option>
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.firstName} {customer.lastName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Metodo de pago</label>
                  <select
                    name="paymentMethod"
                    defaultValue="CASH"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="CASH">Efectivo</option>
                    <option value="CARD">Tarjeta</option>
                    <option value="TRANSFER">Transferencia</option>
                    <option value="OTHER">Otro</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-gray-700">Notas</label>
                  <textarea
                    name="notes"
                    rows={2}
                    placeholder="Observaciones de la venta"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="md:col-span-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="atelier-btn-soft px-4 py-2 text-sm"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={!selectedUnitId}
                    className="atelier-btn-primary px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Registrar venta
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
