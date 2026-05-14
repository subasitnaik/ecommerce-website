import { v2 as cloudinary } from "cloudinary";

export function isCloudinaryConfigured(): boolean {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
  );
}

/**
 * Upload a raw image buffer to Cloudinary. Returns the HTTPS delivery URL to store in the DB.
 */
export async function uploadImageBuffer(
  buffer: Buffer,
  mime: string
): Promise<{ secure_url: string }> {
  if (!isCloudinaryConfigured()) {
    throw new Error("Cloudinary is not configured");
  }
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
    api_key: process.env.CLOUDINARY_API_KEY!,
    api_secret: process.env.CLOUDINARY_API_SECRET!,
  });
  const folder = process.env.CLOUDINARY_FOLDER || "ecommerce";
  const dataUri = `data:${mime};base64,${buffer.toString("base64")}`;
  return cloudinary.uploader.upload(dataUri, {
    folder,
    resource_type: "image",
  });
}
