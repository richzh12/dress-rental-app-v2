import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Badge } from "@/components/badge";
import RentalsFilters from "./rentals-filters";

type RentalStatus = "RESERVED" | "RENTED" | "RETURNED" | "COMPLETED" | "CANCELLED";

interface SearchParams {
  status?: string;
  search?: string;
  page?: string;
}

type RentalsSearchParams = Promise<SearchParams>;
type RentalListItem = {
  id: string;
  status: RentalStatus;
  startDate: Date;
  endDate: Date;
  subtotalCents: number;
  customer: {
    firstName: string;
    lastName: string;
    email: string | null;
  };
  items: Array<{
    id: string;
    dressUnit: {
      inventoryCode: string;
      dress: {
        modelName: string;
      };
    };
  }>;
};

const RENTAL_STATUS_COLORS: Record<string, string> = {
  RESERVED: "bg-[#f7edcc] text-[#9d7413]",
  RENTED: "bg-[#dde8ff] text-[#365db8]",
  RETURNED: "bg-[#dff0e8] text-[#2f8a5f]",
  COMPLETED: "bg-[#dcefe5] text-[#2c8d5c]",
  CANCELLED: "bg-[#f9e0e0] text-[#b85353]",
};

const RENTAL_STATUS_LABELS: Record<string, string> = {
  RESERVED: "Reservado",
  RENTED: "Rentado",
  RETURNED: "Devuelto",
  COMPLETED: "Completado",
  CANCELLED: "Cancelado",
};

const ALLOWED_STATUSES: RentalStatus[] = [
  "RESERVED",
  "RENTED",
  "RETURNED",
  "COMPLETED",
  "CANCELLED",
];

function isRentalStatus(value: string): value is RentalStatus {
  return ALLOWED_STATUSES.includes(value as RentalStatus);
}

async function getRentals(searchParams: SearchParams) {
  const where: Prisma.RentalWhereInput = {};

  if (
    searchParams.status &&
    searchParams.status !== "all" &&
    isRentalStatus(searchParams.status)
  ) {
    where.status = searchParams.status;
  }

  if (searchParams.search) {
    where.OR = [
      {
        customer: {
          firstName: { contains: searchParams.search, mode: "insensitive" },
        },
      },
      {
        customer: {
          lastName: { contains: searchParams.search, mode: "insensitive" },
        },
      },
      {
        customer: { email: { contains: searchParams.search, mode: "insensitive" } },
      },
    ];
  }

  const rentals = await prisma.rental.findMany({
    where,
    include: {
      customer: true,
      items: { include: { dressUnit: { include: { dress: true } } } },
      payments: true,
    },
    orderBy: { startDate: "desc" },
    take: 20,
  });

  return rentals;
}

export default async function RentalsPage({
  searchParams,
}: {
  searchParams: RentalsSearchParams;
}) {
  const params = await searchParams;
  const rentals = await getRentals(params);

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("es-CO", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toLocaleString("es-CO", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="atelier-heading-kicker">Reservas y alquileres</p>
          <h1 className="atelier-title text-5xl leading-none sm:text-6xl">Alquileres</h1>
          <p className="mt-2 text-sm text-[#8f7f65]">Gestiona los alquileres de vestidos</p>
        </div>
        <Link
          href="/admin/rentas/crear"
          className="atelier-btn-primary px-4 py-2"
        >
          + Nuevo Alquiler
        </Link>
      </div>

      {/* Filters */}
      <div className="atelier-card p-4 space-y-4">
        <RentalsFilters currentStatus={params.status || "all"} />
      </div>

      {/* Rentals Table */}
      <div className="space-y-2 md:hidden">
        {rentals.length === 0 ? (
          <div className="atelier-card p-8 text-center text-[#9e8f7a]">
            <p>No hay alquileres registrados</p>
          </div>
        ) : (
          rentals.map((rental) => (
            <article key={rental.id} className="atelier-card space-y-2 p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-[#473b2f]">
                    {rental.customer.firstName} {rental.customer.lastName}
                  </p>
                  <p className="break-all text-xs text-[#a09078]">{rental.customer.email || "Sin correo"}</p>
                </div>
                <Badge
                  label={RENTAL_STATUS_LABELS[rental.status]}
                  className={RENTAL_STATUS_COLORS[rental.status]}
                />
              </div>

              <div className="text-[13px] text-[#695b49]">
                <p className="leading-relaxed">{formatDate(rental.startDate)} a {formatDate(rental.endDate)}</p>
                <p className="mt-1 font-semibold text-[#a77d10]">{formatPrice(rental.subtotalCents)}</p>
              </div>

              <div className="space-y-1 text-xs text-[#695b49]">
                {rental.items.slice(0, 2).map((item) => (
                  <p key={item.id}>
                    {item.dressUnit.dress.modelName} ({item.dressUnit.inventoryCode})
                  </p>
                ))}
                {rental.items.length > 2 ? (
                  <p className="text-[#a09078]">+{rental.items.length - 2} más</p>
                ) : null}
              </div>

              <Link
                href={`/admin/rentas/${rental.id}`}
                className="inline-block text-sm font-medium text-[#aa7e12] hover:text-[#8d680a]"
              >
                Ver
              </Link>
            </article>
          ))
        )}
      </div>

      <div className="hidden md:block atelier-card overflow-hidden">
        {rentals.length === 0 ? (
          <div className="p-8 text-center text-[#9e8f7a]">
            <p>No hay alquileres registrados</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-[#f4ecdf] border-b border-[#eadfce]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-[#9e8f7a]">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-[#9e8f7a]">
                  Fechas
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-[#9e8f7a]">
                  Prendas
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-[#9e8f7a]">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-[#9e8f7a]">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-[#9e8f7a]">
                  Acción
                </th>
              </tr>
            </thead>
            <tbody>
              {rentals.map((rental) => (
                <tr
                  key={rental.id}
                  className="border-b border-[#eee4d4] hover:bg-[#fbf7ef]"
                >
                  <td className="px-6 py-4 text-sm">
                    <div>
                      <p className="font-medium text-[#473b2f]">
                        {rental.customer.firstName} {rental.customer.lastName}
                      </p>
                      <p className="text-[#a09078]">{rental.customer.email}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-[#695b49]">
                    <div>
                      <p>{formatDate(rental.startDate)}</p>
                      <p className="text-[#a09078]">
                        a {formatDate(rental.endDate)}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-[#695b49]">
                    <div className="space-y-1">
                      {rental.items.slice(0, 2).map((item) => (
                        <p key={item.id} className="text-xs">
                          {item.dressUnit.dress.modelName} ({item.dressUnit.inventoryCode})
                        </p>
                      ))}
                      {rental.items.length > 2 && (
                        <p className="text-xs text-[#a09078]">
                          +{rental.items.length - 2} más
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-[#a77d10]">
                    {formatPrice(rental.subtotalCents)}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <Badge
                      label={RENTAL_STATUS_LABELS[rental.status]}
                      className={RENTAL_STATUS_COLORS[rental.status]}
                    />
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <Link
                      href={`/admin/rentas/${rental.id}`}
                      className="font-medium text-[#aa7e12] hover:text-[#8d680a]"
                    >
                      Ver
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
