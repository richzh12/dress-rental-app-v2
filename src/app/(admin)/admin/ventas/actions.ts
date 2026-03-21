"use server";

import { prisma } from "@/lib/prisma";
import { PaymentMethod } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createSaleAction(formData: FormData) {
  const dressUnitId = String(formData.get("dressUnitId") ?? "").trim();
  const customerIdRaw = String(formData.get("customerId") ?? "").trim();
  const paymentMethodRaw = String(formData.get("paymentMethod") ?? "").trim();
  const notesRaw = String(formData.get("notes") ?? "").trim();

  if (!dressUnitId) {
    throw new Error("Selecciona una prenda para vender");
  }

  const allowedMethods: PaymentMethod[] = ["CASH", "CARD", "TRANSFER", "OTHER"];
  const paymentMethod = allowedMethods.includes(paymentMethodRaw as PaymentMethod)
    ? (paymentMethodRaw as PaymentMethod)
    : "CASH";

  const dressUnit = await prisma.dressUnit.findUnique({
    where: { id: dressUnitId },
    include: { dress: true },
  });

  if (!dressUnit || !dressUnit.isActive) {
    throw new Error("La prenda seleccionada no esta disponible");
  }

  if (dressUnit.status !== "AVAILABLE") {
    throw new Error("Solo se pueden vender prendas en estado disponible");
  }

  const totalCents = dressUnit.dress.salePriceCents;
  if (totalCents === null) {
    throw new Error("La prenda no tiene precio de venta configurado");
  }

  const sale = await prisma.sale.create({
    data: {
      customerId: customerIdRaw || null,
      dressId: dressUnit.dressId,
      dressUnitId: dressUnit.id,
      totalCents,
      status: "COMPLETED",
      notes: notesRaw || undefined,
      payments: {
        create: {
          target: "SALE",
          amountCents: totalCents,
          method: paymentMethod,
          status: "PAID",
          paidAt: new Date(),
        },
      },
    },
  });

  await prisma.dressUnit.update({
    where: { id: dressUnit.id },
    data: { status: "RETIRED", isActive: false },
  });

  revalidatePath("/admin/ventas");
  revalidatePath("/admin/inventario");
  redirect(`/admin/ventas?created=1&saleId=${sale.id}`);
}
