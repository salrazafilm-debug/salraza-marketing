"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    instgrm?: { Embeds: { process: () => void } };
  }
}

const REEL_IDS = ["DcEDFn9OAnK", "DcXsi-zAw_9", "DcM6dp5gqX_"];

export function InstagramEmbeds() {
  useEffect(() => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[src="https://www.instagram.com/embed.js"]'
    );

    if (window.instgrm) {
      window.instgrm.Embeds.process();
      return;
    }

    if (existing) return;

    const script = document.createElement("script");
    script.src = "https://www.instagram.com/embed.js";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
      {REEL_IDS.map((id) => (
        <blockquote
          key={id}
          className="instagram-media mx-auto w-full"
          data-instgrm-permalink={`https://www.instagram.com/reel/${id}/`}
          data-instgrm-version="14"
          style={{ margin: 0, minWidth: "100%" }}
        >
          <a href={`https://www.instagram.com/reel/${id}/`} />
        </blockquote>
      ))}
    </div>
  );
}
