"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

/** How long to hold on solid black once the video (which fades to black itself) ends. */
const HOLD_BLACK_MS = 300;
/** How long the black curtain takes to fade away, revealing the site at its natural opacity. */
const REVEAL_MS = 700;

export function MarksmenIntroOverlay({ src }: { src: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [revealing, setRevealing] = useState(false);
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

  function handleEnded() {
    // Drop the ?intro=1 param so a refresh or back-navigation doesn't replay it.
    router.replace(pathname);
    setTimeout(() => {
      setRevealing(true);
      setTimeout(() => setMounted(false), REVEAL_MS);
    }, HOLD_BLACK_MS);
  }

  if (!mounted) return null;

  return (
    <div
      aria-hidden={revealing}
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-black transition-opacity ${
        revealing ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
      style={{ transitionDuration: `${REVEAL_MS}ms` }}
    >
      <video ref={videoRef} src={src} playsInline onEnded={handleEnded} className="h-full w-full object-contain" />
    </div>
  );
}
