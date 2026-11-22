/** Fixed, decorative background behind every page: burgundy glow, a soft
 * light beam, film scratches and moving grain. Styles live in globals.css. */
export function SiteAtmosphere() {
  return (
    <div aria-hidden className="atmo">
      <div className="atmo-beam" />
      <div className="atmo-leak" />
      <div className="atmo-scratches" />
      <div className="atmo-line atmo-line-1" />
      <div className="atmo-line atmo-line-2" />
      <div className="atmo-dust" />
      <div className="atmo-grain" />
      <div className="atmo-grain atmo-grain-coarse" />
      <div className="atmo-vignette" />
    </div>
  );
}
