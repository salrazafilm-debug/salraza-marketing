"use client";

import { useContext, useEffect, useState } from "react";
import { RevealContext } from "@/components/MarksmenVaultIntro";

/** Lets the section's own fade-in settle before the first letter appears. */
const START_DELAY_MS = 500;
/** Pace of the typewriter effect, in ms per character. */
const CHAR_INTERVAL_MS = 55;

/**
 * Types `text` out one character at a time once RevealContext flips to
 * true. Outside of MarksmenVaultIntro's Provider, RevealContext defaults to
 * true, so this renders the full text immediately with no animation for
 * every client except Marksmen.
 */
export function TypewriterText({ text }: { text: string }) {
  const revealed = useContext(RevealContext);
  const [visibleChars, setVisibleChars] = useState(revealed ? text.length : 0);
  const done = visibleChars >= text.length;

  useEffect(() => {
    if (!revealed) return;
    const startTimer = setTimeout(() => {
      let count = 0;
      const interval = setInterval(() => {
        count++;
        setVisibleChars(count);
        if (count >= text.length) clearInterval(interval);
      }, CHAR_INTERVAL_MS);
    }, START_DELAY_MS);
    return () => clearTimeout(startTimer);
    // Runs once when this client's intro reveals — not meant to re-trigger on text edits.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revealed]);

  return (
    <>
      {text.slice(0, visibleChars)}
      {!done && <span className="animate-pulse">|</span>}
    </>
  );
}
