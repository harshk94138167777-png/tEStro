import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/** Scroll to element id matching location.hash (e.g. #sql) after navigation. */
export function useHashScroll() {
  const { hash, pathname } = useLocation();

  useEffect(() => {
    if (!hash) return;
    const id = hash.replace(/^#/, '');
    if (!id) return;

    let cancelled = false;
    let frame = 0;
    let attempts = 0;
    const maxAttempts = 24;

    const tick = () => {
      if (cancelled) return;
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
      if (attempts++ < maxAttempts) {
        frame = requestAnimationFrame(tick);
      }
    };

    frame = requestAnimationFrame(tick);
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
    };
  }, [hash, pathname]);
}
