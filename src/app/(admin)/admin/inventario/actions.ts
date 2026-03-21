"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { uploadDressImageToCloudinary } from "@/lib/cloudinary";

function parsePriceToCents(raw: FormDataEntryValue | null, fieldName: string) {
  const value = String(raw ?? "").trim().replace(",", ".");
  const numeric = Number.parseFloat(value);

  if (!Number.isFinite(numeric) || numeric < 0) {
    throw new Error(`Valor invalido para ${fieldName}.`);
  }

  return Math.round(numeric * 100);
}

export async function createDressAction(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/login");
  }

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

  const dress = await prisma.dress.create({
    data: {
      modelName,
      brand: brandRaw || null,
      color,
      size,
      description: descriptionRaw || null,
      rentalPriceCents,
      salePriceCents,
    },
  });

  if (imageFile) {
    const secureImageUrl = await uploadDressImageToCloudinary(dress.id, imageFile);
    await prisma.dress.update({
      where: { id: dress.id },
      data: { imageUrl: secureImageUrl },
    });
  }

  revalidatePath("/admin/inventario");
  redirect("/admin/inventario?created=1");
}
