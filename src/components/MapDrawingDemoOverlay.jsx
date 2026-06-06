import { useCallback, useEffect, useRef, useState } from "react";
import "./MapDrawingDemoOverlay.css";

const STORAGE_KEY = "lrv_map_demo_seen";

/** Vértices del polígono demo en % del viewBox (0–100). */
const DEMO_POINTS = [
  { x: 38, y: 42 },
  { x: 58, y: 36 },
  { x: 68, y: 58 },
  { x: 48, y: 68 },
];

const POLYGON_PATH = DEMO_POINTS.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ") + " Z";

const TOTAL_DURATION_MS = 5200;

export default function MapDrawingDemoOverlay() {
  const [visible, setVisible] = useState(false);
  const [phase, setPhase] = useState("idle");
  const [fadingOut, setFadingOut] = useState(false);
  const reducedMotionRef = useRef(false);
  const dismissedRef = useRef(false);

  const dismiss = useCallback(() => {
    if (dismissedRef.current) return;
    dismissedRef.current = true;
    try {
      sessionStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }
    setFadingOut(true);
    window.setTimeout(() => setVisible(false), 400);
  }, []);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(STORAGE_KEY)) return;
    } catch {
      return;
    }

    reducedMotionRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setVisible(true);

    if (reducedMotionRef.current) {
      setPhase("done");
      return;
    }

    setPhase("toolbar");
    const t1 = window.setTimeout(() => setPhase("drawing"), 900);
    const t2 = window.setTimeout(() => setPhase("fill"), 3400);
    const t3 = window.setTimeout(() => setPhase("done"), 4200);
    const t4 = window.setTimeout(() => dismiss(), TOTAL_DURATION_MS);

    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
      window.clearTimeout(t4);
    };
  }, [dismiss]);

  if (!visible) return null;

  const isReduced = reducedMotionRef.current;
  const showToolbarPulse = !isReduced && (phase === "toolbar" || phase === "drawing");
  const showDrawing = !isReduced && (phase === "drawing" || phase === "fill" || phase === "done");
  const showFill = !isReduced && (phase === "fill" || phase === "done");
  const showDoneBadge = phase === "done" && !isReduced;

  const tooltipText = isReduced
    ? "Dibujá tu zona en el mapa"
    : phase === "toolbar"
      ? "Tocá «Dibujar área»"
      : phase === "drawing"
        ? "Marcá los puntos de tu zona"
        : phase === "fill"
          ? "Cerrá el contorno"
          : "¡Listo!";

  return (
    <div
      className={`map-demo-overlay${fadingOut ? " map-demo-overlay--out" : ""}${isReduced ? " map-demo-overlay--reduced" : ""}`}
      aria-hidden="true"
      onPointerDown={dismiss}
    >
      {showToolbarPulse && (
        <div className="map-demo-overlay__toolbar-pulse" />
      )}

      <svg className="map-demo-overlay__svg" viewBox="0 0 100 100" preserveAspectRatio="none">
        {showDrawing && (
          <>
            {DEMO_POINTS.map((pt, i) => (
              <circle
                key={i}
                className="map-demo-overlay__vertex"
                cx={pt.x}
                cy={pt.y}
                r={i === 0 ? 2.2 : 1.6}
                style={{ "--i": i }}
              />
            ))}
            <path
              className={`map-demo-overlay__stroke${showFill ? " map-demo-overlay__stroke--done" : ""}`}
              d={POLYGON_PATH}
              pathLength="100"
            />
            {showFill && (
              <path className="map-demo-overlay__fill" d={POLYGON_PATH} />
            )}
          </>
        )}

        {isReduced && (
          <>
            <path className="map-demo-overlay__fill map-demo-overlay__fill--static" d={POLYGON_PATH} />
            <path className="map-demo-overlay__stroke map-demo-overlay__stroke--done" d={POLYGON_PATH} pathLength="100" />
          </>
        )}
      </svg>

      {showDrawing && !isReduced && (
        <div className="map-demo-overlay__cursor" aria-hidden="true" />
      )}

      <p className="map-demo-overlay__tooltip">{tooltipText}</p>

      {showDoneBadge && (
        <span className="map-demo-overlay__badge">¡Listo!</span>
      )}

      <button
        type="button"
        className="map-demo-overlay__skip"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={dismiss}
      >
        Omitir demo
      </button>
    </div>
  );
}
