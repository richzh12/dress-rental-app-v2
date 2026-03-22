import { v2 as cloudinary } from "cloudinary";

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

function ensureCloudinaryConfig() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Faltan variables de Cloudinary en el entorno.");
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });

  return process.env.CLOUDINARY_UPLOAD_FOLDER ?? "dress-rental-app/dresses";
}

export async function uploadDressImageToCloudinary(dressId: string, imageFile: File) {
  if (!imageFile.type.startsWith("image/")) {
    throw new Error("El archivo debe ser una imagen valida.");
  }

  if (imageFile.size > MAX_IMAGE_BYTES) {
    throw new Error("La imagen excede el maximo permitido de 8MB.");
  }

  const folder = ensureCloudinaryConfig();
  const imageBuffer = Buffer.from(await imageFile.arrayBuffer());
  const dataUri = `data:${imageFile.type};base64,${imageBuffer.toString("base64")}`;

  try {
    const uploaded = await cloudinary.uploader.upload(dataUri, {
      folder,
      public_id: dressId,
      overwrite: true,
      invalidate: true,
      resource_type: "image",
    });

    return uploaded.secure_url;
  } catch (error) {
    const maybeCloudinary = error as { error?: { message?: string; http_code?: number } };
    const message = maybeCloudinary.error?.message ?? "No se pudo subir la imagen a Cloudinary.";
    const httpCode = maybeCloudinary.error?.http_code;
    throw new Error(httpCode ? `Cloudinary (${httpCode}): ${message}` : `Cloudinary: ${message}`);
  }
}

export async function deleteDressImageFromCloudinary(dressId: string) {
  const folder = ensureCloudinaryConfig();

  try {
    const result = await cloudinary.uploader.destroy(`${folder}/${dressId}`, {
      invalidate: true,
      resource_type: "image",
    });

    return result.result === "ok" || result.result === "not found";
  } catch (error) {
    const maybeCloudinary = error as { error?: { message?: string; http_code?: number } };
    const message = maybeCloudinary.error?.message ?? "No se pudo eliminar la imagen en Cloudinary.";
    const httpCode = maybeCloudinary.error?.http_code;
    throw new Error(httpCode ? `Cloudinary (${httpCode}): ${message}` : `Cloudinary: ${message}`);
  }
}