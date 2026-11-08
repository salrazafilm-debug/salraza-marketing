"use client";

import { Fragment, useEffect, useState, type ReactNode } from "react";

export type JustifyItem = {
  key: string;
  /** Width ÷ height of the item's picture. */
  ratio: number;
  /** Takes a full-width row to itself (e.g. a folder's premium cover video). */
  solo?: boolean;
  render: (width: number, height: number) => ReactNode;
};

/** Used until a picture has loaded and its real proportions are known. */
export const DEFAULT_RATIO = 1.25;

/** Width ÷ height of a picture, kept in a sane range so one panorama can't take over a row. */
export function clampRatio(width: number, height: number): number {
  if (!width || !height) return DEFAULT_RATIO;
  return Math.min(2.4, Math.max(0.6, width / height));
}

type Row = { items: JustifyItem[]; widths: number[]; height: number };

/**
 * Packs items into rows that fill the width exactly. Each row is as close as
 * possible to the target height, so every tile in a row is the same height and
 * no side is left empty. The final row keeps its natural size and is centered.
 */
export function layoutRows(items: JustifyItem[], width: number, target: number, gap: number): Row[] {
  const usable = width - 1; // a pixel of slack so rounding never wraps a row
  const rows: Row[] = [];
  let start = 0;

  while (start < items.length) {
    const first = items[start];
    if (first.solo) {
      rows.push({ items: [first], widths: [usable], height: usable / first.ratio });
      start += 1;
      continue;
    }

    let best: { end: number; height: number; dist: number } | null = null;
    let sum = 0;
    for (let end = start; end < items.length && !items[end].solo; end++) {
      sum += items[end].ratio;
      const count = end - start + 1;
      const height = (usable - (count - 1) * gap) / sum;
      const dist = Math.abs(Math.log(height / target));
      if (best && dist > best.dist) break; // adding more would move further from the target
      best = { end: end + 1, height, dist };
    }
    if (!best) break;

    const row = items.slice(start, best.end);
    const isLast = best.end === items.length;
    const height = isLast ? Math.min(best.height, target * 1.1) : best.height;
    rows.push({ items: row, widths: row.map((item) => item.ratio * height), height });
    start = best.end;
  }

  return rows;
}

/**
 * Lays items out in full-width justified rows that re-flow as the screen
 * resizes. Pictures are never cropped: each tile's shape comes from its own
 * measured proportions.
 */
export function JustifiedRows({
  items,
  targetHeight,
  gap = 12,
  fallbackHeight = 240,
}: {
  items: JustifyItem[];
  /** Target row height for a given container width. */
  targetHeight: (width: number) => number;
  gap?: number;
  fallbackHeight?: number;
}) {
  const [node, setNode] = useState<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    if (!node) return;
    const observer = new ResizeObserver((entries) => setWidth(Math.floor(entries[0].contentRect.width)));
    observer.observe(node);
    return () => observer.disconnect();
  }, [node]);

  // Before the width is known (first paint on the server), show the same tiles
  // at a sensible size so nothing is missing or jumps badly.
  if (width <= 0) {
    return (
      <div ref={setNode} className="flex flex-wrap justify-center" style={{ gap }}>
        {items.map((item) => (
          <Fragment key={item.key}>{item.render(item.ratio * fallbackHeight, fallbackHeight)}</Fragment>
        ))}
      </div>
    );
  }

  const rows = layoutRows(items, width, targetHeight(width), gap);

  return (
    <div ref={setNode} className="flex flex-col" style={{ gap }}>
      {rows.map((row, rowIndex) => (
        <div key={rowIndex} className="flex justify-center" style={{ gap }}>
          {row.items.map((item, i) => (
            <Fragment key={item.key}>{item.render(row.widths[i], row.height)}</Fragment>
          ))}
        </div>
      ))}
    </div>
  );
}
