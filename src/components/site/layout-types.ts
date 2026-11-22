// The homepage is a list of sections. Each section has a type (which design
// it uses), an id, an optional "hidden" flag, its editable words, its style
// (background, height, animation…), which images it shows, and where any
// moved/resized elements sit. Plus one site-wide colour theme. The admin
// editor changes this document; the homepage renders it. Shared by server and
// client, so no "use client" here.

import { PHOTOS } from "@/components/cinema/photos";

export type SectionType =
  | "hero"
  | "statement"
  | "showcases"
  | "about"
  | "gallery"
  | "vault"
  | "quote"
  | "textBlock"
  | "banner"
  | "imageText"
  | "testimonials"
  | "faq"
  | "video"
  | "blank";

export type Background = "page" | "light" | "dark" | "color" | "gradient";
export type Height = "flat" | "tight" | "normal" | "roomy" | "screen";
export type Entrance = "rise" | "fade" | "zoom" | "slide" | "none";
export type Hover = "none" | "zoom" | "tilt" | "lift";

export type SectionStyle = {
  bg?: Background;
  color1?: string;
  color2?: string;
  angle?: number;
  grain?: boolean;
  height?: Height;
  /** Exact section height in px (overrides the content's natural height). */
  fixedH?: number;
  /** With an exact height: let content spill outside instead of cropping it. */
  spill?: boolean;
  entrance?: Entrance;
  hover?: Hover;
};

/** Desktop-only nudge for one built-in piece: offset in px, a size multiplier,
 * a layer (z) and whether it has been removed from the page. */
export type Placement = { x: number; y: number; scale: number; z?: number; hidden?: boolean };

export type ElKind = "text" | "image" | "button" | "shape";

/** A free element added on top of a section's canvas. Everything scales with
 * the section's width, like a picture: x and w are % of the width; y and h are
 * in units of 1/1000 of the width (y 100 = 10% of the width down from the top). */
export type El = {
  id: string;
  kind: ElKind;
  x: number;
  y: number;
  w: number;
  h?: number;
  /** Layer: 1-2 sit behind the section's content, 4+ in front of it. */
  z: number;
  text?: string;
  src?: string;
  href?: string;
  /** Font size in percent of the section width (cqw). */
  size?: number;
  weight?: 400 | 700 | 900;
  color?: string;
  align?: "left" | "center" | "right";
  font?: "display" | "sans" | "script";
  upper?: boolean;
  fill?: string;
  radius?: number;
  opacity?: number;
  rotate?: number;
  fit?: "cover" | "contain";
  on?: "all" | "desktop" | "phone";
};

export type Section = {
  id: string;
  type: SectionType;
  hidden?: boolean;
  text: Record<string, string>;
  style?: SectionStyle;
  /** Chosen image URLs per slot (e.g. hero "strip"). Missing = defaults. */
  images?: Record<string, string[]>;
  /** Moved / resized / layered / removed built-in pieces, keyed by piece id. */
  place?: Record<string, Placement>;
  /** Free elements added on top of the section. */
  els?: El[];
};

export type Theme = { preset?: string; accent?: string; accentBright?: string; spark?: string };

export type HomeLayout = { version: 1; sections: Section[]; theme?: Theme };

export type SlotDef = { label: string; max: number; defaults: string[] };

type LibraryEntry = {
  label: string;
  description: string;
  /** Only one of these may exist on the page. */
  single: boolean;
  defaults: Record<string, string>;
  style?: SectionStyle;
  slots?: Record<string, SlotDef>;
};

const THUMBS = PHOTOS.map((p) => p.thumb);

export const THEME_PRESETS: { id: string; label: string; accent: string; accentBright: string; spark: string }[] = [
  { id: "velvet", label: "Velvet", accent: "#8e1b3a", accentBright: "#c23a5c", spark: "#f5c84c" },
  { id: "golden", label: "Golden Hour", accent: "#7a2fc0", accentBright: "#c164fc", spark: "#fee329" },
  { id: "dusk", label: "Dusk", accent: "#6b1a4a", accentBright: "#d0567e", spark: "#f1a95f" },
  { id: "ocean", label: "Ocean", accent: "#0a4d68", accentBright: "#2fa4c4", spark: "#f5c84c" },
  { id: "forest", label: "Forest", accent: "#2f5d3a", accentBright: "#5fa36f", spark: "#e9c46a" },
  { id: "mono", label: "Mono", accent: "#2a2a2a", accentBright: "#6b6b6b", spark: "#d9a521" },
];

export const SECTION_LIBRARY: Record<SectionType, LibraryEntry> = {
  hero: {
    label: "Hero",
    description: "Big SALRAZA title, scribbles and the photo strip.",
    single: true,
    defaults: {
      title: "SALRAZA",
      tagline: "Social media, photography & websites.",
      spark: "The sky is the limit.",
      cta1: "Start a project",
      cta2: "See the work",
    },
    slots: { strip: { label: "Photo strip", max: 14, defaults: THUMBS } },
  },
  statement: {
    label: "Statement",
    description: "One big sentence in three colours.",
    single: false,
    defaults: {
      eyebrow: "Bruce & Elena",
      part1: "We frame",
      part2: "your story like it belongs",
      part3: "on the big screen",
    },
    style: { bg: "dark", grain: true },
  },
  showcases: {
    label: "What we do",
    description: "The four service showcases.",
    single: true,
    defaults: {
      eyebrow: "What we do",
      title: "Four ways we make you shine",
      s1title: "Website creation",
      s1line: "Sites that show off your name and work — and make it easy to book you.",
      s2title: "Photography",
      s2line: "Moments frozen in time: events, teams, products and people.",
      s3title: "Branding",
      s3line: "Logos, posters and a look people remember anywhere they see it.",
      s4title: "Social media",
      s4line: "Content your audience follows, loves and shares — and growth you can see.",
      statsLabel: "Audience growth",
      n1value: "+312%",
      n1label: "Reach growth",
      n2value: "1.4M",
      n2label: "Video views",
      n3value: "+8.2K",
      n3label: "New followers",
    },
    slots: {
      site: { label: "Website mock-up", max: 4, defaults: THUMBS.slice(0, 4) },
      photos: { label: "Photography", max: 8, defaults: THUMBS.slice(0, 8) },
      brand: { label: "Branding", max: 3, defaults: [THUMBS[4], THUMBS[6], THUMBS[7]] },
    },
  },
  about: {
    label: "About us",
    description: "Bruce & Elena with signatures.",
    single: true,
    defaults: {
      eyebrow: "About us",
      title: "Bruce & Elena",
      body:
        "We love camera work — it's our passion and we love helping people. That is our brand. We want to share our skills and talents to help everyone with a want to grow their business — in the end we are all family in this infinite universe.",
    },
  },
  gallery: {
    label: "Gallery",
    description: "Recent work from the portfolio.",
    single: true,
    defaults: { eyebrow: "Gallery", title: "Recent work", link: "Full portfolio →" },
  },
  vault: {
    label: "Media Vault",
    description: "Invite clients into their private vault.",
    single: true,
    defaults: {
      eyebrow: "For our clients",
      title: "The",
      titleSpark: "Media Vault",
      body:
        "Every family gets a private safe deposit for finished galleries, edits, clips, photos and videos. Type your password to step inside.",
      cta: "Open your vault",
    },
  },
  quote: {
    label: "Quote form",
    description: "The contact / quote request form.",
    single: true,
    defaults: { eyebrow: "Get started", title: "Let's build together", body: "Picture the win, we'll get you there." },
  },
  textBlock: {
    label: "Text block",
    description: "A heading with a paragraph.",
    single: false,
    defaults: { eyebrow: "New section", title: "Your heading here", body: "Write anything here — click to edit." },
  },
  banner: {
    label: "Quote banner",
    description: "A large centred quote with a small caption.",
    single: false,
    defaults: { quote: "“They made us feel like family.”", caption: "— A happy client" },
  },
  imageText: {
    label: "Image + text",
    description: "A photo beside a heading, paragraph and button.",
    single: false,
    defaults: {
      eyebrow: "Featured",
      title: "Tell this story",
      body: "Add a few lines about this project, client or idea.",
      cta: "Get in touch",
    },
    slots: { main: { label: "Photo", max: 1, defaults: [THUMBS[3]] } },
  },
  testimonials: {
    label: "Testimonials",
    description: "Three client quotes.",
    single: false,
    defaults: {
      eyebrow: "Kind words",
      title: "What our families say",
      q1: "They captured our day perfectly.",
      a1: "— Client name",
      q2: "Our page grew faster than we imagined.",
      a2: "— Client name",
      q3: "Professional, creative and so easy to work with.",
      a3: "— Client name",
    },
    style: { bg: "dark", grain: true },
  },
  faq: {
    label: "Questions",
    description: "Four questions with answers that open and close.",
    single: false,
    defaults: {
      eyebrow: "Questions",
      title: "Good to know",
      fq1: "How do we get started?",
      fa1: "Fill in the form below and we'll get back to you within a day.",
      fq2: "Where are you based?",
      fa2: "We work locally and travel for shoots.",
      fq3: "How do I receive my photos?",
      fa3: "Everything arrives in your private Media Vault.",
      fq4: "Do you manage social accounts monthly?",
      fa4: "Yes — ask us about monthly packages.",
    },
  },
  blank: {
    label: "Blank canvas",
    description: "An empty section: set its height and fill it with your own text, images, buttons and shapes.",
    single: false,
    defaults: {},
    style: { fixedH: 320 },
  },
  video: {
    label: "Video",
    description: "A YouTube or Vimeo video with a heading.",
    single: false,
    defaults: { eyebrow: "Watch", title: "Behind the scenes", url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
  },
};

const ALL_TYPES = Object.keys(SECTION_LIBRARY) as SectionType[];

export const DEFAULT_LAYOUT: HomeLayout = {
  version: 1,
  sections: (["hero", "statement", "showcases", "about", "gallery", "vault", "quote"] as SectionType[]).map(
    (type) => ({ id: type, type, text: {} })
  ),
};

/** The section's style, with the design's own defaults filled in. */
export function styleOf(s: Section): SectionStyle {
  return { ...(SECTION_LIBRARY[s.type].style ?? {}), ...(s.style ?? {}) };
}

/** Images for one slot, or the defaults. */
export function imagesOf(s: Section, slot: string): string[] {
  const chosen = s.images?.[slot];
  if (chosen && chosen.length) return chosen;
  return SECTION_LIBRARY[s.type].slots?.[slot]?.defaults ?? [];
}

/* ---------- validation of untrusted JSON (database or save request) ---------- */

const HEX = /^#[0-9a-f]{6}$/i;
const pick = <T extends string>(v: unknown, allowed: readonly T[]): T | undefined =>
  typeof v === "string" && (allowed as readonly string[]).includes(v) ? (v as T) : undefined;
const safeUrl = (v: unknown) =>
  typeof v === "string" && v.length < 600 && (v.startsWith("/") || v.startsWith("https://")) ? v : null;

function parseStyle(v: unknown): SectionStyle | undefined {
  if (!v || typeof v !== "object") return undefined;
  const o = v as Record<string, unknown>;
  const st: SectionStyle = {
    bg: pick(o.bg, ["page", "light", "dark", "color", "gradient"] as const),
    color1: typeof o.color1 === "string" && HEX.test(o.color1) ? o.color1 : undefined,
    color2: typeof o.color2 === "string" && HEX.test(o.color2) ? o.color2 : undefined,
    angle: typeof o.angle === "number" && o.angle >= 0 && o.angle <= 360 ? Math.round(o.angle) : undefined,
    grain: typeof o.grain === "boolean" ? o.grain : undefined,
    height: pick(o.height, ["flat", "tight", "normal", "roomy", "screen"] as const),
    fixedH: typeof o.fixedH === "number" && o.fixedH >= 16 && o.fixedH <= 3000 ? Math.round(o.fixedH) : undefined,
    spill: typeof o.spill === "boolean" ? o.spill : undefined,
    entrance: pick(o.entrance, ["rise", "fade", "zoom", "slide", "none"] as const),
    hover: pick(o.hover, ["none", "zoom", "tilt", "lift"] as const),
  };
  for (const k of Object.keys(st) as (keyof SectionStyle)[]) if (st[k] === undefined) delete st[k];
  return Object.keys(st).length ? st : undefined;
}

function parseTheme(v: unknown): Theme | undefined {
  if (!v || typeof v !== "object") return undefined;
  const o = v as Record<string, unknown>;
  const t: Theme = {};
  if (typeof o.preset === "string" && o.preset.length < 30) t.preset = o.preset;
  for (const k of ["accent", "accentBright", "spark"] as const) {
    if (typeof o[k] === "string" && HEX.test(o[k] as string)) t[k] = o[k] as string;
  }
  return Object.keys(t).length ? t : undefined;
}

const num = (v: unknown, min: number, max: number): number | undefined =>
  typeof v === "number" && Number.isFinite(v) ? Math.max(min, Math.min(max, Math.round(v * 100) / 100)) : undefined;
const safeHref = (v: unknown) =>
  typeof v === "string" && v.length < 400 && (v.startsWith("/") || v.startsWith("#") || v.startsWith("https://") || v.startsWith("mailto:"))
    ? v
    : undefined;

function parseEl(v: unknown): El | null {
  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  if (typeof o.id !== "string" || !/^[a-z0-9-]{1,30}$/i.test(o.id)) return null;
  const kind = pick(o.kind, ["text", "image", "button", "shape"] as const);
  if (!kind) return null;
  const x = num(o.x, -50, 150);
  const y = num(o.y, -1500, 5000);
  const w = num(o.w, 2, 200);
  if (x === undefined || y === undefined || w === undefined) return null;
  const el: El = { id: o.id, kind, x, y, w, z: Math.round(num(o.z, 1, 99) ?? 10) };
  const h = num(o.h, 8, 3000);
  if (h !== undefined) el.h = h;
  if (typeof o.text === "string") el.text = o.text.slice(0, 2000);
  const src = safeUrl(o.src);
  if (src) el.src = src;
  const href = safeHref(o.href);
  if (href) el.href = href;
  const size = num(o.size, 0.6, 40);
  if (size !== undefined) el.size = size;
  const weight = o.weight === 400 || o.weight === 700 || o.weight === 900 ? o.weight : undefined;
  if (weight) el.weight = weight;
  if (typeof o.color === "string" && HEX.test(o.color)) el.color = o.color;
  if (typeof o.fill === "string" && HEX.test(o.fill)) el.fill = o.fill;
  const align = pick(o.align, ["left", "center", "right"] as const);
  if (align) el.align = align;
  const font = pick(o.font, ["display", "sans", "script"] as const);
  if (font) el.font = font;
  if (typeof o.upper === "boolean") el.upper = o.upper;
  const radius = num(o.radius, 0, 200);
  if (radius !== undefined) el.radius = radius;
  const opacity = num(o.opacity, 0, 1);
  if (opacity !== undefined) el.opacity = opacity;
  const rotate = num(o.rotate, -180, 180);
  if (rotate !== undefined) el.rotate = rotate;
  const fit = pick(o.fit, ["cover", "contain"] as const);
  if (fit) el.fit = fit;
  const on = pick(o.on, ["all", "desktop", "phone"] as const);
  if (on) el.on = on;
  return el;
}

export function parseLayout(value: unknown): HomeLayout | null {
  if (!value || typeof value !== "object") return null;
  const raw = (value as { sections?: unknown }).sections;
  if (!Array.isArray(raw) || raw.length > 60) return null;
  const sections: Section[] = [];
  const ids = new Set<string>();
  for (const s of raw) {
    if (!s || typeof s !== "object") return null;
    const { id, type, hidden, text, style, images, place, els } = s as Record<string, unknown>;
    if (typeof id !== "string" || !/^[a-z0-9-]{1,40}$/i.test(id) || ids.has(id)) return null;
    if (typeof type !== "string" || !ALL_TYPES.includes(type as SectionType)) return null;
    const lib = SECTION_LIBRARY[type as SectionType];

    const cleanText: Record<string, string> = {};
    if (text && typeof text === "object") {
      for (const [k, v] of Object.entries(text as Record<string, unknown>)) {
        if (k in lib.defaults && typeof v === "string") cleanText[k] = v.slice(0, 2000);
      }
    }

    const cleanImages: Record<string, string[]> = {};
    if (images && typeof images === "object" && lib.slots) {
      for (const [slot, list] of Object.entries(images as Record<string, unknown>)) {
        const def = lib.slots[slot];
        if (!def || !Array.isArray(list)) continue;
        const urls = list.map(safeUrl).filter((u): u is string => !!u).slice(0, def.max);
        if (urls.length) cleanImages[slot] = urls;
      }
    }

    const cleanPlace: Record<string, Placement> = {};
    if (place && typeof place === "object") {
      for (const [el, p] of Object.entries(place as Record<string, unknown>)) {
        if (!/^[a-z0-9-]{1,30}$/i.test(el) || !p || typeof p !== "object") continue;
        const { x, y, scale, z, hidden: gone } = p as Record<string, unknown>;
        const px = typeof x === "number" ? x : 0;
        const py = typeof y === "number" ? y : 0;
        const ps = typeof scale === "number" ? scale : 1;
        const place: Placement = {
          x: Math.max(-1200, Math.min(1200, Math.round(px))),
          y: Math.max(-1200, Math.min(1200, Math.round(py))),
          scale: Math.max(0.3, Math.min(3, Math.round(ps * 100) / 100)),
        };
        if (typeof z === "number") place.z = Math.max(1, Math.min(99, Math.round(z)));
        if (gone === true) place.hidden = true;
        cleanPlace[el] = place;
      }
    }

    ids.add(id);
    const sec: Section = { id, type: type as SectionType, hidden: hidden === true, text: cleanText };
    const st = parseStyle(style);
    if (st) sec.style = st;
    if (Object.keys(cleanImages).length) sec.images = cleanImages;
    if (Object.keys(cleanPlace).length) sec.place = cleanPlace;
    if (Array.isArray(els)) {
      const seen = new Set<string>();
      const list: El[] = [];
      for (const raw of els.slice(0, 80)) {
        const el = parseEl(raw);
        if (el && !seen.has(el.id)) {
          seen.add(el.id);
          list.push(el);
        }
      }
      if (list.length) sec.els = list;
    }
    sections.push(sec);
  }
  const theme = parseTheme((value as { theme?: unknown }).theme);
  return theme ? { version: 1, sections, theme } : { version: 1, sections };
}
