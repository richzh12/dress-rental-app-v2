"use client";

import { useState } from "react";
import { createDressAction } from "./actions";

export default function NewDressModal() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="atelier-btn-primary px-4 py-2 text-sm"
      >
        + Nuevo vestido
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="atelier-card max-h-[90vh] w-full max-w-3xl overflow-y-auto p-5 md:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="atelier-heading-kicker">Vestidos</p>
                <h2 className="atelier-title text-4xl leading-none">Nuevo vestido</h2>
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

            <form action={createDressAction} className="mt-4 grid gap-3 md:grid-cols-2">
              <input
                name="modelName"
                required
                placeholder="Modelo"
                className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
              />
              <input
                name="brand"
                placeholder="Marca (opcional)"
                className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
              />
              <input
                name="color"
                required
                placeholder="Color"
                className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
              />
              <input
                name="size"
                required
                placeholder="Talla"
                className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
              />
              <input
                name="rentalPrice"
                type="number"
                min="0"
                step="0.01"
                required
                placeholder="Precio alquiler ($)"
                className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
              />
              <input
                name="salePrice"
                type="number"
                min="0"
                step="0.01"
                placeholder="Precio venta ($, opcional)"
                className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
              />
              <textarea
                name="description"
                placeholder="Descripcion (opcional)"
                className="md:col-span-2 min-h-24 rounded-md border border-zinc-300 px-3 py-2 text-sm"
              />
              <div className="md:col-span-2 space-y-1">
                <label className="block text-sm font-medium text-[#6f5f49]">
                  Foto del vestido (opcional)
                </label>
                <input
                  name="image"
                  type="file"
                  accept="image/*"
                  className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-[#f2ebdd] file:px-3 file:py-1 file:text-sm file:font-semibold file:text-[#7a6847]"
                />
                <p className="text-xs text-[#8f7f65]">
                  Puedes seleccionar una imagen o tomar una foto desde el movil (maximo 8MB).
                </p>
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
                  className="atelier-btn-primary px-4 py-2 text-sm"
                >
                  Guardar vestido
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
