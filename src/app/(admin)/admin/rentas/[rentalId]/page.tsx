import { prisma } from "@/lib/prisma";
import { getDressImageUrl } from "@/lib/dress-image";
import Link from "next/link";
import { Badge } from "@/components/badge";
import LightboxImage from "@/components/lightbox-image";
import { RentalDetailContent } from "./rental-detail-content";

type RentalDetailItem = {
  id: string;
  priceCents: number;
  dressUnit: {
    inventoryCode: string;
    status: string;
    dress: {
      id: string;
      modelName: string;
      brand: string | null;
      color: string;
      size: string;
      imageUrl: string | null;
    };
  };
};

type RentalPayment = {
  id: string;
  method: string;
  amountCents: number;
  paidAt: Date | null;
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

export default async function RentalDetailPage({
  params,
}: {
  params: Promise<{ rentalId: string }>;
}) {
  const { rentalId } = await params;

  const rental = await prisma.rental.findUnique({
    where: { id: rentalId },
    include: {
      customer: true,
      items: { include: { dressUnit: { include: { dress: true } } } },
      payments: true,
    },
  });

  if (!rental) {
    return (
      <div className="space-y-6">
        <div>
          <Link href="/admin/rentas" className="text-blue-600 hover:text-blue-700">
            ← Volver a Alquileres
          </Link>
        </div>
        <div className="text-center py-8">
          <p className="text-gray-500 text-lg">Alquiler no encontrado</p>
        </div>
      </div>
    );
  }

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

  const rentalBaseCents = rental.items.reduce(
    (sum: number, item: RentalDetailItem) => sum + item.priceCents,
    0,
  );
  const itbmsCents = Math.max(0, rental.subtotalCents - rentalBaseCents);
  const totalToCollectCents = rental.subtotalCents;
  const depositPaid = rental.notes?.includes("[[DEPOSIT_PAID:yes]]") ?? false;
  const customerNotes = (rental.notes ?? "")
    .replace(/\[\[DEPOSIT_PAID:(yes|no)\]\]\s*/g, "")
    .trim();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link href="/admin/rentas" className="text-blue-600 hover:text-blue-700 mb-4 inline-block">
          ← Volver a Alquileres
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <p className="atelier-heading-kicker">Detalle</p>
            <h1 className="atelier-title text-5xl leading-none">Alquiler #{rental.id.slice(-8)}</h1>
            <p className="text-[#8f7f65] mt-2">
              {rental.customer.firstName} {rental.customer.lastName}
            </p>
          </div>
          <Badge
            label={RENTAL_STATUS_LABELS[rental.status]}
            className={RENTAL_STATUS_COLORS[rental.status]}
          />
        </div>
      </div>

      {/* Status Actions */}
      <RentalDetailContent rental={rental} />

      {/* Rental Info */}
      <div className="atelier-card grid grid-cols-1 gap-4 p-6 md:grid-cols-2">
        <div>
          <p className="text-sm text-gray-600 mb-1">Fecha de inicio</p>
          <p className="font-semibold text-gray-900">{formatDate(rental.startDate)}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600 mb-1">Fecha de fin</p>
          <p className="font-semibold text-gray-900">{formatDate(rental.endDate)}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600 mb-1">Cliente</p>
          <p className="font-semibold text-gray-900">
            {rental.customer.firstName} {rental.customer.lastName}
          </p>
          {rental.customer.email && (
            <p className="text-xs text-gray-500">{rental.customer.email}</p>
          )}
        </div>
        <div>
          <p className="text-sm text-gray-600 mb-1">Teléfono</p>
          <p className="font-semibold text-gray-900">
            {rental.customer.phone || "No registrado"}
          </p>
        </div>
      </div>

      {/* Items */}
      <div className="atelier-card p-6 space-y-4">
        <h2 className="text-lg font-semibold">Prendas Rentadas</h2>
        <div className="space-y-2">
          {rental.items.map((item: RentalDetailItem, index: number) => (
            <div key={item.id} className="flex items-center justify-between gap-3 p-3 border border-[#eadfce] rounded-lg">
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-16 w-14 shrink-0 overflow-hidden rounded-md border border-[#eadfce] bg-[#f6f0e5]">
                  <LightboxImage
                    src={getDressImageUrl(item.dressUnit.dress.imageUrl, item.dressUnit.dress.id)}
                    alt={`Foto de ${item.dressUnit.dress.modelName}`}
                    wrapperClassName="block h-full w-full"
                    thumbClassName="h-full w-full object-cover"
                  />
                </div>
                <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#9d7413]">
                  Prenda {index + 1}
                </p>
                <p className="font-medium text-gray-900">
                  {item.dressUnit.dress.brand
                    ? `${item.dressUnit.dress.brand} · ${item.dressUnit.dress.modelName}`
                    : item.dressUnit.dress.modelName}
                </p>
                <p className="text-sm text-gray-500">
                  {item.dressUnit.dress.color} - Talla {item.dressUnit.dress.size}
                </p>
                <p className="text-xs text-gray-500">
                  Código inventario: {item.dressUnit.inventoryCode}
                </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-900">{formatPrice(item.priceCents)}</p>
                <Badge
                  label={item.dressUnit.status}
                  className="bg-[#f3ecde] text-[#7f6f58] mt-1"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Financial Summary */}
      <div className="rounded-lg border border-[#eadabf] bg-[#faf3e4] p-6 space-y-3">
        <h2 className="text-lg font-semibold text-[#7e632d]">Resumen Financiero</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-700">Valor de alquiler:</span>
            <span className="font-medium">{formatPrice(rentalBaseCents)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-700">ITBMS (7%):</span>
            <span className="font-medium">{formatPrice(itbmsCents)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-700">Subtotal alquiler:</span>
            <span className="font-medium">{formatPrice(rental.subtotalCents)}</span>
          </div>
          <div className="border-t border-[#e7d4b4] pt-2 flex justify-between">
            <span className="text-[#7e632d] font-semibold">Total por cobrar:</span>
            <span className="font-bold text-lg">{formatPrice(totalToCollectCents)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-700">Depósito:</span>
            <span className={`font-medium ${depositPaid ? "text-green-700" : "text-red-600"}`}>
              {depositPaid ? "Pagado" : "No pagado"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-700">Pagado:</span>
            <span className="font-medium text-green-600">{formatPrice(rental.totalPaidCents)}</span>
          </div>
          <div className="flex justify-between bg-white bg-opacity-50 p-2 rounded">
            <span className="font-semibold text-gray-900">Saldo pendiente:</span>
            <span className={`font-bold text-lg ${rental.balanceDueCents > 0 ? "text-red-600" : "text-green-600"}`}>
              {formatPrice(rental.balanceDueCents)}
            </span>
          </div>
        </div>
      </div>

      {/* Payments */}
      <div className="atelier-card p-6 space-y-4">
        <h2 className="text-lg font-semibold">Pagos Registrados</h2>
        {rental.payments.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No hay pagos registrados</p>
        ) : (
          <div className="space-y-2">
            {rental.payments.map((payment: RentalPayment) => (
              <div key={payment.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{payment.method}</p>
                  <p className="text-xs text-gray-500">
                    {payment.paidAt ? new Date(payment.paidAt).toLocaleDateString("es-CO") : "Sin fecha"}
                  </p>
                </div>
                <p className="font-semibold text-green-600">{formatPrice(payment.amountCents)}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Notes */}
      {customerNotes && (
        <div className="atelier-card p-6">
          <h2 className="text-lg font-semibold mb-3">Notas</h2>
          <p className="text-gray-700 whitespace-pre-wrap">{customerNotes}</p>
        </div>
      )}
    </div>
  );
}
