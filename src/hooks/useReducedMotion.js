import { useEffect, useState } from "react";

/**
 * @param {{ coarsePointer?: boolean }} [options]
 */
export function useReducedMotion({ coarsePointer: trackCoarse = false } = {}) {
  const [reduceMotion, setReduceMotion] = useState(false);
  const [coarsePointer, setCoarsePointer] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(mq.matches);
    const onMq = () => setReduceMotion(mq.matches);
    mq.addEventListener("change", onMq);

    let onPtr = () => {};
    if (trackCoarse) {
      const ptr = window.matchMedia("(pointer: coarse)");
      setCoarsePointer(ptr.matches);
      onPtr = () => setCoarsePointer(ptr.matches);
      ptr.addEventListener("change", onPtr);
    }

    return () => {
      mq.removeEventListener("change", onMq);
      if (trackCoarse) {
        const ptr = window.matchMedia("(pointer: coarse)");
        ptr.removeEventListener("change", onPtr);
      }
    };
  }, [trackCoarse]);

  return { reduceMotion, coarsePointer };
}
