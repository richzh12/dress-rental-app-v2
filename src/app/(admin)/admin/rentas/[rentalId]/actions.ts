"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

type PaymentMethod = "CASH" | "CARD" | "TRANSFER" | "OTHER";
type RentalStatus = "RESERVED" | "RENTED" | "RETURNED" | "COMPLETED" | "CANCELLED";
type RentalItemRef = { dressUnitId: string };

function withDepositTag(notes: string | null, depositPaid: boolean) {
  const cleanNotes = (notes ?? "")
    .replace(/\[\[DEPOSIT_PAID:(yes|no)\]\]\s*/g, "")
    .trim();
  const tag = `[[DEPOSIT_PAID:${depositPaid ? "yes" : "no"}]]`;
  return [tag, cleanNotes].filter(Boolean).join("\n");
}

export async function updateRentalStatusAction(
  rentalId: string,
  newStatus: RentalStatus
) {
  const ALLOWED_STATUSES: RentalStatus[] = [
    "RESERVED",
    "RENTED",
    "RETURNED",
    "COMPLETED",
    "CANCELLED",
  ];

  if (!ALLOWED_STATUSES.includes(newStatus)) {
    throw new Error("Estado no válido");
  }

  const rental = await prisma.rental.update({
    where: { id: rentalId },
    data: { status: newStatus },
  });

  // If moving to RENTED, update unit statuses to RENTED
  if (newStatus === "RENTED") {
    const items = await prisma.rentalItem.findMany({
      where: { rentalId },
      select: { dressUnitId: true },
    });

    await Promise.all(
      items.map((item: RentalItemRef) =>
        prisma.dressUnit.update({
          where: { id: item.dressUnitId },
          data: { status: "RENTED" },
        })
      )
    );
  }

  // If moving to RETURNED/COMPLETED, update unit statuses back to AVAILABLE
  if (newStatus === "RETURNED" || newStatus === "COMPLETED") {
    const items = await prisma.rentalItem.findMany({
      where: { rentalId },
      select: { dressUnitId: true },
    });

    await Promise.all(
      items.map((item: RentalItemRef) =>
        prisma.dressUnit.update({
          where: { id: item.dressUnitId },
          data: { status: "AVAILABLE" },
        })
      )
    );
  }

  revalidatePath(`/admin/rentas/${rentalId}`);
  return rental;
}

export async function addPaymentAction(
  rentalId: string,
  amountCents: number,
  method: PaymentMethod
) {
  const ALLOWED_METHODS: PaymentMethod[] = ["CASH", "CARD", "TRANSFER", "OTHER"];

  if (!ALLOWED_METHODS.includes(method)) {
    throw new Error("Método de pago no válido");
  }

  if (amountCents <= 0) {
    throw new Error("El monto debe ser mayor a 0");
  }

  const rental = await prisma.rental.findUnique({
    where: { id: rentalId },
  });

  if (!rental) {
    throw new Error("Alquiler no encontrado");
  }

  const payment = await prisma.payment.create({
    data: {
      target: "RENTAL",
      rentalId,
      amountCents,
      method,
      status: "PAID",
      paidAt: new Date(),
    },
  });

  // Update rental totals
  const updatedTotalPaid = rental.totalPaidCents + amountCents;
  const newBalanceDue = Math.max(0, rental.balanceDueCents - amountCents);

  await prisma.rental.update({
    where: { id: rentalId },
    data: {
      totalPaidCents: updatedTotalPaid,
      balanceDueCents: newBalanceDue,
    },
  });

  revalidatePath(`/admin/rentas/${rentalId}`);
  return payment;
}

export async function cancelRentalAction(rentalId: string) {
  const rental = await prisma.rental.findUnique({
    where: { id: rentalId },
    include: { items: true },
  });

  if (!rental) {
    throw new Error("Alquiler no encontrado");
  }

  await prisma.rental.update({
    where: { id: rentalId },
    data: { status: "CANCELLED" },
  });

  // Return all units to AVAILABLE
  await Promise.all(
    rental.items.map((item: RentalItemRef) =>
      prisma.dressUnit.update({
        where: { id: item.dressUnitId },
        data: { status: "AVAILABLE" },
      })
    )
  );

  revalidatePath(`/admin/rentas/${rentalId}`);
  revalidatePath("/admin/rentas");
}

export async function updateDepositPaidAction(rentalId: string, depositPaid: boolean) {
  const rental = await prisma.rental.findUnique({
    where: { id: rentalId },
    select: { id: true, notes: true },
  });

  if (!rental) {
    throw new Error("Alquiler no encontrado");
  }

  await prisma.rental.update({
    where: { id: rentalId },
    data: {
      notes: withDepositTag(rental.notes, depositPaid),
    },
  });

  revalidatePath(`/admin/rentas/${rentalId}`);
  revalidatePath("/admin/rentas");
}
