import { Readable } from "node:stream";
import { ZipArchive } from "archiver";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { findClientBySlug } from "@/lib/clients";
import { SESSION_COOKIE, verifySession } from "@/lib/session";

// archiver needs real Node streams, not the Edge runtime.
export const runtime = "nodejs";
export const maxDuration = 60;

function fileNameFor(label: string, src: string, index: number, taken: Set<string>): string {
  const extMatch = src.match(/\.([a-zA-Z0-9]+)(?:\?|$)/);
  const ext = extMatch ? extMatch[1] : "jpg";
  const base =
    label
      .trim()
      .replace(/[^a-zA-Z0-9-_ ]/g, "")
      .replace(/\s+/g, "-") || `photo-${index + 1}`;

  let name = `${base}.${ext}`;
  let suffix = 1;
  while (taken.has(name)) {
    name = `${base}-${suffix}.${ext}`;
    suffix += 1;
  }
  taken.add(name);
  return name;
}

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const cookieStore = await cookies();
  const sessionSlug = verifySession(cookieStore.get(SESSION_COOKIE)?.value);
  if (sessionSlug !== slug) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const client = await findClientBySlug(slug);
  if (!client) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const photos = client.media.filter((item) => item.type === "image");
  if (photos.length === 0) {
    return NextResponse.json({ error: "No photos to download yet." }, { status: 404 });
  }

  const archive = new ZipArchive({ zlib: { level: 9 } });
  const takenNames = new Set<string>();

  // Not awaited: returning the streaming response immediately, and letting
  // this fill it in the background, is what lets the download start right
  // away instead of making the browser wait for every photo to fetch first.
  (async () => {
    try {
      const buffers = await Promise.all(
        photos.map(async (item) => {
          const res = await fetch(item.src);
          return res.ok ? Buffer.from(await res.arrayBuffer()) : null;
        })
      );
      photos.forEach((item, index) => {
        const buffer = buffers[index];
        if (!buffer) return;
        archive.append(buffer, { name: fileNameFor(item.label, item.src, index, takenNames) });
      });
    } catch {
      // A partial zip (from whatever did get appended before the failure)
      // beats a request that hangs forever with no response.
    } finally {
      archive.finalize();
    }
  })();

  const webStream = Readable.toWeb(archive) as ReadableStream;
  const safeName = client.name.replace(/[^a-zA-Z0-9-_ ]/g, "").replace(/\s+/g, "-") || "photos";

  return new Response(webStream, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${safeName}-photos.zip"`,
    },
  });
}
