/** An easy-to-read vault password such as "velvet-lens-4821" (no look-alike
 * letters, no symbols to mistype). Uses the browser's secure random numbers. */
const WORDS = [
  "velvet", "lens", "frame", "reel", "focus", "studio", "golden", "shutter", "cinema", "scene",
  "story", "light", "shadow", "crown", "ember", "silver", "violet", "harbor", "summit", "maple",
  "cedar", "comet", "river", "ocean", "lunar", "solar", "amber", "ruby", "onyx", "jade",
];

export function makePassword() {
  const r = new Uint32Array(3);
  crypto.getRandomValues(r);
  const a = WORDS[r[0] % WORDS.length];
  let b = WORDS[r[1] % WORDS.length];
  if (b === a) b = WORDS[(r[1] + 1) % WORDS.length];
  return `${a}-${b}-${1000 + (r[2] % 9000)}`;
}
