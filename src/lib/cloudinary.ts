import { v2 as cloudinary } from "cloudinary";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} must be set. See .env.example.`);
  return value;
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export { cloudinary };

/**
 * Signs a Cloudinary upload so the browser can upload a file directly to
 * Cloudinary (bypassing our own server entirely for the file bytes — large
 * video files would otherwise hit Vercel's serverless request-size limit).
 * Only the small signature request touches our server.
 */
export function createUploadSignature(paramsToSign: Record<string, string | number>) {
  const timestamp = Math.round(Date.now() / 1000);
  const signature = cloudinary.utils.api_sign_request(
    { ...paramsToSign, timestamp },
    requireEnv("CLOUDINARY_API_SECRET")
  );
  return {
    timestamp,
    signature,
    apiKey: requireEnv("CLOUDINARY_API_KEY"),
    cloudName: requireEnv("CLOUDINARY_CLOUD_NAME"),
  };
}

/** A JPG poster frame for a video, generated on the fly by Cloudinary from its public ID. */
export function getVideoThumbnailUrl(publicId: string): string {
  return `https://res.cloudinary.com/${requireEnv("CLOUDINARY_CLOUD_NAME")}/video/upload/${publicId}.jpg`;
}

/** Deletes an asset from Cloudinary by its public ID. */
export async function deleteCloudinaryAsset(publicId: string, resourceType: "image" | "video") {
  await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
}
