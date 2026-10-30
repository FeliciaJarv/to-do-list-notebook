import { useEffect, type ReactNode } from "react";

/** Height of the strip left behind under the spiral when the page is ripped out. */
const TEAR_Y = 58;

/** A ragged, deterministic tear line across the page (x in %, y in px). */
function tearPoints(): string[] {
  const pts: string[] = [];
  const steps = 48;
  for (let i = 0; i <= steps; i++) {
    const x = (i / steps) * 100;
    const jag = Math.sin(i * 2.7) * 4 + Math.sin(i * 7.3) * 3 + (i % 2 ? 3 : -2);
    pts.push(`${x.toFixed(2)}% ${(TEAR_Y + jag).toFixed(1)}px`);
  }
  return pts;
}

/**
 * Wraps a page while it is being deleted: the page rips away from the spiral along a
 * ragged edge (left side first), sags, then falls out of the notebook. A torn stub
 * stays stuck in the rings for a moment.
 */
export function TearLayer({ children, onDone }: { children: ReactNode; onDone: () => void }) {
  useEffect(() => {
    const t = window.setTimeout(onDone, 1500);
    return () => window.clearTimeout(t);
  }, [onDone]);

  const edge = tearPoints();
  const pageClip = `polygon(${edge.join(", ")}, 100% 100%, 0 100%)`;
  const stubClip = `polygon(0 0, 100% 0, ${[...edge].reverse().join(", ")})`;

  return (
    <div className="pointer-events-none absolute inset-0 z-20">
      {/* the page being ripped out */}
      <div className="animate-tear-off absolute inset-0" style={{ filter: "drop-shadow(0 18px 18px rgb(0 0 0 / 0.35))" }}>
        <div className="absolute inset-0" style={{ clipPath: pageClip }}>
          {children}
          <div aria-hidden className="tear-fibres absolute inset-x-0" style={{ top: TEAR_Y - 8, height: 18 }} />
        </div>
      </div>
      {/* the ragged stub left in the spiral */}
      <div className="animate-tear-stub absolute inset-0" style={{ clipPath: stubClip }}>
        {children}
      </div>
    </div>
  );
}
