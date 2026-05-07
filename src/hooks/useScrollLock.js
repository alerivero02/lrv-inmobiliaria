import { useEffect } from "react";

const LOCK_KEY = "__lrvScrollLocks";

function getLockCount() {
  return Number(window[LOCK_KEY] || 0);
}

function setLockCount(value) {
  window[LOCK_KEY] = value;
}

export function useScrollLock(locked) {
  useEffect(() => {
    if (!locked || typeof window === "undefined" || typeof document === "undefined") return;

    const html = document.documentElement;
    const body = document.body;
    const previousCount = getLockCount();
    setLockCount(previousCount + 1);
    if (previousCount > 0) return;

    const scrollY = window.scrollY;
    const prevHtmlOverflow = html.style.overflow;
    const prevBodyPosition = body.style.position;
    const prevBodyTop = body.style.top;
    const prevBodyLeft = body.style.left;
    const prevBodyRight = body.style.right;
    const prevBodyWidth = body.style.width;
    const prevBodyOverflow = body.style.overflow;

    html.style.overflow = "hidden";
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.left = "0";
    body.style.right = "0";
    body.style.width = "100%";
    body.style.overflow = "hidden";

    return () => {
      const nextCount = Math.max(0, getLockCount() - 1);
      setLockCount(nextCount);
      if (nextCount > 0) return;

      html.style.overflow = prevHtmlOverflow;
      body.style.position = prevBodyPosition;
      body.style.top = prevBodyTop;
      body.style.left = prevBodyLeft;
      body.style.right = prevBodyRight;
      body.style.width = prevBodyWidth;
      body.style.overflow = prevBodyOverflow;
      window.scrollTo(0, scrollY);
    };
  }, [locked]);
}
