import React, { useState } from 'react';
import { IMAGES } from '../assets/images';

export default function SafeImage({ src, alt, fallback = IMAGES.fallback, className, style, ...props }) {
  const [current, setCurrent] = useState(src);

  return (
    <img
      src={current}
      alt={alt}
      className={className}
      style={style}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => { if (current !== fallback) setCurrent(fallback); }}
      {...props}
    />
  );
}
