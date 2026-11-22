import { readJson, writeJson } from "@/lib/site-layout";
import type { Background, Hover } from "@/components/site/layout-types";

/** One client's vault page look, edited in Admin → client → "Client view & customize". */
export type VaultLook = {
  eyebrow?: string;
  intro?: string;
  bg?: Background;
  color1?: string;
  color2?: string;
  angle?: number;
  grain?: boolean;
  hover?: Hover;
};

const HEX = /^#[0-9a-f]{6}$/i;
const key = (slug: string) => `vault-look:${slug}`;

export function parseVaultLook(v: unknown): VaultLook {
  if (!v || typeof v !== "object") return {};
  const o = v as Record<string, unknown>;
  const look: VaultLook = {};
  if (typeof o.eyebrow === "string") look.eyebrow = o.eyebrow.slice(0, 120);
  if (typeof o.intro === "string") look.intro = o.intro.slice(0, 1500);
  if (typeof o.bg === "string" && ["page", "light", "dark", "color", "gradient"].includes(o.bg)) look.bg = o.bg as Background;
  if (typeof o.color1 === "string" && HEX.test(o.color1)) look.color1 = o.color1;
  if (typeof o.color2 === "string" && HEX.test(o.color2)) look.color2 = o.color2;
  if (typeof o.angle === "number" && o.angle >= 0 && o.angle <= 360) look.angle = Math.round(o.angle);
  if (typeof o.grain === "boolean") look.grain = o.grain;
  if (typeof o.hover === "string" && ["none", "zoom", "tilt", "lift"].includes(o.hover)) look.hover = o.hover as Hover;
  return look;
}

/** Soft-fails to an empty look, so a vault always loads. */
export async function getVaultLook(slug: string): Promise<VaultLook> {
  try {
    return parseVaultLook(await readJson(key(slug)));
  } catch {
    return {};
  }
}

export async function saveVaultLook(slug: string, look: VaultLook): Promise<void> {
  await writeJson(key(slug), look);
}
