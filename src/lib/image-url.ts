/**
 * Returns a display-sized version of an image URL. Cloudinary images get an
 * on-the-fly resize + modern format (so a big upload never slows the site);
 * other URLs are returned as they are.
 */
export function displayUrl(url: string, width = 900): string {
  if (!url.includes("res.cloudinary.com") || !url.includes("/upload/")) return url;
  if (/\/upload\/[^/]*(w_|f_auto|q_auto)/.test(url)) return url; // already transformed
  return url.replace("/upload/", `/upload/f_auto,q_auto,c_limit,w_${width}/`);
}
