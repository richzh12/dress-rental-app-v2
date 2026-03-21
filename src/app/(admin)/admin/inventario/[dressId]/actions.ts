"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { uploadDressImageToCloudinary } from "@/lib/cloudinary";

const ALLOWED_UNIT_STATUSES = [
  "AVAILABLE",
  "RESERVED",
  "RENTED",
  "MAINTENANCE",
  "LAUNDRY",
  "RETIRED",
] as const;

type UnitStatus = (typeof ALLOWED_UNIT_STATUSES)[number];

function parsePriceToCents(raw: FormDataEntryValue | null, fieldName: string) {
  const value = String(raw ?? "").trim().replace(",", ".");
  const numeric = Number.parseFloat(value);

  if (!Number.isFinite(numeric) || numeric < 0) {
    throw new Error(`Valor invalido para ${fieldName}.`);
  }

  return Math.round(numeric * 100);
}

async function ensureSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/login");
  }
}

export async function updateDressAction(dressId: string, formData: FormData) {
  await ensureSession();

  const modelName = String(formData.get("modelName") ?? "").trim();
  const brandRaw = String(formData.get("brand") ?? "").trim();
  const color = String(formData.get("color") ?? "").trim();
  const size = String(formData.get("size") ?? "").trim().toUpperCase();
  const descriptionRaw = String(formData.get("description") ?? "").trim();

  if (!modelName || !color || !size) {
    throw new Error("Modelo, color y talla son obligatorios.");
  }

  const rentalPriceCents = parsePriceToCents(formData.get("rentalPrice"), "precio de alquiler");
  const salePriceRaw = String(formData.get("salePrice") ?? "").trim();
  const salePriceCents = salePriceRaw
    ? parsePriceToCents(salePriceRaw, "precio de venta")
    : null;
  const imageFileRaw = formData.get("image");
  const imageFile = imageFileRaw instanceof File && imageFileRaw.size > 0
    ? imageFileRaw
    : null;

  const uploadedImageUrl = imageFile
    ? await uploadDressImageToCloudinary(dressId, imageFile)
    : null;

  await prisma.dress.update({
    where: { id: dressId },
    data: {
      modelName,
      brand: brandRaw || null,
      color,
      size,
      description: descriptionRaw || null,
      rentalPriceCents,
      salePriceCents,
      imageUrl: uploadedImageUrl ?? undefined,
    },
  });

  revalidatePath("/admin/inventario");
  revalidatePath(`/admin/inventario/${dressId}`);
  redirect(`/admin/inventario/${dressId}?updated=1`);
}

export async function deactivateDressAction(dressId: string) {
  await ensureSession();

  await prisma.dress.update({
    where: { id: dressId },
    data: { isActive: false },
  });

  revalidatePath("/admin/inventario");
  redirect("/admin/inventario?deactivated=1");
}

export async function createUnitAction(dressId: string, formData: FormData) {
  await ensureSession();

  const inventoryCode = String(formData.get("inventoryCode") ?? "").trim().toUpperCase();
  const statusRaw = String(formData.get("status") ?? "AVAILABLE").trim().toUpperCase();
  const conditionNotesRaw = String(formData.get("conditionNotes") ?? "").trim();

  if (!inventoryCode) {
    throw new Error("El codigo de inventario es obligatorio.");
  }

  if (!ALLOWED_UNIT_STATUSES.includes(statusRaw as UnitStatus)) {
    throw new Error("Estado de unidad invalido.");
  }

  await prisma.dressUnit.create({
    data: {
      dressId,
      inventoryCode,
      status: statusRaw as UnitStatus,
      conditionNotes: conditionNotesRaw || null,
    },
  });

  revalidatePath("/admin/inventario");
  revalidatePath(`/admin/inventario/${dressId}`);
  redirect(`/admin/inventario/${dressId}?unitCreated=1`);
}

export async function updateUnitStatusAction(dressId: string, unitId: string, formData: FormData) {
  await ensureSession();

  const statusRaw = String(formData.get("status") ?? "AVAILABLE").trim().toUpperCase();
  const conditionNotesRaw = String(formData.get("conditionNotes") ?? "").trim();

  if (!ALLOWED_UNIT_STATUSES.includes(statusRaw as UnitStatus)) {
    throw new Error("Estado de unidad invalido.");
  }

  await prisma.dressUnit.update({
    where: { id: unitId },
    data: {
      status: statusRaw as UnitStatus,
      conditionNotes: conditionNotesRaw || null,
    },
  });

  revalidatePath("/admin/inventario");
  revalidatePath(`/admin/inventario/${dressId}`);
  redirect(`/admin/inventario/${dressId}?unitUpdated=1`);
}

export async function deactivateUnitAction(dressId: string, unitId: string) {
  await ensureSession();

  await prisma.dressUnit.update({
    where: { id: unitId },
    data: {
      isActive: false,
      status: "RETIRED",
    },
  });

  revalidatePath("/admin/inventario");
  revalidatePath(`/admin/inventario/${dressId}`);
  redirect(`/admin/inventario/${dressId}?unitDeactivated=1`);
}
