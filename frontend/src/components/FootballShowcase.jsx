import React, { useRef, useEffect, useState } from 'react';
import { Trophy, Globe2, Users, Flame } from 'lucide-react';
import SafeImage from './SafeImage';
import { SHOWCASE_IMAGES } from '../assets/images';
import { theme } from '../assets/theme';

const PANELS = [
  {
    key: 'venues',
    label: '16 Iconic Venues',
    sub: 'Across 3 nations',
    icon: Trophy,
    color: theme.blue,
    image: SHOWCASE_IMAGES.venues,
  },
  {
    key: 'nations',
    label: '32 Nations Compete',
    sub: "The world's best squads",
    icon: Globe2,
    color: theme.green,
    image: SHOWCASE_IMAGES.nations,
  },
  {
    key: 'fans',
    label: '5M+ Fans',
    sub: 'From every corner of earth',
    icon: Users,
    color: theme.pink,
    image: SHOWCASE_IMAGES.fans,
  },
];

function useInView(threshold = 0.15) {
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

/** Individual panel — component so hooks are called at the top level */
function ShowcasePanel({ panel, index }) {
  const [ref, inView] = useInView(0.1);
  const Icon = panel.icon;

  return (
    <div
      ref={ref}
      className={`relative overflow-hidden rounded-3xl border border-white/10 group
        hover:border-white/25 hover:scale-[1.02] transition-all duration-500 shadow-2xl
        ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
      style={{ transitionDelay: `${index * 120}ms` }}
    >
      <div className="relative h-64 overflow-hidden">
        <SafeImage
          src={panel.image}
          alt={panel.label}
          className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-110"
        />
        <div
          className="absolute inset-0 opacity-60"
          style={{ background: `linear-gradient(to top, ${panel.color}30, transparent)` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#081420]/90 via-transparent to-transparent" />

        <div
          className="absolute top-4 right-4 w-11 h-11 rounded-2xl flex items-center justify-center backdrop-blur-sm shadow-xl border"
          style={{ background: `${panel.color}20`, borderColor: `${panel.color}50` }}
          aria-hidden="true"
        >
          <Icon size={20} style={{ color: panel.color }} />
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-5">
        <div className="text-white font-black text-2xl leading-tight mb-0.5">{panel.label}</div>
        <div className="text-sm font-medium" style={{ color: panel.color }}>{panel.sub}</div>
        <div
          className="mt-3 h-0.5 rounded-full w-12 opacity-60"
          style={{ background: panel.color }}
          aria-hidden="true"
        />
      </div>
    </div>
  );
}

export default function FootballShowcase() {
  const [titleRef, titleInView] = useInView(0.2);

  return (
    <section className="py-20 relative overflow-hidden" aria-label="FIFA World Cup 2026 highlights">
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-brand-green/5 blur-3xl rounded-full" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div
          ref={titleRef}
          className={`text-center mb-14 transition-all duration-700 ${titleInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
        >
          <div className="inline-flex items-center gap-2 bg-brand-pink/10 border border-brand-pink/25 rounded-full px-4 py-1.5 mb-4">
            <Flame size={13} className="text-brand-pink" aria-hidden="true" />
            <span className="text-brand-pink text-sm font-semibold">FIFA World Cup 2026</span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-black text-white mb-4 leading-tight">
            The World's Biggest<br />
            <span className="shimmer-text">Football Festival</span>
          </h2>
          <p className="text-gray-300 text-lg max-w-xl mx-auto">
            Hosted across three nations, 16 venues, and millions of passionate fans — powered by StadiumAI.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PANELS.map((panel, i) => (
            <ShowcasePanel key={panel.key} panel={panel} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
