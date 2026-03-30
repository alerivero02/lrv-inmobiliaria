import { useEffect } from "react";

/**
 * Tilt 3D en `cardRef` según el puntero sobre `boundsRef`.
 * Usa `requestAnimationFrame` + `transform` directo (sin re-renders) para evitar
 * violaciones de "forced reflow" por getBoundingClientRect + setState en cada mousemove.
 */
export function usePointerTilt({
  boundsRef,
  cardRef,
  enabled,
  coeffX = 20,
  coeffY = 20,
  rotYMul = -0.5,
  rotXMul = 0.3,
}) {
  useEffect(() => {
    if (!enabled) return;
    const bounds = boundsRef.current;
    const card = cardRef.current;
    if (!bounds || !card) return;

    let raf = 0;

    const onMove = (e) => {
      const cx = e.clientX;
      const cy = e.clientY;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const rect = bounds.getBoundingClientRect();
        const w = rect.width || 1;
        const h = rect.height || 1;
        const nx = ((cx - rect.left) / w - 0.5) * coeffX;
        const ny = ((cy - rect.top) / h - 0.5) * coeffY;
        card.style.transform = `perspective(1000px) rotateY(${nx * rotYMul}deg) rotateX(${ny * rotXMul}deg)`;
      });
    };

    const onLeave = () => {
      cancelAnimationFrame(raf);
      card.style.transform = "";
    };

    bounds.addEventListener("pointermove", onMove, { passive: true });
    bounds.addEventListener("pointerleave", onLeave);

    return () => {
      cancelAnimationFrame(raf);
      bounds.removeEventListener("pointermove", onMove);
      bounds.removeEventListener("pointerleave", onLeave);
      card.style.transform = "";
    };
  }, [enabled, boundsRef, cardRef, coeffX, coeffY, rotYMul, rotXMul]);
}
