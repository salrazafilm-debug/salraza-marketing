"use client";

import { useEffect, useRef, useState } from "react";

// On phones the video is shown with object-fit: contain (full frame,
// letterboxed) because a portrait screen is much taller than this 16:9 clip.
// MOBILE_QUERY gates a scale() zoom that starts tight on the center monitor —
// where the logo lives — and eases down to ZOOM_END (not all the way back to
// 1) as the video plays, so the still end frame stays fuller/less letterboxed
// too instead of popping back out to the bars-heavy full frame. 3.0x/2.4x
// were measured against the source video's pixel bounds for "SALRAZA
// Marketing" (safe up to ~3.8x before the text would clip), so the logo
// stays fully in frame at every point, including at rest.
const MOBILE_QUERY = "(max-width: 767px)";
const ZOOM_START = 3.0;
const ZOOM_END = 2.4;
const ZOOM_ORIGIN_X = 0.5;
const ZOOM_ORIGIN_Y = 0.48;
const ZOOM_ORIGIN = `${ZOOM_ORIGIN_X * 100}% ${ZOOM_ORIGIN_Y * 100}%`;

// The video's frame proportions (the 3834x2160 source is measured in a
// 1916x1080 reference space; only the 16:9 ratio matters) and the desktop
// breakpoint where object-fit switches from contain to cover (matches the
// md: classes below), needed to work out exactly where the baked-in
// "Marketing" word lands on screen.
const VIDEO_NATURAL_WIDTH = 1916;
const VIDEO_NATURAL_HEIGHT = 1080;
const COVER_BREAKPOINT = 768;

// The "Marketing" highlighter-stroke region, measured directly against the
// source frame (770,525,380,87 tight-cropped, padded slightly for a more
// forgiving hover target) and expressed as a fraction of the video frame so
// it stays correct at any render size.
const MARKETING_HOTSPOT = {
  left: 760 / VIDEO_NATURAL_WIDTH,
  top: 516 / VIDEO_NATURAL_HEIGHT,
  width: 400 / VIDEO_NATURAL_WIDTH,
  height: 100 / VIDEO_NATURAL_HEIGHT,
};

type Rect = { left: number; top: number; width: number; height: number };

function easeOutQuad(progress: number) {
  return 1 - (1 - progress) ** 2;
}

/** Replicates CSS object-fit contain/cover math to find where the video's
 * actual pixels land within its container, so the hotspot can be positioned
 * in real screen pixels instead of guessing at percentages of the container. */
function getContentBox(containerWidth: number, containerHeight: number): Rect {
  const videoAspect = VIDEO_NATURAL_WIDTH / VIDEO_NATURAL_HEIGHT;
  const containerAspect = containerWidth / containerHeight;
  const isCover = containerWidth >= COVER_BREAKPOINT;

  // contain fits the frame inside the box (limited by the tighter side);
  // cover fills the box (limited by the looser side).
  const useContainerWidth = isCover
    ? containerAspect > videoAspect
    : containerAspect < videoAspect;

  const width = useContainerWidth ? containerWidth : containerHeight * videoAspect;
  const height = useContainerWidth ? containerWidth / videoAspect : containerHeight;

  return {
    left: (containerWidth - width) / 2,
    top: (containerHeight - height) / 2,
    width,
    height,
  };
}

export function HeroVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const [reducedMotion, setReducedMotion] = useState<boolean | null>(null);
  const [ended, setEnded] = useState(false);
  const [muted, setMuted] = useState(true);
  const [paused, setPaused] = useState(false);
  const [hotspotRect, setHotspotRect] = useState<Rect | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const showStill = reducedMotion || ended;

  // Tell the site header (a separate component, so this can't be passed as a
  // prop) when the intro has settled on its still frame, so it can reveal
  // itself only once the video is done rather than sitting over it — on both
  // mobile and desktop.
  useEffect(() => {
    window.dispatchEvent(new CustomEvent("hero-settled", { detail: showStill }));
  }, [showStill]);

  // Tracks the same breakpoint the zoom animation and getContentBox() use, so
  // the resting poster image can match the video's settled zoom level.
  useEffect(() => {
    const query = window.matchMedia(MOBILE_QUERY);
    setIsMobile(query.matches);
    const onChange = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  // Keep the "Marketing" hover hotspot pixel-aligned with the baked-in logo
  // as the viewport resizes, since object-fit's contain/cover math depends
  // on the container's actual size and aspect ratio. On mobile the resting
  // video/poster also carries a `scale(ZOOM_END)` transform (see below), so
  // the hotspot's corners are projected through the same scale-around-origin
  // math the CSS transform applies, or it'd land in the pre-zoom position.
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const updateHotspot = () => {
      const { width, height } = section.getBoundingClientRect();
      const contentBox = getContentBox(width, height);
      const rawLeft = contentBox.left + MARKETING_HOTSPOT.left * contentBox.width;
      const rawTop = contentBox.top + MARKETING_HOTSPOT.top * contentBox.height;
      const rawWidth = MARKETING_HOTSPOT.width * contentBox.width;
      const rawHeight = MARKETING_HOTSPOT.height * contentBox.height;

      const scale = isMobile && showStill ? ZOOM_END : 1;
      if (scale === 1) {
        setHotspotRect({ left: rawLeft, top: rawTop, width: rawWidth, height: rawHeight });
        return;
      }

      const originX = width * ZOOM_ORIGIN_X;
      const originY = height * ZOOM_ORIGIN_Y;
      const project = (x: number, y: number) => ({
        x: originX + (x - originX) * scale,
        y: originY + (y - originY) * scale,
      });
      const topLeft = project(rawLeft, rawTop);
      const bottomRight = project(rawLeft + rawWidth, rawTop + rawHeight);

      setHotspotRect({
        left: topLeft.x,
        top: topLeft.y,
        width: bottomRight.x - topLeft.x,
        height: bottomRight.y - topLeft.y,
      });
    };

    updateHotspot();
    const observer = new ResizeObserver(updateHotspot);
    observer.observe(section);
    return () => observer.disconnect();
  }, [isMobile, showStill]);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(query.matches);
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (reducedMotion) return;
    const video = videoRef.current;
    if (!video) return;

    let retried = false;

    const attemptPlay = () => {
      video.play().catch(() => {
        // The first attempt can be rejected simply because the video hasn't
        // buffered enough yet (common on mobile with a cold cache, right
        // after a hard refresh) rather than a real autoplay-policy block.
        // Retry once the browser says it's actually ready to play; only
        // fall back to the still end frame if that retry also fails.
        if (retried) {
          setEnded(true);
          return;
        }
        retried = true;
        video.addEventListener("canplay", attemptPlay, { once: true });
      });
    };

    attemptPlay();

    return () => {
      video.removeEventListener("canplay", attemptPlay);
    };
  }, [reducedMotion]);

  // Mobile zoom: scale the video from ZOOM_START down to ZOOM_END in sync
  // with actual playback progress (not a fixed-duration CSS animation) so it
  // stays correct even if playback stalls, is paused, or the intro is
  // replayed. Settles at ZOOM_END (not 1) so the resting frame stays full.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const mql = window.matchMedia(MOBILE_QUERY);

    if (reducedMotion || ended) {
      video.style.transform = mql.matches ? `scale(${ZOOM_END})` : "";
      return;
    }

    let raf: number;

    const tick = () => {
      if (mql.matches && video.duration) {
        const progress = Math.min(1, video.currentTime / video.duration);
        const scale = ZOOM_START + (ZOOM_END - ZOOM_START) * easeOutQuad(progress);
        video.style.transform = `scale(${scale})`;
      } else {
        video.style.transform = "";
      }
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [reducedMotion, ended]);

  const togglePause = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  };

  const replay = () => {
    const video = videoRef.current;
    if (!video) return;
    setEnded(false);
    video.currentTime = 0;
    video.play().catch(() => setEnded(true));
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setMuted(video.muted);
  };

  const skipToEnd = () => {
    const video = videoRef.current;
    if (video) {
      video.pause();
      video.currentTime = video.duration || video.currentTime;
    }
    setEnded(true);
  };

  return (
    <section
      ref={sectionRef}
      id="hero"
      className="relative flex h-[100svh] w-full items-end justify-center overflow-hidden bg-espresso"
    >
      {!reducedMotion && (
        <video
          ref={videoRef}
          className={`absolute inset-0 h-full w-full object-contain object-center transition-opacity duration-700 md:object-cover ${
            ended ? "opacity-0" : "opacity-100"
          }`}
          style={{ transformOrigin: ZOOM_ORIGIN }}
          muted={muted}
          playsInline
          autoPlay
          preload="auto"
          poster="/video/salraza-hero-poster.jpg"
          onEnded={() => setEnded(true)}
          onPlay={() => setPaused(false)}
          onPause={() => setPaused(true)}
        >
          <source src="/video/salraza-hero.mp4" type="video/mp4" />
        </video>
      )}

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/video/salraza-hero-poster.jpg"
        alt="Salraza Marketing"
        className={`absolute inset-0 h-full w-full object-contain object-center transition-opacity duration-700 md:object-cover ${
          showStill ? "opacity-100" : "opacity-0"
        }`}
        style={{
          transformOrigin: ZOOM_ORIGIN,
          transform: isMobile ? `scale(${ZOOM_END})` : undefined,
        }}
      />

      {/*
        Hover flourish: the "Marketing" highlighter stroke glows yellow only
        while the cursor sits directly over it, and fades back out the moment
        it leaves. Sized in real pixels from getContentBox() so it tracks the
        baked-in logo exactly, at any viewport size, without touching the
        video/poster pixels themselves.
      */}
      {showStill && hotspotRect && (
        <div
          className="group absolute"
          style={{
            left: hotspotRect.left,
            top: hotspotRect.top,
            width: hotspotRect.width,
            height: hotspotRect.height,
          }}
        >
          <div className="absolute inset-0 scale-125 rounded-full bg-highlighter opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-[0.52]" />
        </div>
      )}

      {/* Skip control, visible only while the intro is still playing */}
      {!reducedMotion && !ended && (
        <button
          type="button"
          onClick={skipToEnd}
          className="focus-brand absolute right-4 top-4 z-10 rounded-full bg-espresso/60 px-4 py-2 text-label text-golden-hour backdrop-blur transition hover:bg-espresso/80 sm:right-6 sm:top-6"
        >
          Skip intro
        </button>
      )}

      {/* Pause + mute controls, visible while video can still play */}
      {!reducedMotion && (
        <div className="absolute bottom-6 left-4 z-10 flex gap-2 sm:left-6">
          <button
            type="button"
            onClick={togglePause}
            aria-label={paused ? "Play intro video" : "Pause intro video"}
            className="focus-brand flex h-10 w-10 items-center justify-center rounded-full bg-espresso/60 text-golden-hour backdrop-blur transition hover:bg-espresso/80"
          >
            {paused ? (
              <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                <path d="M2 1.5v11l10-5.5z" />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                <rect x="2" y="1.5" width="3.5" height="11" />
                <rect x="8.5" y="1.5" width="3.5" height="11" />
              </svg>
            )}
          </button>
          <button
            type="button"
            onClick={toggleMute}
            aria-label={muted ? "Unmute intro video" : "Mute intro video"}
            className="focus-brand flex h-10 w-10 items-center justify-center rounded-full bg-espresso/60 text-golden-hour backdrop-blur transition hover:bg-espresso/80"
          >
            {muted ? (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M2 6h2.5L9 3v10L4.5 10H2z" fill="currentColor" stroke="none" />
                <path d="M11 5.5l3.5 5M14.5 5.5L11 10.5" strokeLinecap="round" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M2 6h2.5L9 3v10L4.5 10H2z" fill="currentColor" stroke="none" />
                <path d="M11.5 5.5a4 4 0 010 5M13.3 4a6.5 6.5 0 010 8" strokeLinecap="round" />
              </svg>
            )}
          </button>
        </div>
      )}

      {/* Scroll hint once the intro has settled on its still frame */}
      <div
        className={`relative z-10 mb-8 flex flex-col items-center gap-2 transition-opacity duration-700 ${
          showStill ? "opacity-100" : "opacity-0"
        }`}
      >
        <span className="text-label text-golden-hour">Scroll to explore</span>
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" className="text-golden-hour animate-bounce" strokeWidth="2" strokeLinecap="round">
          <path d="M4 7l5 5 5-5" />
        </svg>
        {!reducedMotion && (
          <button
            type="button"
            onClick={replay}
            className="focus-brand mt-1 text-caption text-golden-hour/70 underline hover:text-golden-hour"
          >
            Replay intro
          </button>
        )}
      </div>
    </section>
  );
}
