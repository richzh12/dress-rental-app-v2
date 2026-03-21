import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Badge } from "@/components/badge";
import { updateSaleStatusAction } from "./actions";

const SALE_STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-[#f7edcc] text-[#9d7413]",
  COMPLETED: "bg-[#dcefe5] text-[#2c8d5c]",
  CANCELLED: "bg-[#f9e0e0] text-[#b85353]",
  REFUNDED: "bg-[#dde8ff] text-[#365db8]",
};

const SALE_STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendiente",
  COMPLETED: "Completada",
  CANCELLED: "Cancelada",
  REFUNDED: "Reembolsada",
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  CASH: "Efectivo",
  CARD: "Tarjeta",
  TRANSFER: "Transferencia",
  OTHER: "Otro",
};

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendiente",
  PAID: "Pagado",
  FAILED: "Fallido",
  REFUNDED: "Reembolsado",
};

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

export default async function SaleDetailPage({
  params,
}: {
  params: Promise<{ saleId: string }>;
}) {
  const { saleId } = await params;

  const sale = await prisma.sale.findUnique({
    where: { id: saleId },
    include: {
      customer: true,
      dress: true,
      dressUnit: true,
      payments: true,
    },
  });

  if (!sale) {
    return (
      <div className="space-y-6">
        <div>
          <Link href="/admin/ventas" className="text-blue-600 hover:text-blue-700">
            ← Volver a Ventas
          </Link>
        </div>
        <div className="py-8 text-center">
          <p className="text-lg text-gray-500">Venta no encontrada</p>
        </div>
      </div>
    );
  }

  const canComplete = sale.status === "PENDING";
  const canCancel = sale.status === "PENDING";
  const canRefund = sale.status === "COMPLETED";

  return (
    <main className="space-y-6">
      <div>
        <Link href="/admin/ventas" className="mb-4 inline-block text-blue-600 hover:text-blue-700">
          ← Volver a Ventas
        </Link>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="atelier-heading-kicker">Detalle</p>
            <h1 className="atelier-title text-5xl leading-none">Venta #{sale.id.slice(-8)}</h1>
            <p className="mt-2 text-sm text-[#8f7f65]">Fecha: {formatDate(sale.saleDate)}</p>
          </div>
          <Badge label={SALE_STATUS_LABELS[sale.status]} className={SALE_STATUS_COLORS[sale.status]} />
        </div>
      </div>

      <section className="atelier-card space-y-3 p-6">
        <h2 className="text-lg font-semibold">Acciones</h2>
        <div className="flex flex-wrap gap-2">
          {canComplete ? (
            <form action={updateSaleStatusAction}>
              <input type="hidden" name="saleId" value={sale.id} />
              <input type="hidden" name="nextStatus" value="COMPLETED" />
              <button type="submit" className="atelier-btn-primary px-4 py-2 font-medium">
                Marcar como completada
              </button>
            </form>
          ) : null}

          {canCancel ? (
            <form action={updateSaleStatusAction}>
              <input type="hidden" name="saleId" value={sale.id} />
              <input type="hidden" name="nextStatus" value="CANCELLED" />
              <button type="submit" className="rounded-lg border border-red-300 px-4 py-2 font-medium text-red-600 hover:bg-red-50">
                Cancelar venta
              </button>
            </form>
          ) : null}

          {canRefund ? (
            <form action={updateSaleStatusAction}>
              <input type="hidden" name="saleId" value={sale.id} />
              <input type="hidden" name="nextStatus" value="REFUNDED" />
              <button type="submit" className="rounded-lg border border-[#9bb6ea] bg-[#e8efff] px-4 py-2 font-medium text-[#365db8] hover:bg-[#d9e5ff]">
                Marcar como reembolsada
              </button>
            </form>
          ) : null}
        </div>
      </section>

      <section className="atelier-card grid gap-4 p-6 md:grid-cols-2">
        <div>
          <p className="mb-1 text-sm text-gray-600">Prenda</p>
          <p className="font-semibold text-gray-900">
            {sale.dress.brand ? `${sale.dress.brand} · ` : ""}
            {sale.dress.modelName}
          </p>
          <p className="text-sm text-gray-500">
            {sale.dress.color} - Talla {sale.dress.size}
          </p>
          <p className="text-xs text-gray-500">
            Codigo inventario: {sale.dressUnit?.inventoryCode ?? "N/A"}
          </p>
        </div>

        <div>
          <p className="mb-1 text-sm text-gray-600">Cliente</p>
          <p className="font-semibold text-gray-900">
            {sale.customer ? `${sale.customer.firstName} ${sale.customer.lastName}` : "Cliente no registrado"}
          </p>
          {sale.customer?.email ? <p className="text-xs text-gray-500">{sale.customer.email}</p> : null}
          {sale.customer?.phone ? <p className="text-xs text-gray-500">{sale.customer.phone}</p> : null}
        </div>
      </section>

      <section className="rounded-lg border border-[#eadabf] bg-[#faf3e4] p-6 space-y-3">
        <h2 className="text-lg font-semibold text-[#7e632d]">Resumen Financiero</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-700">Total venta:</span>
            <span className="font-semibold text-gray-900">{formatPrice(sale.totalCents)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-700">Pagado:</span>
            <span className="font-semibold text-green-700">
              {formatPrice(sale.payments.reduce((sum, payment) => sum + payment.amountCents, 0))}
            </span>
          </div>
        </div>
      </section>

      <section className="atelier-card space-y-4 p-6">
        <h2 className="text-lg font-semibold">Pagos de la Venta</h2>
        {sale.payments.length === 0 ? (
          <p className="text-sm text-[#8f7f65]">No hay pagos registrados.</p>
        ) : (
          <div className="space-y-2">
            {sale.payments.map((payment) => (
              <article key={payment.id} className="flex items-center justify-between rounded-lg border border-[#eadfce] p-3">
                <div>
                  <p className="font-medium text-gray-900">{PAYMENT_METHOD_LABELS[payment.method] ?? payment.method}</p>
                  <p className="text-xs text-gray-500">
                    Estado: {PAYMENT_STATUS_LABELS[payment.status] ?? payment.status}
                  </p>
                  <p className="text-xs text-gray-500">
                    {payment.paidAt ? formatDate(payment.paidAt) : "Sin fecha"}
                  </p>
                </div>
                <p className="font-semibold text-green-700">{formatPrice(payment.amountCents)}</p>
              </article>
            ))}
          </div>
        )}
      </section>

      {sale.notes ? (
        <section className="atelier-card p-6">
          <h2 className="mb-2 text-lg font-semibold">Notas</h2>
          <p className="whitespace-pre-wrap text-sm text-gray-700">{sale.notes}</p>
        </section>
      ) : null}
    </main>
  );
}
