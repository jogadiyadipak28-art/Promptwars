import React, { useState } from 'react';

const FALLBACK =
  'https://images.pexels.com/photos/46798/the-ball-stadion-football-the-pitch-46798.jpeg?auto=compress&cs=tinysrgb&w=800&fit=crop';

/**
 * SafeImage
 * - Falls back to a football-pitch image on load error.
 * - Does NOT hide the element before load (no opacity:0 flash) — the
 *   browser renders the img immediately with background-color placeholder.
 * - Passes through aria-hidden and all other img attributes.
 */
export default function SafeImage({
  src,
  alt = '',
  className = '',
  style = {},
  fallback = FALLBACK,
  ...props
}) {
  const [errored, setErrored] = useState(false);

  return (
    <img
      src={errored ? fallback : src}
      alt={alt}
      loading="lazy"
      decoding="async"
      onError={() => { if (!errored) setErrored(true); }}
      className={className}
      style={style}
      {...props}
    />
  );
}
