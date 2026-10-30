import { useEffect, useId, useMemo, useRef, type CSSProperties, type ReactNode } from "react";
import paperBall from "@/assets/paper-ball.png";

const CONFETTI = ["bg-done", "bg-highlight", "bg-margin", "bg-cover", "bg-rule"];

/**
 * Plays when a list is finished: the page scrunches into a paper ball, which is thrown
 * in an arc into a waste-paper bin, then "Well done!" appears with a little confetti.
 */
export function CompleteLayer({ children, onDone }: { children: ReactNode; onDone: () => void }) {
  const rawId = useId();
  const id = `scrunch-${rawId.replace(/:/g, "")}`;
  const mapRef = useRef<SVGFEDisplacementMapElement>(null);
  const turbRef = useRef<SVGFETurbulenceElement>(null);

  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / 800);
      mapRef.current?.setAttribute("scale", String(Math.round(p * p * 90)));
      turbRef.current?.setAttribute("baseFrequency", `${0.008 + p * 0.03} ${0.012 + p * 0.035}`);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    const t = window.setTimeout(onDone, 3800);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(t);
    };
  }, [onDone]);

  const confetti = useMemo(
    () =>
      Array.from({ length: 28 }, (_, i) => {
        const a = -Math.PI / 2 + Math.sin(i * 12.9) * 1.1;
        const d = 90 + ((i * 37) % 140);
        return {
          id: i,
          color: CONFETTI[i % CONFETTI.length]!,
          style: {
            "--dx": `${Math.cos(a) * d}px`,
            "--dy": `${Math.sin(a) * d}px`,
            "--rot": `${(i * 97) % 540}deg`,
            "--dur": `${1.1 + (i % 5) * 0.15}s`,
            width: `${6 + (i % 4) * 2}px`,
            height: `${4 + (i % 3) * 2}px`,
            animationDelay: "2.15s",
          } as CSSProperties,
        };
      }),
    [],
  );

  return (
    <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden">
      <svg className="absolute h-0 w-0" aria-hidden>
        <filter id={id} x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence ref={turbRef} type="fractalNoise" baseFrequency="0.008 0.012" numOctaves="3" seed="3" result="noise" />
          <feDisplacementMap ref={mapRef} in="SourceGraphic" in2="noise" scale="0" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </svg>

      {/* the finished page scrunching up */}
      <div className="absolute inset-0" style={{ filter: `url(#${id}) drop-shadow(0 10px 12px rgb(0 0 0 / 0.3))` }}>
        <div className="animate-crumple-page absolute inset-0">
          {children}
          <div aria-hidden className="crease-shading animate-in fade-in absolute inset-0 duration-500" />
        </div>
      </div>

      {/* waste-paper bin, slides up from the bottom corner */}
      <div className="animate-bin absolute bottom-3 right-[10%] z-20 w-28 sm:w-36">
        <svg viewBox="0 0 120 140" className="w-full drop-shadow-[0_10px_8px_rgb(0_0_0_/_0.3)]">
          <defs>
            <linearGradient id={`${id}-bin`} x1="0" x2="1">
              <stop offset="0%" stopColor="var(--cover)" />
              <stop offset="45%" stopColor="color-mix(in oklab, var(--cover) 70%, var(--paper))" />
              <stop offset="100%" stopColor="color-mix(in oklab, var(--cover) 80%, var(--ink))" />
            </linearGradient>
          </defs>
          <path d="M8 18 L112 18 L100 136 L20 136 Z" fill={`url(#${id}-bin)`} />
          {[30, 46, 60, 74, 90].map((x) => (
            <path key={x} d={`M${x} 28 L${60 + (x - 60) * 0.78} 128`} stroke="var(--ink)" strokeOpacity="0.25" strokeWidth="3" strokeLinecap="round" />
          ))}
          <ellipse cx="60" cy="18" rx="54" ry="9" fill="var(--ink)" fillOpacity="0.55" />
          <ellipse cx="60" cy="18" rx="54" ry="9" fill="none" stroke="var(--cover)" strokeWidth="5" />
        </svg>
      </div>

      {/* the paper ball, thrown in an arc into the bin */}
      <div className="animate-ball-throw absolute z-10 w-[34%] max-w-[12rem]">
        <img src={paperBall} alt="" width={816} height={816} className="animate-ball-spin w-full drop-shadow-[0_12px_8px_rgb(0_0_0_/_0.35)]" />
      </div>

      {/* confetti from the bin + cheer */}
      <div className="absolute bottom-[9.5rem] right-[calc(10%+3.5rem)] z-30 sm:right-[calc(10%+4.5rem)]">
        {confetti.map((p) => (
          <span key={p.id} className={`animate-confetti absolute rounded-[1px] opacity-0 ${p.color}`} style={p.style} />
        ))}
      </div>
      <p className="animate-well-done absolute inset-x-0 top-[38%] z-30 text-center font-title text-6xl font-bold text-done sm:text-7xl">
        Well done!
      </p>
    </div>
  );
}
