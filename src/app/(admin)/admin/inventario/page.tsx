import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getDressImageUrl } from "@/lib/dress-image";
import LightboxImage from "@/components/lightbox-image";
import NewDressModal from "./new-dress-modal";
import InventoryFilters from "@/app/(admin)/admin/inventario/inventory-filters";

type InventorySearchParams = Promise<{
  model?: string;
  size?: string;
  color?: string;
  created?: string;
  deleted?: string;
}>;

type UnitStatus = "AVAILABLE" | "RESERVED" | "RENTED" | "MAINTENANCE" | "LAUNDRY" | "RETIRED";

type InventoryDressCard = {
  id: string;
  modelName: string;
  size: string;
  color: string;
  rentalPriceCents: number;
  salePriceCents: number | null;
  imageUrl: string | null;
  _count: {
    units: number;
  };
  units: Array<{ status: UnitStatus }>;
};

function getCardStatus(units: Array<{ status: UnitStatus }>) {
  if (units.length === 0) {
    return { label: "SIN UNIDADES", className: "bg-[#efe7db] text-[#8b7c67]" };
  }

  const statuses = units.map((unit) => unit.status);

  if (statuses.every((status) => status === "RETIRED")) {
    return { label: "RETIRADO", className: "bg-[#ece5d9] text-[#8e7f68]" };
  }

  if (statuses.includes("RENTED")) {
    return { label: "ALQUILADO", className: "bg-[#dbe7ff] text-[#3e64bd]" };
  }

  if (statuses.includes("RESERVED")) {
    return { label: "RESERVADO", className: "bg-[#f8edc7] text-[#9d7413]" };
  }

  if (statuses.includes("MAINTENANCE") || statuses.includes("LAUNDRY")) {
    return { label: "MANTENIMIENTO", className: "bg-[#f9dddd] text-[#ba5151]" };
  }

  return { label: "DISPONIBLE", className: "bg-[#dbf3e4] text-[#2f8d5d]" };
}

function toMoney(cents: number | null) {
  if (cents === null) {
    return "-";
  }
  return `$${(cents / 100).toLocaleString("es-CO", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default async function InventarioPage({
  searchParams,
}: {
  searchParams: InventorySearchParams;
}) {
  const params = await searchParams;

  const model = params.model?.trim() ?? "";
  const size = params.size?.trim() ?? "";
  const color = params.color?.trim() ?? "";

  const dresses = await prisma.dress.findMany({
    where: {
      modelName: model
        ? {
            contains: model,
            mode: "insensitive",
          }
        : undefined,
      size: size
        ? {
            equals: size.toUpperCase(),
            mode: "insensitive",
          }
        : undefined,
      color: color
        ? {
            contains: color,
            mode: "insensitive",
          }
        : undefined,
      isActive: true,
    },
    include: {
      _count: {
        select: {
          units: true,
        },
      },
      units: {
        where: { isActive: true },
        select: { status: true },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <main className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="atelier-heading-kicker">Vestidos</p>
          <h1 className="atelier-title text-6xl leading-none">Inventario</h1>
          <p className="mt-2 text-sm text-[#8f7f65]">
            Gestiona modelos, precios y estado de catalogo. Total: {dresses.length}
          </p>
        </div>
        <NewDressModal />
      </div>

      {params.created === "1" ? (
        <p className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          Vestido creado correctamente.
        </p>
      ) : null}
      {params.deleted === "1" ? (
        <p className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
          Vestido eliminado correctamente.
        </p>
      ) : null}

      <section className="atelier-card p-4">
        <h2 className="atelier-heading-kicker">Filtros</h2>
        <InventoryFilters initialModel={model} initialSize={size} initialColor={color} />
      </section>

      {dresses.length === 0 ? (
        <section className="atelier-card p-6 text-center text-[#8f7f65]">
          No hay vestidos para los filtros actuales.
        </section>
      ) : (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {dresses.map((dress: InventoryDressCard) => {
            const status = getCardStatus(dress.units as Array<{ status: UnitStatus }>);
            const dressImageUrl = getDressImageUrl(dress.imageUrl, dress.id);

            return (
              <article key={dress.id} className="atelier-card overflow-hidden">
                <div className="relative flex h-52 items-center justify-center border-b border-[#ebdfce] bg-[#f6f0e5]">
                  <span className={`atelier-badge absolute right-3 top-3 ${status.className}`}>
                    {status.label}
                  </span>
                  <LightboxImage
                    src={dressImageUrl}
                    alt={`Foto de ${dress.modelName}`}
                    wrapperClassName="block h-full w-full"
                    thumbClassName="h-full w-full object-cover"
                  />
                </div>

                <div className="p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#b2a184]">
                    {dress._count.units} unidades
                  </p>
                  <h3 className="mt-1 text-4xl leading-none text-[#3e3328]">{dress.modelName}</h3>

                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                    <span className="rounded-full bg-[#f0e7d9] px-2 py-1 font-semibold text-[#9a896f]">
                      {dress.size}
                    </span>
                    <span className="rounded-full bg-[#f0e7d9] px-2 py-1 font-semibold text-[#9a896f]">
                      {dress.color}
                    </span>
                  </div>

                  <div className="mt-4 flex items-end justify-between">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.16em] text-[#b1a183]">Alquiler</p>
                      <p className="text-xl font-semibold text-[#a77d10]">{toMoney(dress.rentalPriceCents)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[11px] uppercase tracking-[0.16em] text-[#b1a183]">Venta</p>
                      <p className="text-base font-semibold text-[#7f6f58]">{toMoney(dress.salePriceCents)}</p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <Link href={`/admin/inventario/${dress.id}`} className="atelier-btn-primary block px-2 py-2 text-center text-xs">
                      Ver / Editar
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </main>
  );
}
