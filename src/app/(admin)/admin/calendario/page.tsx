import Link from "next/link";
import { prisma } from "@/lib/prisma";

type RentalStatus = "RESERVED" | "RENTED" | "RETURNED" | "COMPLETED" | "CANCELLED";

type CalendarSearchParams = Promise<{
  year?: string;
  month?: string;
}>;

type CalendarPageProps = {
  searchParams: CalendarSearchParams;
};

type CalendarRental = {
  id: string;
  status: RentalStatus;
  startDate: Date;
  endDate: Date;
  customer: {
    firstName: string;
    lastName: string;
  };
};

const MONTH_NAMES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

const WEEK_DAYS = ["Dom", "Lun", "Mar", "Mie", "Jue", "Vie", "Sab"];

function toStatusTag(status: RentalStatus) {
  if (status === "RENTED") {
    return { label: "Alquilado", className: "bg-[#dde8ff] text-[#355db9]" };
  }
  if (status === "RESERVED") {
    return { label: "Reservado", className: "bg-[#f8edc7] text-[#9d7413]" };
  }
  if (status === "RETURNED" || status === "COMPLETED") {
    return { label: "Devuelto", className: "bg-[#ddf0e7] text-[#2f8a5f]" };
  }
  return { label: "Otro", className: "bg-[#ece5d9] text-[#8e7f68]" };
}

function monthNavigation(year: number, month: number) {
  const prevMonth = month === 0 ? 11 : month - 1;
  const prevYear = month === 0 ? year - 1 : year;

  const nextMonth = month === 11 ? 0 : month + 1;
  const nextYear = month === 11 ? year + 1 : year;

  return {
    prevHref: `/admin/calendario?year=${prevYear}&month=${prevMonth + 1}`,
    nextHref: `/admin/calendario?year=${nextYear}&month=${nextMonth + 1}`,
  };
}

function getMonthGrid(year: number, month: number) {
  const startOfMonth = new Date(year, month, 1);
  const endOfMonth = new Date(year, month + 1, 0);

  const totalDays = endOfMonth.getDate();
  const startWeekDay = startOfMonth.getDay();

  const cells: Array<Date | null> = [];

  for (let i = 0; i < startWeekDay; i += 1) {
    cells.push(null);
  }

  for (let day = 1; day <= totalDays; day += 1) {
    cells.push(new Date(year, month, day));
  }

  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  return cells;
}

export default async function CalendarioPage({ searchParams }: CalendarPageProps) {
  const params = await searchParams;

  const now = new Date();
  const safeYear = Number.parseInt(params.year ?? "", 10);
  const safeMonth = Number.parseInt(params.month ?? "", 10);

  const year = Number.isFinite(safeYear) ? safeYear : now.getFullYear();
  const monthIndex = Number.isFinite(safeMonth) && safeMonth >= 1 && safeMonth <= 12
    ? safeMonth - 1
    : now.getMonth();

  const monthStart = new Date(year, monthIndex, 1);
  const monthEnd = new Date(year, monthIndex + 1, 0, 23, 59, 59, 999);

  const rentals: CalendarRental[] = await prisma.rental.findMany({
    where: {
      status: {
        not: "CANCELLED",
      },
      startDate: { lte: monthEnd },
      endDate: { gte: monthStart },
    },
    include: {
      customer: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
    },
    orderBy: {
      startDate: "asc",
    },
  });

  const grid = getMonthGrid(year, monthIndex);
  const { prevHref, nextHref } = monthNavigation(year, monthIndex);

  return (
    <main className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="atelier-heading-kicker">Disponibilidad</p>
          <h1 className="atelier-title text-6xl leading-none">Calendario</h1>
        </div>
      </div>

      <section className="atelier-card p-4">
        <div className="mb-4 flex items-center justify-between gap-3">
          <Link href={prevHref} className="atelier-btn-soft px-3 py-2 text-sm">
            ← Mes anterior
          </Link>
          <h2 className="atelier-title text-4xl leading-none">
            {MONTH_NAMES[monthIndex]} {year}
          </h2>
          <Link href={nextHref} className="atelier-btn-soft px-3 py-2 text-sm">
            Mes siguiente →
          </Link>
        </div>

        <div className="mb-4 flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#8f7f65]">
          <span className="rounded-full bg-[#dde8ff] px-3 py-1 text-[#355db9]">Alquilado</span>
          <span className="rounded-full bg-[#f8edc7] px-3 py-1 text-[#9d7413]">Reservado</span>
          <span className="rounded-full bg-[#ddf0e7] px-3 py-1 text-[#2f8a5f]">Devuelto</span>
        </div>

        <div className="grid grid-cols-7 border border-[#eadfce]">
          {WEEK_DAYS.map((day) => (
            <div
              key={day}
              className="border-b border-r border-[#eadfce] bg-[#f4ecdf] px-2 py-2 text-center text-xs font-semibold uppercase tracking-[0.14em] text-[#9e8f7a]"
            >
              {day}
            </div>
          ))}

          {grid.map((date, index) => {
            if (!date) {
              return (
                <div
                  key={`empty-${index}`}
                  className="min-h-32 border-b border-r border-[#eadfce] bg-[#fbf7ef]"
                />
              );
            }

            const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
            const dayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);

            const dayRentals = rentals.filter(
              (rental: CalendarRental) => rental.startDate <= dayEnd && rental.endDate >= dayStart
            );

            return (
              <div key={date.toISOString()} className="min-h-32 border-b border-r border-[#eadfce] bg-[#fffdf9] p-2">
                <p className="text-sm font-semibold text-[#6e5e47]">{date.getDate()}</p>

                <div className="mt-2 space-y-1">
                  {dayRentals.slice(0, 3).map((rental: CalendarRental) => {
                    const tag = toStatusTag(rental.status);
                    return (
                      <Link
                        key={`${date.toISOString()}-${rental.id}`}
                        href={`/admin/rentas/${rental.id}`}
                        className={`block rounded-md px-2 py-1 text-[11px] font-semibold ${tag.className}`}
                        title={`${rental.customer.firstName} ${rental.customer.lastName}`}
                      >
                        {rental.customer.firstName} - {tag.label}
                      </Link>
                    );
                  })}

                  {dayRentals.length > 3 ? (
                    <p className="text-[11px] font-semibold text-[#8f7f65]">
                      +{dayRentals.length - 3} más
                    </p>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
