"use server";

import { prisma } from "@/lib/prisma";
import { SaleStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

const ALLOWED_STATUS_CHANGES: Record<SaleStatus, SaleStatus[]> = {
  PENDING: ["COMPLETED", "CANCELLED"],
  COMPLETED: ["REFUNDED"],
  CANCELLED: [],
  REFUNDED: [],
};

export async function updateSaleStatusAction(formData: FormData) {
  const saleId = String(formData.get("saleId") ?? "").trim();
  const nextStatusRaw = String(formData.get("nextStatus") ?? "").trim();

  if (!saleId) {
    throw new Error("Venta invalida");
  }

  const allowedStatuses: SaleStatus[] = ["PENDING", "COMPLETED", "CANCELLED", "REFUNDED"];
  if (!allowedStatuses.includes(nextStatusRaw as SaleStatus)) {
    throw new Error("Estado de venta no valido");
  }

  const nextStatus = nextStatusRaw as SaleStatus;

  const sale = await prisma.sale.findUnique({
    where: { id: saleId },
    include: { dressUnit: true, payments: true },
  });

  if (!sale) {
    throw new Error("Venta no encontrada");
  }

  const possibleTransitions = ALLOWED_STATUS_CHANGES[sale.status] ?? [];
  if (!possibleTransitions.includes(nextStatus)) {
    throw new Error("Transicion de estado no permitida");
  }

  await prisma.sale.update({
    where: { id: saleId },
    data: { status: nextStatus },
  });

  if (sale.dressUnitId) {
    if (nextStatus === "REFUNDED" || nextStatus === "CANCELLED") {
      await prisma.dressUnit.update({
        where: { id: sale.dressUnitId },
        data: { status: "AVAILABLE", isActive: true },
      });
    }

    if (nextStatus === "COMPLETED") {
      await prisma.dressUnit.update({
        where: { id: sale.dressUnitId },
        data: { status: "RETIRED", isActive: false },
      });
    }
  }

  if (nextStatus === "REFUNDED") {
    await prisma.payment.updateMany({
      where: { saleId },
      data: { status: "REFUNDED" },
    });
  }

  revalidatePath("/admin/ventas");
  revalidatePath(`/admin/ventas/${saleId}`);
}
