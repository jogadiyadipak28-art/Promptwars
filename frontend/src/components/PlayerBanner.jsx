import React from 'react';
import SafeImage from './SafeImage';
import { BANNER_IMAGES } from '../assets/images';

const ALL = [...BANNER_IMAGES, ...BANNER_IMAGES];

/** Scrolling image banner — decorative, no interactive props */
const BANNER_BG_STYLE = {
  background: 'linear-gradient(to bottom, transparent, rgba(125,211,252,0.06), rgba(74,222,128,0.06))',
};
const BANNER_SCROLL_STYLE = { width: 'max-content' };

export default function PlayerBanner() {
  return (
    <div
      className="relative py-8 overflow-hidden"
      style={BANNER_BG_STYLE}
      aria-hidden="true"
      role="presentation"
    >
      <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-brand-darker to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-brand-darker to-transparent z-10 pointer-events-none" />

      <div className="flex gap-4 scroll-banner" style={BANNER_SCROLL_STYLE}>
        {ALL.map((img, i) => (
          <div
            key={`${img.src}-${i}`}
            className="relative w-56 h-36 sm:w-64 sm:h-40 flex-shrink-0 rounded-2xl overflow-hidden border border-brand-blue/20 group shadow-xl hover:border-brand-green/40 transition-all duration-300 hover:scale-105"
          >
            <SafeImage
              src={img.src}
              alt={img.alt}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-brand-darker/90 via-brand-green/10 to-transparent" />
            <div className="absolute bottom-3 left-3 text-xs font-semibold text-brand-blue opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              {img.alt}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
