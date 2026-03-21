"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const DAY_IN_MS = 1000 * 60 * 60 * 24;

type DressUnitWithDress = {
  id: string;
  dress: {
    rentalPriceCents: number;
  };
};

type AvailableDressUnit = {
  id: string;
  inventoryCode: string;
  isActive: boolean;
  dress: {
    modelName: string;
    brand: string | null;
    color: string;
    size: string;
    rentalPriceCents: number;
  };
};

function getInclusiveRentalDays(start: Date, end: Date) {
  const days = Math.ceil((end.getTime() - start.getTime()) / DAY_IN_MS) + 1;
  return Math.max(days, 1);
}

function getExclusiveEndDate(inclusiveEnd: Date) {
  return new Date(inclusiveEnd.getTime() + DAY_IN_MS);
}

export async function createRentalAction(formData: FormData) {
  const customerMode = (formData.get("customerMode") as string) || "new";
  const customerId = formData.get("customerId") as string;
  const customerFirstName = (formData.get("customerFirstName") as string) || "";
  const customerLastName = (formData.get("customerLastName") as string) || "";
  const customerEmail = (formData.get("customerEmail") as string) || "";
  const customerPhone = (formData.get("customerPhone") as string) || "";
  const customerDocumentId = (formData.get("customerDocumentId") as string) || "";
  const customerNotes = (formData.get("customerNotes") as string) || "";
  const startDate = formData.get("startDate") as string;
  const endDate = formData.get("endDate") as string;
  const notes = formData.get("notes") as string;
  const depositPaid = (formData.get("depositPaid") as string) === "true";
  const unitIdsStr = formData.get("unitIds") as string;

  let unitIds: string[] = [];
  try {
    unitIds = JSON.parse(unitIdsStr || "[]") as string[];
  } catch {
    throw new Error("No se pudieron leer las prendas seleccionadas");
  }

  let resolvedCustomerId = "";

  if (customerMode === "existing") {
    if (!customerId) {
      throw new Error("Selecciona un cliente existente");
    }

    const existingCustomer = await prisma.customer.findUnique({
      where: { id: customerId },
      select: { id: true },
    });

    if (!existingCustomer) {
      throw new Error("El cliente seleccionado no existe");
    }

    resolvedCustomerId = existingCustomer.id;
  } else {
    if (!customerFirstName.trim() || !customerLastName.trim()) {
      throw new Error("Para cliente nuevo, nombre y apellido son obligatorios");
    }

    const newCustomer = await prisma.customer.create({
      data: {
        firstName: customerFirstName.trim(),
        lastName: customerLastName.trim(),
        email: customerEmail.trim() || undefined,
        phone: customerPhone.trim() || undefined,
        documentId: customerDocumentId.trim() || undefined,
        notes: customerNotes.trim() || undefined,
      },
      select: { id: true },
    });

    resolvedCustomerId = newCustomer.id;
  }

  if (!resolvedCustomerId || !startDate || !endDate || unitIds.length === 0) {
    throw new Error("Por favor completa todos los campos requeridos");
  }

  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);

  if (start > end) {
    throw new Error("La fecha de inicio no puede ser mayor que la fecha de fin");
  }

  const rentalDays = getInclusiveRentalDays(start, end);
  const endExclusive = getExclusiveEndDate(end);

  for (const unitId of unitIds) {
    const conflicts = await prisma.rentalItem.count({
      where: {
        dressUnitId: unitId,
        startsAt: { lt: endExclusive },
        endsAt: { gt: start },
      },
    });

    if (conflicts > 0) {
      const unit = await prisma.dressUnit.findUnique({
        where: { id: unitId },
        include: { dress: true },
      });
      throw new Error(
        `${unit?.dress.modelName} (${unit?.inventoryCode}) no está disponible para estas fechas`
      );
    }
  }

  const dressUnits = await prisma.dressUnit.findMany({
    where: { id: { in: unitIds } },
    include: { dress: true },
  });

  const rentalBaseCents = dressUnits.reduce((sum: number, unit: DressUnitWithDress) => {
    return sum + unit.dress.rentalPriceCents * rentalDays;
  }, 0);

  const itbmsCents = dressUnits.reduce((sum: number, unit: DressUnitWithDress) => {
    const lineBaseCents = unit.dress.rentalPriceCents * rentalDays;
    return sum + Math.round(lineBaseCents * 0.07);
  }, 0);
  const subtotalCents = rentalBaseCents + itbmsCents;
  const depositRequiredCents = 0;
  const balanceDueCents = subtotalCents;
  const notesTag = `[[DEPOSIT_PAID:${depositPaid ? "yes" : "no"}]]`;
  const notesClean = notes?.trim();
  const persistedNotes = [notesTag, notesClean].filter(Boolean).join("\n");

  const rental = await prisma.rental.create({
    data: {
      customerId: resolvedCustomerId,
      startDate: start,
      endDate: end,
      status: "RESERVED",
      subtotalCents,
      depositRequiredCents,
      balanceDueCents,
      notes: persistedNotes || undefined,
      items: {
        create: dressUnits.map((unit: DressUnitWithDress) => ({
          dressUnitId: unit.id,
          startsAt: start,
          endsAt: endExclusive,
          priceCents: unit.dress.rentalPriceCents * rentalDays,
        })),
      },
    },
  });

  await Promise.all(
    unitIds.map((unitId: string) =>
      prisma.dressUnit.update({
        where: { id: unitId },
        data: { status: "RESERVED" },
      })
    )
  );

  revalidatePath("/admin/rentas");
  redirect(`/admin/rentas/${rental.id}`);
}

export async function getAvailableUnits(startDate: string, endDate: string) {
  if (!startDate || !endDate) {
    return [];
  }

  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);

  if (start > end) {
    return [];
  }

  const endExclusive = getExclusiveEndDate(end);

  const allUnits = await prisma.dressUnit.findMany({
    where: { isActive: true },
    include: { dress: true },
    orderBy: { dress: { modelName: "asc" } },
  });

  const availableUnits = await Promise.all(
    allUnits.map(async (unit: AvailableDressUnit) => {
      const conflicts = await prisma.rentalItem.count({
        where: {
          dressUnitId: unit.id,
          startsAt: { lt: endExclusive },
          endsAt: { gt: start },
        },
      });
      return conflicts === 0 ? unit : null;
    })
  );

  return availableUnits.filter(Boolean);
}
