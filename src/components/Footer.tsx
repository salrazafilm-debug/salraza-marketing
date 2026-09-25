import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-espresso px-4 py-16 sm:px-6">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-10">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <p className="text-headline text-golden-hour">Salraza Marketing</p>
          <p className="max-w-md text-body text-golden-hour/90">
            We are all family in this world — let&apos;s all grow together.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-8 border-t border-white/10 pt-8 text-label text-golden-hour sm:grid-cols-4">
          <div className="flex flex-col gap-3">
            <span className="text-caption uppercase tracking-wide text-golden-hour/60">Site</span>
            <Link href="/#services" className="focus-brand hover:text-highlighter">
              Services
            </Link>
            <Link href="/#about" className="focus-brand hover:text-highlighter">
              About
            </Link>
            <Link href="/portfolio" className="focus-brand hover:text-highlighter">
              Gallery
            </Link>
          </div>
          <div className="flex flex-col gap-3">
            <span className="text-caption uppercase tracking-wide text-golden-hour/60">
              Family
            </span>
            <Link href="/clients" className="focus-brand hover:text-highlighter">
              Family work
            </Link>
            <Link href="/#quote" className="focus-brand hover:text-highlighter">
              Get a quote
            </Link>
          </div>
          <div className="col-span-2 flex flex-col gap-3 sm:col-span-2">
            <span className="text-caption uppercase tracking-wide text-golden-hour/60">
              Reach us
            </span>
            <a
              href="mailto:salraza.film@gmail.com"
              className="focus-brand break-all hover:text-highlighter"
            >
              salraza.film@gmail.com
            </a>
          </div>
        </div>

        <p className="text-caption text-golden-hour/50">
          © {new Date().getFullYear()} Salraza Marketing. You&apos;re family here.
        </p>
      </div>
    </footer>
  );
}
