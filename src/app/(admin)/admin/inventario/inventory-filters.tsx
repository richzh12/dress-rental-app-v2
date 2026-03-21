"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type InventoryFiltersProps = {
  initialModel: string;
  initialSize: string;
  initialColor: string;
};

export default function InventoryFilters({
  initialModel,
  initialSize,
  initialColor,
}: InventoryFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [model, setModel] = useState(initialModel);
  const [size, setSize] = useState(initialSize);
  const [color, setColor] = useState(initialColor);
  const [showMobileFilters, setShowMobileFilters] = useState(
    Boolean(initialModel || initialSize || initialColor)
  );

  const currentQuery = useMemo(() => searchParams.toString(), [searchParams]);

  useEffect(() => {
    const handle = setTimeout(() => {
      const params = new URLSearchParams(currentQuery);

      // Clear one-time banners while filtering.
      params.delete("created");
      params.delete("deactivated");

      if (model.trim()) {
        params.set("model", model.trim());
      } else {
        params.delete("model");
      }

      if (size.trim()) {
        params.set("size", size.trim());
      } else {
        params.delete("size");
      }

      if (color.trim()) {
        params.set("color", color.trim());
      } else {
        params.delete("color");
      }

      const nextQuery = params.toString();
      if (nextQuery === currentQuery) {
        return;
      }

      router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, {
        scroll: false,
      });
    }, 280);

    return () => clearTimeout(handle);
  }, [model, size, color, router, pathname, currentQuery]);

  return (
    <div className="mt-3 space-y-3">
      <button
        type="button"
        onClick={() => setShowMobileFilters((prev) => !prev)}
        className="atelier-btn-soft w-full px-3 py-2 text-sm md:hidden"
      >
        {showMobileFilters ? "Ocultar filtros" : "Filtrar"}
      </button>

      <div className={`${showMobileFilters ? "grid" : "hidden"} gap-3 md:grid md:grid-cols-4`}>
        <input
          name="model"
          value={model}
          onChange={(event) => setModel(event.target.value)}
          placeholder="Modelo"
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
        />
        <input
          name="size"
          value={size}
          onChange={(event) => setSize(event.target.value)}
          placeholder="Talla"
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
        />
        <input
          name="color"
          value={color}
          onChange={(event) => setColor(event.target.value)}
          placeholder="Color"
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
        />
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              setModel("");
              setSize("");
              setColor("");
            }}
            className="atelier-btn-soft w-full px-3 py-2 text-center text-sm"
          >
            Limpiar
          </button>
        </div>
      </div>
    </div>
  );
}
