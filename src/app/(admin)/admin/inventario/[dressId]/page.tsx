import Link from "next/link";
import { notFound } from "next/navigation";
import {
  createUnitAction,
  deactivateUnitAction,
  deactivateDressAction,
  updateDressAction,
  updateUnitStatusAction,
} from "./actions";
import { prisma } from "@/lib/prisma";
import { getDressImageUrl } from "@/lib/dress-image";
import LightboxImage from "@/components/lightbox-image";

type DressDetailPageProps = {
  params: Promise<{ dressId: string }>;
  searchParams: Promise<{
    updated?: string;
    unitCreated?: string;
    unitUpdated?: string;
    unitDeactivated?: string;
    unitCode?: string;
    showInactive?: string;
  }>;
};

const UNIT_STATUS_OPTIONS = [
  "AVAILABLE",
  "RESERVED",
  "RENTED",
  "MAINTENANCE",
  "LAUNDRY",
  "RETIRED",
] as const;

type UnitStatusOption = (typeof UNIT_STATUS_OPTIONS)[number];

type DressUnitRow = {
  id: string;
  inventoryCode: string;
  status: UnitStatusOption;
  conditionNotes: string | null;
};

function unitStatusBadgeClass(status: UnitStatusOption) {
  switch (status) {
    case "AVAILABLE":
      return "border-[#a9ddbe] bg-[#e7f7ee] text-[#2f8a5f]";
    case "RESERVED":
      return "border-[#ecd89b] bg-[#faf1d9] text-[#9d7413]";
    case "RENTED":
      return "border-[#bbcdf7] bg-[#e3ecff] text-[#365db8]";
    case "MAINTENANCE":
      return "border-[#f0c5ae] bg-[#fdf0e7] text-[#ba693e]";
    case "LAUNDRY":
      return "border-[#cdc4ef] bg-[#efeafd] text-[#63529d]";
    case "RETIRED":
      return "border-[#ddd2c0] bg-[#f4eee4] text-[#83725c]";
    default:
      return "border-[#ddd2c0] bg-[#f4eee4] text-[#83725c]";
  }
}

function toMoney(cents: number | null) {
  if (cents === null) {
    return "";
  }
  return (cents / 100).toFixed(2);
}

export default async function DressDetailPage({ params, searchParams }: DressDetailPageProps) {
  const { dressId } = await params;
  const query = await searchParams;
  const unitCode = query.unitCode?.trim() ?? "";
  const showInactive = query.showInactive === "1";

  const dress = await prisma.dress.findUnique({
    where: { id: dressId },
    include: {
      units: {
        where: {
          isActive: showInactive ? undefined : true,
          inventoryCode: unitCode
            ? {
                contains: unitCode,
                mode: "insensitive",
              }
            : undefined,
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!dress) {
    notFound();
  }

  const onUpdateDress = updateDressAction.bind(null, dressId);
  const onDeactivateDress = deactivateDressAction.bind(null, dressId);
  const onCreateUnit = createUnitAction.bind(null, dressId);
  const dressImageUrl = getDressImageUrl(dress.imageUrl, dress.id);

  return (
    <main className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="atelier-heading-kicker">Vestido</p>
          <h1 className="atelier-title text-6xl leading-none">Gestion</h1>
          <p className="mt-2 text-sm text-[#8f7f65]">Modelo: {dress.modelName}</p>
        </div>
        <Link
          href="/admin/inventario"
          className="atelier-btn-soft px-3 py-2 text-sm"
        >
          Volver al inventario
        </Link>
      </div>

      {query.updated === "1" ? (
        <p className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          Vestido actualizado correctamente.
        </p>
      ) : null}
      {query.unitCreated === "1" ? (
        <p className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          Unidad creada correctamente.
        </p>
      ) : null}
      {query.unitUpdated === "1" ? (
        <p className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          Unidad actualizada correctamente.
        </p>
      ) : null}
      {query.unitDeactivated === "1" ? (
        <p className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
          Unidad desactivada correctamente.
        </p>
      ) : null}

      <section className="atelier-card p-4">
        <h2 className="atelier-heading-kicker">Editar vestido</h2>
        <form action={onUpdateDress} className="mt-3 grid gap-3 md:grid-cols-2">
          <input
            name="modelName"
            required
            defaultValue={dress.modelName}
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
          />
          <input
            name="brand"
            defaultValue={dress.brand ?? ""}
            placeholder="Marca"
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
          />
          <input
            name="color"
            required
            defaultValue={dress.color}
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
          />
          <input
            name="size"
            required
            defaultValue={dress.size}
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
          />
          <input
            name="rentalPrice"
            type="number"
            min="0"
            step="0.01"
            required
            defaultValue={toMoney(dress.rentalPriceCents)}
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
          />
          <input
            name="salePrice"
            type="number"
            min="0"
            step="0.01"
            defaultValue={toMoney(dress.salePriceCents)}
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
          />
          <textarea
            name="description"
            defaultValue={dress.description ?? ""}
            className="md:col-span-2 min-h-24 rounded-md border border-zinc-300 px-3 py-2 text-sm"
          />
          <div className="md:col-span-2">
            <p className="mb-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#9e8f7a]">
              Imagen actual
            </p>
            <div className="h-40 w-32 overflow-hidden rounded-md border border-[#e0d4c1] bg-[#f6f0e5]">
              <LightboxImage
                src={dressImageUrl}
                alt={`Imagen actual de ${dress.modelName}`}
                wrapperClassName="block h-full w-full"
                thumbClassName="h-full w-full object-cover"
              />
            </div>
          </div>
          <div className="md:col-span-2">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.14em] text-[#9e8f7a]">
              Reemplazar imagen (opcional)
            </label>
            <input
              name="image"
              type="file"
              accept="image/*"
              capture="environment"
              className="block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-700 file:mr-3 file:rounded-md file:border-0 file:bg-[#f4ecdf] file:px-3 file:py-2 file:text-xs file:font-semibold file:text-[#8f7f65] hover:file:bg-[#efe3d0]"
            />
            <p className="mt-1 text-xs text-[#8f7f65]">
              Si seleccionas una imagen nueva, reemplaza la anterior (maximo 8MB).
            </p>
          </div>
          <div className="md:col-span-2 flex gap-2">
            <button
              type="submit"
              className="atelier-btn-primary px-3 py-2 text-sm"
            >
              Guardar cambios
            </button>
          </div>
        </form>

        <form action={onDeactivateDress} className="mt-3">
          <button
            type="submit"
            className="rounded-md border border-[#efb9b9] px-3 py-2 text-sm font-medium text-[#b85353] hover:bg-[#fcecec]"
          >
            Desactivar vestido
          </button>
        </form>
      </section>

      <section className="atelier-card p-4">
        <h2 className="atelier-heading-kicker">Nueva unidad</h2>
        <form action={onCreateUnit} className="mt-3 grid gap-3 md:grid-cols-3">
          <input
            name="inventoryCode"
            required
            placeholder="Codigo inventario"
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
          />
          <select name="status" defaultValue="AVAILABLE" className="rounded-md border border-zinc-300 px-3 py-2 text-sm">
            {UNIT_STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
          <input
            name="conditionNotes"
            placeholder="Notas (opcional)"
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="atelier-btn-primary md:col-span-3 px-3 py-2 text-sm"
          >
            Crear unidad
          </button>
        </form>
      </section>

      <section className="atelier-card overflow-hidden">
        <div className="border-b border-[#eadfce] bg-[#f4ecdf] p-3">
          <form className="grid gap-2 md:grid-cols-[1fr_auto_auto]" method="GET">
            <input
              name="unitCode"
              defaultValue={unitCode}
              placeholder="Buscar unidad por codigo"
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
            />
            <label className="inline-flex items-center gap-2 rounded-md border border-[#d9c8ae] bg-white px-3 py-2 text-sm text-[#7f6f58]">
              <input type="checkbox" name="showInactive" value="1" defaultChecked={showInactive} />
              Ver retiradas
            </label>
            <div className="flex gap-2">
              <button
                type="submit"
                className="atelier-btn-soft px-3 py-2 text-sm"
              >
                Aplicar
              </button>
              <Link
                href={`/admin/inventario/${dressId}`}
                className="atelier-btn-soft px-3 py-2 text-sm"
              >
                Limpiar
              </Link>
            </div>
          </form>
        </div>
        <table className="w-full border-collapse text-sm">
          <thead className="bg-[#f4ecdf]">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-[0.14em] text-[#9e8f7a]">Codigo</th>
              <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-[0.14em] text-[#9e8f7a]">Estado</th>
              <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-[0.14em] text-[#9e8f7a]">Notas</th>
              <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-[0.14em] text-[#9e8f7a]">Accion</th>
            </tr>
          </thead>
          <tbody>
            {dress.units.length === 0 ? (
              <tr>
                <td className="px-3 py-4 text-zinc-500" colSpan={4}>
                  Aun no hay unidades para este vestido.
                </td>
              </tr>
            ) : (
              dress.units.map((unit: DressUnitRow) => {
                const onUpdateUnit = updateUnitStatusAction.bind(null, dressId, unit.id);
                const onDeactivateUnit = deactivateUnitAction.bind(null, dressId, unit.id);

                return (
                  <tr key={unit.id} className="border-t border-[#eadfce]">
                    <td className="px-3 py-2 font-medium text-zinc-800">{unit.inventoryCode}</td>
                    <td className="px-3 py-2 text-zinc-700">
                      <form action={onUpdateUnit} className="flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex rounded-full border px-2 py-1 text-[10px] font-semibold tracking-wide ${unitStatusBadgeClass(unit.status)}`}
                        >
                          {unit.status}
                        </span>
                        <select
                          name="status"
                          defaultValue={unit.status}
                          className="rounded-md border border-zinc-300 px-2 py-1 text-xs"
                        >
                          {UNIT_STATUS_OPTIONS.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                        <input
                          name="conditionNotes"
                          defaultValue={unit.conditionNotes ?? ""}
                          placeholder="Notas"
                          className="min-w-44 rounded-md border border-zinc-300 px-2 py-1 text-xs"
                        />
                        <button
                          type="submit"
                          className="atelier-btn-soft px-2 py-1 text-xs"
                        >
                          Guardar
                        </button>
                      </form>
                    </td>
                    <td className="px-3 py-2 text-zinc-700">{unit.conditionNotes ?? "-"}</td>
                    <td className="px-3 py-2 text-zinc-700">
                      <form action={onDeactivateUnit}>
                        <button
                          type="submit"
                          className="rounded-md border border-[#efb9b9] px-2 py-1 text-xs font-medium text-[#b85353] hover:bg-[#fcecec]"
                        >
                          Desactivar
                        </button>
                      </form>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </section>
    </main>
  );
}
