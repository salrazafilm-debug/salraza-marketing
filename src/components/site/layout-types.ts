// The homepage is a list of sections. Each section has a type (which design
// it uses), an id, an optional "hidden" flag, and its editable words. The
// admin site editor changes this list; the homepage renders it. Shared by the
// server and client, so no "use client" here.

export type SectionType =
  | "hero"
  | "statement"
  | "showcases"
  | "about"
  | "gallery"
  | "vault"
  | "quote"
  | "textBlock"
  | "banner";

export type Section = {
  id: string;
  type: SectionType;
  hidden?: boolean;
  text: Record<string, string>;
};

export type HomeLayout = { version: 1; sections: Section[] };

type LibraryEntry = {
  label: string;
  description: string;
  /** Only one of these may exist on the page. */
  single: boolean;
  defaults: Record<string, string>;
};

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
  },
  statement: {
    label: "Statement",
    description: "One big glowing sentence.",
    single: false,
    defaults: {
      eyebrow: "Bruce & Elena",
      part1: "We frame",
      part2: "your story like it belongs",
      part3: "on the big screen",
    },
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
    description: "A heading with a paragraph. Add as many as you like.",
    single: false,
    defaults: {
      eyebrow: "New section",
      title: "Your heading here",
      body: "Write anything here — click to edit.",
    },
  },
  banner: {
    label: "Quote banner",
    description: "A large centred quote with a small caption.",
    single: false,
    defaults: { quote: "“They made us feel like family.”", caption: "— A happy client" },
  },
};

export const DEFAULT_LAYOUT: HomeLayout = {
  version: 1,
  sections: (["hero", "statement", "showcases", "about", "gallery", "vault", "quote"] as SectionType[]).map(
    (type) => ({ id: type, type, text: {} })
  ),
};

/** Checks untrusted JSON (from the database or a save request). */
export function parseLayout(value: unknown): HomeLayout | null {
  if (!value || typeof value !== "object") return null;
  const raw = (value as { sections?: unknown }).sections;
  if (!Array.isArray(raw) || raw.length > 60) return null;
  const sections: Section[] = [];
  const ids = new Set<string>();
  for (const s of raw) {
    if (!s || typeof s !== "object") return null;
    const { id, type, hidden, text } = s as Record<string, unknown>;
    if (typeof id !== "string" || !/^[a-z0-9-]{1,40}$/i.test(id) || ids.has(id)) return null;
    if (typeof type !== "string" || !(type in SECTION_LIBRARY)) return null;
    const cleanText: Record<string, string> = {};
    if (text && typeof text === "object") {
      for (const [k, v] of Object.entries(text as Record<string, unknown>)) {
        if (k in SECTION_LIBRARY[type as SectionType].defaults && typeof v === "string") {
          cleanText[k] = v.slice(0, 2000);
        }
      }
    }
    ids.add(id);
    sections.push({ id, type: type as SectionType, hidden: hidden === true, text: cleanText });
  }
  return { version: 1, sections };
}
