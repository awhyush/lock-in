// A fractal-noise texture layered over the architectural/brutalist pages for tactile grain.
// Self-contained (inline SVG filter via data-URI) so it needs no new global CSS or assets.
const NOISE_SVG =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/></filter><rect width="100%" height="100%" filter="url(%23n)"/></svg>`,
  );

export function NoiseOverlay() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-50 opacity-[0.05]"
      style={{ backgroundImage: `url("${NOISE_SVG}")` }}
    />
  );
}
