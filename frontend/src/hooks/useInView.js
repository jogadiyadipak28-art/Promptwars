import { useState, useEffect, useRef } from 'react';

/**
 * Fires once when the referenced element enters the viewport.
 * @param {number} threshold IntersectionObserver threshold (0–1)
 * @returns {[React.RefObject, boolean]}
 */
export default function useInView(threshold = 0.15) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setInView(true); obs.disconnect(); } },
      { threshold }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);

  return [ref, inView];
}
