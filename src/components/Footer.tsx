import Link from "next/link";
import { ReplayIntroButton } from "@/components/cinema/ReplayIntroButton";

const LINK = "focus-brand w-fit transition-colors hover:text-spark";

export function Footer() {
  return (
    <footer data-mode="dark" className="vintage band-fade-top relative overflow-hidden bg-paper px-4 pb-24 pt-28 text-ink sm:px-6">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[80%]"
        style={{ background: "radial-gradient(ellipse 70% 60% at 50% 110%, color-mix(in srgb, var(--accent) 45%, transparent), transparent 70%)" }}
      />
      <div className="relative mx-auto flex max-w-[1200px] flex-col gap-14">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <p className="title-lit font-display text-5xl font-black uppercase leading-none sm:text-7xl">Salraza</p>
          <p className="max-w-sm text-base text-ink-muted">
            We are all family on this little rock — floating across the universe together.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-8 border-t border-line pt-10 text-sm text-ink sm:grid-cols-4">
          <div className="flex flex-col gap-3">
            <span className="text-[11px] uppercase tracking-[0.2em] text-warm-text">Site</span>
            <Link href="/#services" className={LINK}>Services</Link>
            <Link href="/#about" className={LINK}>About</Link>
            <Link href="/portfolio" className={LINK}>Gallery</Link>
          </div>
          <div className="flex flex-col gap-3">
            <span className="text-[11px] uppercase tracking-[0.2em] text-warm-text">Family</span>
            <Link href="/clients" className={LINK}>Media Vault</Link>
            <Link href="/#quote" className={LINK}>Get a quote</Link>
          </div>
          <div className="flex flex-col gap-3">
            <span className="text-[11px] uppercase tracking-[0.2em] text-warm-text">Social</span>
            <a href="https://www.instagram.com/salraza.film/" target="_blank" rel="noopener noreferrer" className={LINK}>Instagram</a>
            <a href="https://www.tiktok.com/@salraza.film" target="_blank" rel="noopener noreferrer" className={LINK}>TikTok</a>
          </div>
          <div className="flex flex-col gap-3">
            <span className="text-[11px] uppercase tracking-[0.2em] text-warm-text">Reach us</span>
            <a href="mailto:salraza.film@gmail.com" className={`${LINK} break-all`}>salraza.film@gmail.com</a>
          </div>
        </div>

        <div className="flex flex-col gap-3 text-[11px] uppercase tracking-[0.2em] text-ink-muted sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Salraza Marketing. You&apos;re family here.</p>
          <ReplayIntroButton />
        </div>
      </div>
    </footer>
  );
}
