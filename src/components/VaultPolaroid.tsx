/**
 * A taped-down Polaroid-style photo frame for the scrapbook Media Vault
 * login page. The frame, tape, rotation and the caption's handwritten
 * styling are fixed design; `src` and `caption` are the only dynamic parts,
 * editable from the admin dashboard. When `src` is missing, a neutral
 * placeholder fills the frame instead of a broken image.
 */
export function VaultPolaroid({
  src,
  alt,
  caption,
  rotate = 0,
  tapeSide = "top",
  className = "",
}: {
  src?: string;
  alt: string;
  caption?: string;
  rotate?: number;
  tapeSide?: "top" | "top-left" | "top-right";
  className?: string;
}) {
  const tapePosition =
    tapeSide === "top-left"
      ? "left-2 -top-3 -rotate-[18deg]"
      : tapeSide === "top-right"
        ? "right-2 -top-3 rotate-[14deg]"
        : "left-1/2 -top-3 -translate-x-1/2 -rotate-2";

  return (
    <div
      className={`relative flex flex-col rounded-sm bg-white p-2.5 pb-1 shadow-[0_14px_28px_rgba(0,0,0,0.28)] ${className}`}
      style={{ transform: `rotate(${rotate}deg)` }}
    >
      <span className={`tape absolute h-6 w-14 ${tapePosition}`} aria-hidden />
      <div className="flex w-full flex-1 items-center justify-center overflow-hidden bg-paper-raised">
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={alt} className="h-full w-full object-cover" />
        ) : (
          <svg
            width="34"
            height="34"
            viewBox="0 0 26 26"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-warm-text/40"
          >
            <path d="M3 8h4l2-3h8l2 3h4v13H3z" />
            <circle cx="13" cy="14" r="4" />
          </svg>
        )}
      </div>
      <p className="font-script h-5 shrink-0 truncate text-center text-sm leading-5 text-ink/70">
        {caption}
      </p>
    </div>
  );
}
