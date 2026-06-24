import { useEffect, useRef, useState } from "react";

/**
 * @param {{
 *   threshold?: number,
 *   rootMargin?: string,
 *   once?: boolean,
 *   externalRef?: React.RefObject<Element | null>,
 * }} [options]
 */
export function useInView({
  threshold = 0.35,
  rootMargin = "0px",
  once = true,
  externalRef,
} = {}) {
  const internalRef = useRef(null);
  const targetRef = externalRef ?? internalRef;
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const el = targetRef.current;
    if (!el) return;

    const ob = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          if (once) ob.disconnect();
        } else if (!once) {
          setIsInView(false);
        }
      },
      { threshold, rootMargin },
    );

    ob.observe(el);
    return () => ob.disconnect();
  }, [targetRef, threshold, rootMargin, once]);

  return { ref: internalRef, isInView };
}
