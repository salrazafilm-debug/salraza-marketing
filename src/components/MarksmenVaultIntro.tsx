"use client";

import { usePathname, useRouter } from "next/navigation";
import { createContext, useEffect, useRef, useState, type ReactNode } from "react";

/** How long to hold on solid black once the video (which fades to black itself) ends. */
const HOLD_BLACK_MS = 300;
/** How long the black curtain takes to fade away, revealing the site at its natural opacity. */
const REVEAL_MS = 700;

/**
 * Whether the wrapped vault sections should be in their revealed state.
 * Defaults to true so RevealSection is a no-op (instantly visible) for every
 * client except Marksmen, who gets this Provider set to false until the
 * intro video finishes.
 */
export const RevealContext = createContext(true);

export function MarksmenVaultIntro({
  introSrc,
  children,
}: {
  /** Video URL to play first, or null for a normal visit with no intro. */
  introSrc: string | null;
  children: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [overlayVisible, setOverlayVisible] = useState(Boolean(introSrc));
  const [revealed, setRevealed] = useState(!introSrc);

  useEffect(() => {
    const video = videoRef.current;
    if (!introSrc || !video) return;
    // Muted autoplay is the one thing every browser reliably allows —
    // playing with sound here is blocked outright on many mobile browsers
    // since it isn't a direct continuation of the user's tap.
    video.muted = true;
    video.play().catch(() => {});
  }, [introSrc]);

  function handleEnded() {
    // Drop the ?intro=1 param so a refresh or back-navigation doesn't replay it.
    router.replace(pathname);
    setTimeout(() => {
      // Start the curtain fade and the page's own build-in animation together.
      setRevealed(true);
      setTimeout(() => setOverlayVisible(false), REVEAL_MS);
    }, HOLD_BLACK_MS);
  }

  return (
    <RevealContext.Provider value={revealed}>
      {introSrc && overlayVisible && (
        <div
          aria-hidden={revealed}
          className={`fixed inset-0 z-[100] flex items-center justify-center bg-black transition-opacity ${
            revealed ? "pointer-events-none opacity-0" : "opacity-100"
          }`}
          style={{ transitionDuration: `${REVEAL_MS}ms` }}
        >
          <video
            ref={videoRef}
            src={introSrc}
            autoPlay
            muted
            playsInline
            preload="auto"
            onEnded={handleEnded}
            className="h-full w-full object-contain"
          />
        </div>
      )}
      {children}
    </RevealContext.Provider>
  );
}
