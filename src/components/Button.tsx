import Link from "next/link";
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary";

const base =
  "focus-brand inline-flex items-center justify-center gap-2 rounded-full px-7 py-3.5 text-xs font-bold uppercase tracking-[0.15em] transition-colors duration-300 ease-out disabled:opacity-50 disabled:cursor-not-allowed";

// Velvet buttons: gold pill that turns burgundy on hover; secondary is an
// outline that picks up the accent.
const variants: Record<Variant, string> = {
  primary: "bg-spark text-[#160b0d] hover:bg-accent hover:text-white",
  secondary: "border border-ink/30 text-ink hover:border-accent-bright hover:text-accent-bright",
};

export function LinkButton({
  href,
  variant = "primary",
  className = "",
  children,
}: {
  href: string;
  variant?: Variant;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className={`${base} ${variants[variant]} ${className}`}>
      {children}
    </Link>
  );
}

export function Button({
  variant = "primary",
  className = "",
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}
