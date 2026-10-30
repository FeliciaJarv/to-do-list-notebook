export const RING_COUNT = 14;

/** Rings visible on small screens: every other ring. */
const ringClass = (i: number) => (i % 2 === 1 ? "hidden sm:block" : "");

/** A single wire loop: comes out of the hole, curls over the top edge and disappears behind. */
function Coil({ gid }: { gid: string }) {
  return (
    <svg viewBox="0 0 20 60" className="absolute left-1/2 top-0 h-[3.75rem] w-5 -translate-x-1/2 overflow-visible">
      {/* shadow cast on the paper */}
      <path d="M13 54 C13 30, 14 8, 8 8 C3 8, 3 16, 4 20" fill="none" stroke="rgb(0 0 0 / 0.28)" strokeWidth="3.4" strokeLinecap="round" transform="translate(2.5 3)" style={{ filter: "blur(1.2px)" }} />
      <path d="M11 54 C11 28, 12 4, 6 4 C1 4, 1 14, 2.5 19" fill="none" stroke={`url(#${gid})`} strokeWidth="3.4" strokeLinecap="round" />
      <path d="M10.2 50 C10.2 28, 11 7, 6.5 6" fill="none" stroke="rgb(255 255 255 / 0.65)" strokeWidth="0.9" strokeLinecap="round" />
    </svg>
  );
}

/** The metal coil loops that sit above the pages. */
export function SpiralRings() {
  const gid = "coil-metal";
  return (
    <div aria-hidden className="pointer-events-none absolute inset-x-0 -top-5 z-30 flex justify-evenly px-6">
      <svg className="absolute h-0 w-0">
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="oklch(0.42 0.05 80)" />
            <stop offset="0.45" stopColor="oklch(0.9 0.07 90)" />
            <stop offset="0.7" stopColor="oklch(0.66 0.09 80)" />
            <stop offset="1" stopColor="oklch(0.38 0.05 75)" />
          </linearGradient>
        </defs>
      </svg>
      {Array.from({ length: RING_COUNT }).map((_, i) => (
        <div key={i} className={`relative h-14 w-4 ${ringClass(i)}`}>
          <Coil gid={gid} />
        </div>
      ))}
    </div>
  );
}

/** The punched holes in each page, aligned with the rings. */
export function SpiralHoles() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 flex justify-evenly px-6">
      {Array.from({ length: RING_COUNT }).map((_, i) => (
        <div key={i} className={`relative h-12 w-4 ${ringClass(i)}`}>
          <div className="punch-hole absolute left-1/2 top-[1.55rem] h-3 w-3 -translate-x-1/2 rounded-full" />
        </div>
      ))}
    </div>
  );
}
