"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

/** How long the video takes to fade to black once it ends (or is skipped). */
const FADE_TO_BLACK_MS = 300;
/** How long to hold on solid black before revealing the vault underneath. */
const HOLD_BLACK_MS = 400;
/** How long the black curtain takes to fade away and reveal the vault. */
const REVEAL_MS = 500;

type Phase = "playing" | "toBlack" | "revealing";

export function MarksmenIntroOverlay({ src }: { src: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [phase, setPhase] = useState<Phase>("playing");
  const [mounted, setMounted] = useState(true);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.play().catch(() => {
      // Autoplay with sound was blocked — muted autoplay is always allowed.
      video.muted = true;
      video.play().catch(() => {});
    });
  }, []);

  function finish() {
    if (phase !== "playing") return;
    setPhase("toBlack");
    // Drop the ?intro=1 param so a refresh or back-navigation doesn't replay it.
    router.replace(pathname);
    setTimeout(() => {
      setPhase("revealing");
      setTimeout(() => setMounted(false), REVEAL_MS);
    }, FADE_TO_BLACK_MS + HOLD_BLACK_MS);
  }

  if (!mounted) return null;

  return (
    <div
      aria-hidden={phase !== "playing"}
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-black transition-opacity ${
        phase === "revealing" ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
      style={{ transitionDuration: `${REVEAL_MS}ms` }}
    >
      <video
        ref={videoRef}
        src={src}
        playsInline
        onEnded={finish}
        className="h-full w-full object-contain transition-opacity"
        style={{
          transitionDuration: `${FADE_TO_BLACK_MS}ms`,
          opacity: phase === "playing" ? 1 : 0,
        }}
      />
      {phase === "playing" && (
        <button
          type="button"
          onClick={finish}
          className="focus-brand absolute bottom-6 right-6 rounded-full bg-paper/15 px-4 py-2 text-label text-paper backdrop-blur transition hover:bg-paper/25"
        >
          Skip
        </button>
      )}
    </div>
  );
}
