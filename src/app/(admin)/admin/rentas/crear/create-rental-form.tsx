"use client";

import { useState, useEffect } from "react";
import { createRentalAction, getAvailableUnits } from "../actions";
import Link from "next/link";

interface DressUnit {
  id: string;
  inventoryCode: string;
  dress: {
    modelName: string;
    brand?: string;
    color: string;
    size: string;
    rentalPriceCents: number;
  };
}

interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email?: string | null;
}

interface CreateRentalFormProps {
  customers: Customer[];
}

export default function CreateRentalForm({ customers }: CreateRentalFormProps) {
  const [customerMode, setCustomerMode] = useState<"new" | "existing">("new");
  const [customerId, setCustomerId] = useState("");
  const [customerFirstName, setCustomerFirstName] = useState("");
  const [customerLastName, setCustomerLastName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerDocumentId, setCustomerDocumentId] = useState("");
  const [customerNotes, setCustomerNotes] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [notes, setNotes] = useState("");
  const [depositPaid, setDepositPaid] = useState(false);
  const [selectedUnits, setSelectedUnits] = useState<string[]>([]);
  const [availableUnits, setAvailableUnits] = useState<DressUnit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Fetch available units when dates change
  useEffect(() => {
    const fetchAvailableUnits = async () => {
      if (!startDate || !endDate) {
        setAvailableUnits([]);
        return;
      }

      try {
        setLoading(true);
        const units = await getAvailableUnits(startDate, endDate);
        const typedUnits = units as DressUnit[];
        setAvailableUnits(typedUnits);
        // Clear selected units if they're no longer available
        setSelectedUnits((prev) =>
          prev.filter((id) => typedUnits.some((u) => u.id === id))
        );
      } catch {
        setError("Error cargando prendas disponibles");
      } finally {
        setLoading(false);
      }
    };

    fetchAvailableUnits();
  }, [startDate, endDate]);

  const calculateRentalDays = () => {
    if (!startDate || !endDate) return 0;

    const start = new Date(`${startDate}T00:00:00`);
    const end = new Date(`${endDate}T00:00:00`);
    const days = Math.ceil(
      (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
    ) + 1;

    return Math.max(days, 1);
  };

  const calculateRentalBase = () => {
    const days = calculateRentalDays();
    if (days === 0) return 0;

    return selectedUnits.reduce((sum, unitId) => {
      const unit = availableUnits.find((u) => u.id === unitId);
      if (!unit) return sum;
      return sum + unit.dress.rentalPriceCents * days;
    }, 0);
  };

  const calculateItbms = () => {
    const days = calculateRentalDays();
    if (days === 0) return 0;

    return selectedUnits.reduce((sum, unitId) => {
      const unit = availableUnits.find((u) => u.id === unitId);
      if (!unit) return sum;
      const lineBaseCents = unit.dress.rentalPriceCents * days;
      return sum + Math.round(lineBaseCents * 0.07);
    }, 0);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    const hasValidCustomer =
      customerMode === "existing"
        ? Boolean(customerId)
        : Boolean(customerFirstName.trim() && customerLastName.trim());

    if (!hasValidCustomer || !startDate || !endDate || selectedUnits.length === 0) {
      setError("Por favor completa todos los campos requeridos");
      return;
    }

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append("customerMode", customerMode);
      formData.append("customerId", customerId);
      formData.append("customerFirstName", customerFirstName);
      formData.append("customerLastName", customerLastName);
      formData.append("customerEmail", customerEmail);
      formData.append("customerPhone", customerPhone);
      formData.append("customerDocumentId", customerDocumentId);
      formData.append("customerNotes", customerNotes);
      formData.append("startDate", startDate);
      formData.append("endDate", endDate);
      formData.append("notes", notes);
      formData.append("depositPaid", depositPaid ? "true" : "false");
      formData.append("unitIds", JSON.stringify(selectedUnits));

      await createRentalAction(formData);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al crear el alquiler"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const rentalBase = calculateRentalBase();
  const itbms = calculateItbms();
  const subtotal = rentalBase + itbms;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/admin/rentas"
          className="mb-4 inline-block font-medium text-[#a97d13] hover:text-[#8d680a]"
        >
          ← Volver a Alquileres
        </Link>
        <p className="atelier-heading-kicker">Reserva</p>
        <h1 className="atelier-title text-6xl leading-none">Nuevo Alquiler</h1>
        <p className="mt-2 text-sm text-[#8f7f65]">Crea un nuevo alquiler para un cliente</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer Selection */}
        <div className="atelier-card p-6 space-y-4">
          <h2 className="text-lg font-semibold">Cliente</h2>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setCustomerMode("new")}
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                customerMode === "new"
                  ? "bg-[#b78a1f] text-[#fff9ef]"
                  : "bg-[#f3ecde] text-[#8a7350] hover:bg-[#ebdfcb]"
              }`}
            >
              Cliente Nuevo
            </button>
            <button
              type="button"
              onClick={() => setCustomerMode("existing")}
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                customerMode === "existing"
                  ? "bg-[#b78a1f] text-[#fff9ef]"
                  : "bg-[#f3ecde] text-[#8a7350] hover:bg-[#ebdfcb]"
              }`}
            >
              Cliente Existente
            </button>
          </div>

          {customerMode === "existing" ? (
            <select
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Selecciona un cliente</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.firstName} {customer.lastName}
                  {customer.email && ` (${customer.email})`}
                </option>
              ))}
            </select>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre
                </label>
                <input
                  type="text"
                  value={customerFirstName}
                  onChange={(e) => setCustomerFirstName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nombre"
                  required={customerMode === "new"}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Apellido
                </label>
                <input
                  type="text"
                  value={customerLastName}
                  onChange={(e) => setCustomerLastName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Apellido"
                  required={customerMode === "new"}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email (opcional)
                </label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="correo@ejemplo.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Teléfono (opcional)
                </label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="3001234567"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Documento (opcional)
                </label>
                <input
                  type="text"
                  value={customerDocumentId}
                  onChange={(e) => setCustomerDocumentId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="CC / Pasaporte"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notas de cliente (opcional)
                </label>
                <textarea
                  value={customerNotes}
                  onChange={(e) => setCustomerNotes(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Preferencias o información relevante del cliente"
                  rows={2}
                />
              </div>
            </div>
          )}
        </div>

        {/* Dates Selection */}
        <div className="atelier-card p-6 space-y-4">
          <h2 className="text-lg font-semibold">Fechas</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha de inicio
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha de fin
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>
        </div>

        {/* Dress Units Selection */}
        {startDate && endDate && (
          <div className="atelier-card p-6 space-y-4">
            <h2 className="text-lg font-semibold">Prendas Disponibles</h2>
            {loading ? (
              <p className="text-gray-500">Cargando prendas disponibles...</p>
            ) : availableUnits.length === 0 ? (
              <p className="text-gray-500">
                No hay prendas disponibles para estas fechas
              </p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {availableUnits.map((unit) => (
                  <label
                    key={unit.id}
                    className="flex items-start gap-3 rounded-lg border border-[#eadfce] p-3 hover:bg-[#fbf7ef] cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedUnits.includes(unit.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedUnits([...selectedUnits, unit.id]);
                        } else {
                          setSelectedUnits(
                            selectedUnits.filter((id) => id !== unit.id)
                          );
                        }
                      }}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        {unit.dress.modelName}
                      </p>
                      <p className="text-sm text-gray-500">
                        {unit.dress.color} - Talla {unit.dress.size}
                      </p>
                      <p className="text-sm text-gray-500">
                        Código: {unit.inventoryCode}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">
                        ${(unit.dress.rentalPriceCents / 100).toLocaleString("es-CO")}
                      </p>
                      <p className="text-xs text-gray-500">por día</p>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Notes */}
        <div className="atelier-card p-6 space-y-4">
          <h2 className="text-lg font-semibold">Notas</h2>
          <div className="rounded-lg border border-[#eadfce] bg-[#fbf7ef] p-3">
            <p className="text-sm font-medium text-gray-800">Depósito</p>
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={() => setDepositPaid(true)}
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  depositPaid
                    ? "bg-[#b78a1f] text-[#fff9ef]"
                    : "bg-[#f3ecde] text-[#8a7350] hover:bg-[#ebdfcb]"
                }`}
              >
                Pagado
              </button>
              <button
                type="button"
                onClick={() => setDepositPaid(false)}
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  !depositPaid
                    ? "bg-[#b78a1f] text-[#fff9ef]"
                    : "bg-[#f3ecde] text-[#8a7350] hover:bg-[#ebdfcb]"
                }`}
              >
                No pagado
              </button>
            </div>
          </div>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notas adicionales sobre el alquiler..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
          />
        </div>

        {/* Summary */}
        {selectedUnits.length > 0 && (
          <div className="rounded-lg border border-[#eadabf] bg-[#faf3e4] p-6 space-y-3">
            <h2 className="text-lg font-semibold text-[#7e632d]">Resumen</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-700">Valor de alquiler:</span>
                <span className="font-medium">
                  ${(rentalBase / 100).toLocaleString("es-CO")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">ITBMS (7%):</span>
                <span className="font-medium">
                  ${(itbms / 100).toLocaleString("es-CO")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#7e632d] font-semibold">Subtotal:</span>
                <span className="font-semibold">
                  ${(subtotal / 100).toLocaleString("es-CO")}
                </span>
              </div>
              <div className="border-t border-[#e7d4b4] pt-2 flex justify-between">
                <span className="text-gray-700">Total por cobrar:</span>
                <span className="font-medium">
                  ${(subtotal / 100).toLocaleString("es-CO")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">Estado del depósito:</span>
                <span className="font-medium">{depositPaid ? "Pagado" : "No pagado"}</span>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
          <button
            type="submit"
            disabled={
              submitting ||
              (customerMode === "existing"
                ? !customerId
                : !customerFirstName.trim() || !customerLastName.trim()) ||
              !startDate ||
              !endDate ||
              selectedUnits.length === 0
            }
            className="atelier-btn-primary flex-1 px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {submitting ? "Creando..." : "Crear Alquiler"}
          </button>
          <Link
            href="/admin/rentas"
            className="atelier-btn-soft px-4 py-2 font-medium"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}
