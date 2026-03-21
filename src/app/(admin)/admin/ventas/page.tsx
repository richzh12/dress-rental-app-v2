import { prisma } from "@/lib/prisma";
import { getDressImageUrl } from "@/lib/dress-image";
import Link from "next/link";
import { Prisma } from "@prisma/client";
import NewSaleModal from "./new-sale-modal";
import SalesFilters from "./sales-filters";

type PaymentMethod = "CASH" | "CARD" | "TRANSFER" | "OTHER";
type SaleStatus = "PENDING" | "COMPLETED" | "CANCELLED" | "REFUNDED";

type SalesSearchParams = Promise<{
  created?: string;
  status?: string;
  method?: string;
  from?: string;
  to?: string;
}>;

type UnitForSaleWithImage = {
  id: string;
  dressId: string;
  inventoryCode: string;
  dress: {
    modelName: string;
    brand: string | null;
    color: string;
    size: string;
    salePriceCents: number | null;
    imageUrl: string | null;
  };
};

type SaleListItem = {
  id: string;
  saleDate: Date;
  status: SaleStatus;
  totalCents: number;
  dress: {
    modelName: string;
    brand: string | null;
    color: string;
    size: string;
  };
  dressUnit: {
    inventoryCode: string;
  } | null;
  customer: {
    firstName: string;
    lastName: string;
  } | null;
  payments: Array<{ id: string }>;
};

const VALID_SALE_STATUSES: SaleStatus[] = ["PENDING", "COMPLETED", "CANCELLED", "REFUNDED"];
const VALID_PAYMENT_METHODS: PaymentMethod[] = ["CASH", "CARD", "TRANSFER", "OTHER"];

function toStartOfDay(dateInput: string) {
  const date = new Date(`${dateInput}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function toEndOfDay(dateInput: string) {
  const date = new Date(`${dateInput}T23:59:59.999`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatPrice(cents: number) {
  return `$${(cents / 100).toLocaleString("es-CO", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString("es-CO", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

const SALE_STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendiente",
  COMPLETED: "Completada",
  CANCELLED: "Cancelada",
  REFUNDED: "Reembolsada",
};

export default async function VentasPage({
  searchParams,
}: {
  searchParams: SalesSearchParams;
}) {
  const params = await searchParams;
  const statusFilter: SaleStatus | "" = VALID_SALE_STATUSES.includes(params.status as SaleStatus)
    ? (params.status as SaleStatus)
    : "";
  const methodFilter: PaymentMethod | "" = VALID_PAYMENT_METHODS.includes(params.method as PaymentMethod)
    ? (params.method as PaymentMethod)
    : "";
  const fromFilter = params.from?.trim() ?? "";
  const toFilter = params.to?.trim() ?? "";

  const saleDateFilter: { gte?: Date; lte?: Date } = {};
  const fromDate = fromFilter ? toStartOfDay(fromFilter) : null;
  const toDate = toFilter ? toEndOfDay(toFilter) : null;
  if (fromDate) saleDateFilter.gte = fromDate;
  if (toDate) saleDateFilter.lte = toDate;

  const salesWhere: Prisma.SaleWhereInput = {
    status: statusFilter || undefined,
    saleDate: Object.keys(saleDateFilter).length > 0 ? saleDateFilter : undefined,
    payments: methodFilter
      ? {
          some: {
            method: methodFilter,
          },
        }
      : undefined,
  };

  const [customers, availableUnitsForSale, sales] = await Promise.all([
    prisma.customer.findMany({
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      select: {
        id: true,
        firstName: true,
        lastName: true,
      },
    }),
    prisma.dressUnit.findMany({
      where: {
        isActive: true,
        status: "AVAILABLE",
        dress: {
          salePriceCents: {
            not: null,
          },
        },
      },
      include: {
        dress: {
          select: {
            modelName: true,
            brand: true,
            color: true,
            size: true,
            salePriceCents: true,
            imageUrl: true,
          },
        },
      },
      orderBy: [{ dress: { modelName: "asc" } }, { inventoryCode: "asc" }],
    }),
    prisma.sale.findMany({
      where: salesWhere,
      include: {
        customer: true,
        dress: true,
        dressUnit: true,
        payments: true,
      },
      orderBy: { saleDate: "desc" },
      take: 30,
    }),
  ]);

  const availableUnitsForSaleWithImages = availableUnitsForSale.map((unit: UnitForSaleWithImage) => ({
    ...unit,
    dress: {
      ...unit.dress,
      imageUrl: getDressImageUrl(unit.dress.imageUrl, unit.dressId),
    },
  }));

  return (
    <main className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="atelier-heading-kicker">Comercial</p>
          <h1 className="atelier-title text-6xl leading-none">Ventas</h1>
          <p className="mt-2 text-sm text-[#8f7f65]">
            Registra ventas y consulta el historial reciente.
          </p>
        </div>
        <NewSaleModal customers={customers} availableUnitsForSale={availableUnitsForSaleWithImages} />
      </div>

      {params.created === "1" ? (
        <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          Venta registrada correctamente.
        </p>
      ) : null}

      <section className="atelier-card p-6 space-y-4">
        <h2 className="text-lg font-semibold">Filtros</h2>
        <SalesFilters
          statusFilter={statusFilter}
          methodFilter={methodFilter}
          fromFilter={fromFilter}
          toFilter={toFilter}
        />
      </section>

      <section className="atelier-card p-6 space-y-4">
        <h2 className="text-lg font-semibold">Ventas Recientes</h2>
        {sales.length === 0 ? (
          <p className="text-sm text-[#8f7f65]">No hay ventas registradas.</p>
        ) : (
          <div className="space-y-2">
            {sales.map((sale: SaleListItem) => (
              <article
                key={sale.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#eadfce] p-3"
              >
                <div>
                  <p className="font-semibold text-gray-900">
                    {sale.dress.brand ? `${sale.dress.brand} · ` : ""}
                    {sale.dress.modelName}
                  </p>
                  <p className="text-xs text-gray-500">
                    {sale.dress.color} - Talla {sale.dress.size} | Codigo: {sale.dressUnit?.inventoryCode ?? "N/A"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {sale.customer
                      ? `${sale.customer.firstName} ${sale.customer.lastName}`
                      : "Cliente no registrado"}
                    {" | "}
                    {formatDate(sale.saleDate)}
                  </p>
                </div>

                <div className="text-right">
                  <p className="font-semibold text-[#7e632d]">{formatPrice(sale.totalCents)}</p>
                  <p className="text-xs text-gray-500">
                    Estado: {SALE_STATUS_LABELS[sale.status] ?? sale.status}
                  </p>
                  <p className="text-xs text-gray-500">
                    Pagos: {sale.payments.length}
                  </p>
                  <Link
                    href={`/admin/ventas/${sale.id}`}
                    className="mt-1 inline-block text-xs font-semibold text-[#a97d13] hover:text-[#8d680a]"
                  >
                    Ver detalle
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
