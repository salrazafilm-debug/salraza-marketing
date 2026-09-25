"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// ============================================================================
// CALIBRATED — DO NOT ADJUST ZOOM_ORIGIN_X/Y OR MOBILE_ZOOM BY EYE.
//
// The desktop rendering needs no calibration: `object-cover object-center`
// (see the JSX below) just centers the whole 16:9 frame, and the lockup
// happens to sit dead-center in that frame already.
//
// Mobile is the fragile path: object-fit:contain + a single static scale()
// into ZOOM_ORIGIN (no animation — same zoom level while playing and at
// rest). Getting this centered required measuring the actual source pixels
// (canvas getImageData on /public/video/salraza-hero-poster.jpg, 1916x1080),
// not eyeballing the frame. Verified 2026-09-23:
//   - monitor bezel outer edges:      x = 647 .. 1268   -> center x = 957.5
//   - monitor screen (white) edges:   x = 657 .. 1257    -> center x = 957.0
//   - screen vertical (white) edges:  y = 329 .. 649     -> center y = 489
//   - "SALRAZA" glyph row (y=486):    x = 713 .. 1198    -> center x = 955.5
//   - "Marketing" yellow highlight:   x = 784 .. 1141    -> center x = 962.5
//   - "Marketing" black glyph row:    x = 824 .. 1062    -> center x = 943
// Frame width is 1916px, so every one of those centers lands within 1% of
// exact horizontal center (958px = 50.0%). That is why ZOOM_ORIGIN_X = 0.5
// below is correct and MUST stay 0.5 — an earlier value of 0.43 (a guess,
// never actually measured) is what caused "Marketing" to clip off the right
// edge on mobile while empty desk showed on the left. If this ever looks
// off-center again, the fix is: re-run the same canvas pixel measurement
// against whatever the current /public/video/salraza-hero-poster.jpg is
// (assets can be swapped), not to nudge these numbers by trial and error.
//
// ZOOM_ORIGIN_Y = 0.48 (486/1080) tracks the "SALRAZA" text row above, which
// is close enough to the screen's own vertical center (489/1080 = 0.453) that
// the two rarely disagree in practice; re-measure the same way if the source
// asset changes.
//
// MOBILE_ZOOM (2.2) is sized against the widest line, "SALRAZA"
// (713-1198px = 485px = 25.3% of frame width): at scale 2.2 the visible
// window is 1/2.2 = 45.5% of the frame, comfortably wider than 25.3%, so the
// full word stays safely in frame. Do not raise it past ~3.8x (1/3.8 = 26.3%,
// right at the edge of clipping "SALRAZA") without re-measuring.
// ============================================================================
const MOBILE_QUERY = "(max-width: 767px)";
const MOBILE_ZOOM = 2.2;
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
  // A ref callback (not a useEffect) so `muted`/`defaultMuted` are set the
  // instant the <video> node is created and attached — the earliest point
  // in React's lifecycle, before paint, before any effect runs. Every extra
  // millisecond of the element existing "unmuted" is another chance for
  // Safari's autoplay gate to evaluate it that way and lock in a block.
  const setVideoRef = useCallback((node: HTMLVideoElement | null) => {
    videoRef.current = node;
    if (node) {
      node.muted = true;
      node.defaultMuted = true;
    }
  }, []);
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
  // on the container's actual size and aspect ratio. On mobile the video/
  // poster also carries a static `scale(MOBILE_ZOOM)` transform (see below),
  // so the hotspot's corners are projected through the same scale-around-
  // origin math the CSS transform applies, or it'd land in the pre-zoom
  // position.
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

      const scale = isMobile ? MOBILE_ZOOM : 1;
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
  }, [isMobile]);

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

    let retryCount = 0;
    let settled = false;

    // iOS Safari specifically: React sets `muted` as a DOM *property* after
    // hydration, but never renders it as an actual `muted` HTML *attribute*
    // in the server-rendered markup (a long-standing React SSR quirk).
    // Safari's autoplay gate checks for the attribute, not just the
    // property, so on some loads — reliably reproducible as "plays once,
    // then silently refuses to autoplay after a refresh" — it treats the
    // element as unmuted and blocks it. `defaultMuted` is the one property
    // that actually reflects to the real attribute, so set both explicitly,
    // as early as possible, before ever calling play().
    video.muted = true;
    video.defaultMuted = true;

    // Force a completely clean media pipeline on every mount, not only on
    // the bfcache-restore path below. A stale/partially-buffered state left
    // over from a previous load (very easy to hit on mobile, e.g. Wi-Fi to
    // cellular handoff mid-buffer) can otherwise leave `play()` hanging
    // with no error and no further events — "the video just never plays."
    video.load();

    const attemptPlay = () => {
      video.play().catch(() => {
        // A rejection here is usually the video not having buffered enough
        // yet (common on mobile right after a hard refresh), not a real
        // autoplay-policy block. Retry a couple of times as the browser
        // reports more buffering progress; only fall back to the still end
        // frame once those retries are exhausted too.
        if (retryCount >= 2) {
          settled = true;
          setEnded(true);
          return;
        }
        retryCount += 1;
        video.addEventListener("canplay", attemptPlay, { once: true });
        video.addEventListener("loadeddata", attemptPlay, { once: true });
      });
    };

    // On a flaky mobile connection (common testing over local Wi-Fi) the
    // ~12MB source can stall entirely — no error event, `canplay` just
    // never fires, so the promise-based retry above never resolves either
    // way and the hero is stuck. `onError` catches an outright failed
    // fetch/decode; this timeout catches the silent-stall case by forcing
    // the same graceful fallback (the still poster frame) once the video
    // hasn't started playing within a few seconds, instead of leaving the
    // page waiting indefinitely on a refresh.
    const stallTimeout = window.setTimeout(() => {
      if (!settled && video.paused) {
        settled = true;
        setEnded(true);
      }
    }, 6000);

    const handlePlaying = () => {
      settled = true;
      window.clearTimeout(stallTimeout);
    };

    const handleError = () => {
      settled = true;
      window.clearTimeout(stallTimeout);
      setEnded(true);
    };

    video.addEventListener("playing", handlePlaying);
    video.addEventListener("error", handleError);
    attemptPlay();

    // iOS Safari can restore a page from its back/forward cache (bfcache)
    // — which a "refresh" sometimes triggers there — with the <video>
    // element still present in the DOM but its decode pipeline left dead:
    // no error, no further events, just permanently paused. `pageshow`
    // with `event.persisted` is the standard way to detect that exact
    // restore and force the element to actually reinitialize.
    const handlePageShow = (event: PageTransitionEvent) => {
      if (!event.persisted) return;
      settled = false;
      retryCount = 0;
      video.muted = true;
      video.defaultMuted = true;
      video.load();
      attemptPlay();
    };
    window.addEventListener("pageshow", handlePageShow);

    // Last-resort net: if every JS-driven attempt above still hasn't gotten
    // the video playing (e.g. the device's Auto-Play setting hard-blocks
    // any autoplay that isn't tied to a real tap), the very first touch or
    // click anywhere on the page counts as that tap and starts it — a
    // user gesture always satisfies autoplay policy, so this is the one
    // path that's guaranteed to work regardless of any browser setting.
    const handleFirstInteraction = () => {
      if (video.paused && !settled) attemptPlay();
    };
    document.addEventListener("touchstart", handleFirstInteraction, {
      once: true,
      passive: true,
    });
    document.addEventListener("click", handleFirstInteraction, { once: true });

    return () => {
      window.clearTimeout(stallTimeout);
      video.removeEventListener("canplay", attemptPlay);
      video.removeEventListener("loadeddata", attemptPlay);
      video.removeEventListener("playing", handlePlaying);
      video.removeEventListener("error", handleError);
      window.removeEventListener("pageshow", handlePageShow);
      document.removeEventListener("touchstart", handleFirstInteraction);
      document.removeEventListener("click", handleFirstInteraction);
    };
  }, [reducedMotion]);

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
      // Mobile only is shorter than a full 100svh, on purpose: the video/
      // poster fill this box (absolute inset-0 h-full w-full) with the SAME
      // calibrated object-position/zoom fractions from above, so shrinking
      // the box only trims the empty letterboxed margin around the logo —
      // it does not recrop or re-zoom the logo itself. This pulls the
      // section below up the page on mobile without touching
      // ZOOM_ORIGIN_X/Y or MOBILE_ZOOM. Desktop stays a full 100svh
      // cinematic intro (only the video visible until the visitor scrolls)
      // — that was explicitly kept as-is, do not shrink it to match mobile.
      className="relative flex h-[82svh] w-full items-end justify-center overflow-hidden bg-espresso md:h-[100svh]"
    >
      {!reducedMotion && (
        <video
          ref={setVideoRef}
          className={`absolute inset-0 h-full w-full object-contain object-center transition-opacity duration-700 md:object-cover ${
            ended ? "opacity-0" : "opacity-100"
          }`}
          style={{
            transformOrigin: ZOOM_ORIGIN,
            transform: isMobile ? `scale(${MOBILE_ZOOM})` : undefined,
          }}
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
          transform: isMobile ? `scale(${MOBILE_ZOOM})` : undefined,
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
