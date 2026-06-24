import { useCallback, useEffect, useRef, useState } from "react";
import { useInView } from "../hooks/useInView";
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

export default function MapDrawingDemoOverlay({ containerRef }) {
  const [visible, setVisible] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [phase, setPhase] = useState("idle");
  const [fadingOut, setFadingOut] = useState(false);
  const [skipped, setSkipped] = useState(false);
  const reducedMotionRef = useRef(false);
  const dismissedRef = useRef(false);
  const timersRef = useRef([]);

  const { isInView } = useInView({
    externalRef: containerRef,
    threshold: 0.35,
    rootMargin: "0px 0px -8% 0px",
    once: false,
  });

  const clearTimers = useCallback(() => {
    for (const id of timersRef.current) window.clearTimeout(id);
    timersRef.current = [];
  }, []);

  const dismiss = useCallback(() => {
    if (dismissedRef.current) return;
    dismissedRef.current = true;
    clearTimers();
    try {
      sessionStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }
    setFadingOut(true);
    window.setTimeout(() => {
      setVisible(false);
      setPlaying(false);
      setPhase("idle");
    }, 400);
  }, [clearTimers]);

  const startAnimation = useCallback(() => {
    clearTimers();
    setFadingOut(false);
    setVisible(true);
    setPlaying(true);

    if (reducedMotionRef.current) {
      setPhase("done");
      return;
    }

    setPhase("toolbar");
    timersRef.current.push(window.setTimeout(() => setPhase("drawing"), 900));
    timersRef.current.push(window.setTimeout(() => setPhase("fill"), 3400));
    timersRef.current.push(window.setTimeout(() => setPhase("done"), 4200));
    timersRef.current.push(window.setTimeout(() => dismiss(), TOTAL_DURATION_MS));
  }, [clearTimers, dismiss]);

  const pauseAnimation = useCallback(() => {
    clearTimers();
    setVisible(false);
    setPlaying(false);
    setPhase("idle");
    setFadingOut(false);
  }, [clearTimers]);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(STORAGE_KEY)) {
        setSkipped(true);
        return;
      }
    } catch {
      setSkipped(true);
      return;
    }

    reducedMotionRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  useEffect(() => {
    if (skipped || dismissedRef.current) return;

    if (isInView) {
      if (!visible) {
        startAnimation();
      }
    } else if (visible && phase !== "done") {
      pauseAnimation();
    }
  }, [isInView, skipped, visible, phase, startAnimation, pauseAnimation]);

  useEffect(() => () => clearTimers(), [clearTimers]);

  if (skipped || !visible) return null;

  const isReduced = reducedMotionRef.current;
  const showToolbarPulse = !isReduced && playing && (phase === "toolbar" || phase === "drawing");
  const showDrawing = !isReduced && playing && (phase === "drawing" || phase === "fill" || phase === "done");
  const showFill = !isReduced && playing && (phase === "fill" || phase === "done");
  const showDoneBadge = phase === "done" && !isReduced && playing;

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
      className={`map-demo-overlay${playing ? " map-demo-overlay--playing" : ""}${fadingOut ? " map-demo-overlay--out" : ""}${isReduced ? " map-demo-overlay--reduced" : ""}`}
      aria-hidden="true"
      onPointerDown={dismiss}
    >
      {showToolbarPulse && <div className="map-demo-overlay__toolbar-pulse" />}

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
            {showFill && <path className="map-demo-overlay__fill" d={POLYGON_PATH} />}
          </>
        )}

        {isReduced && (
          <>
            <path className="map-demo-overlay__fill map-demo-overlay__fill--static" d={POLYGON_PATH} />
            <path className="map-demo-overlay__stroke map-demo-overlay__stroke--done" d={POLYGON_PATH} pathLength="100" />
          </>
        )}
      </svg>

      {showDrawing && !isReduced && <div className="map-demo-overlay__cursor" aria-hidden="true" />}

      <p className="map-demo-overlay__tooltip">{tooltipText}</p>

      {showDoneBadge && <span className="map-demo-overlay__badge">¡Listo!</span>}

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
