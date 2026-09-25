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

/**
 * Turns a Cloudinary delivery URL into one that forces a real download
 * (Cloudinary adds a `Content-Disposition: attachment` response header)
 * instead of just opening the file in the browser — the `download`
 * attribute on a plain <a> tag isn't reliable for a cross-origin URL like
 * this on every mobile browser, but this works everywhere since it's the
 * server telling the browser to save it, not client-side JS. `filename`
 * becomes the suggested save-as name (extension is added by Cloudinary
 * from the asset's own format).
 */
export function getDownloadUrl(secureUrl: string, filename?: string): string {
  const safeName = filename
    ?.trim()
    .replace(/[^a-zA-Z0-9-_ ]/g, "")
    .replace(/\s+/g, "-");
  const flag = safeName ? `fl_attachment:${safeName}` : "fl_attachment";
  return secureUrl.replace("/upload/", `/upload/${flag}/`);
}

/** Deletes an asset from Cloudinary by its public ID. */
export async function deleteCloudinaryAsset(publicId: string, resourceType: "image" | "video") {
  await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
}
