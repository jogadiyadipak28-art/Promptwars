import React, { useRef, useEffect, useState } from 'react';
import { Star, TrendingUp, Award } from 'lucide-react';
import SafeImage from './SafeImage';
import { SHOWCASE_IMAGES, FOOTBALL_ICON } from '../assets/images';
import { theme } from '../assets/theme';

const SHOWCASE = [
  {
    title: 'World-Class Venues',
    desc: '16 iconic stadiums across USA, Canada & Mexico — each equipped with AI-powered operations.',
    image: SHOWCASE_IMAGES.venues,
    stat: '16',
    statLabel: 'Stadiums',
    icon: Award,
    accent: theme.blue,
  },
  {
    title: 'Elite Competition',
    desc: '32 nations, 48 matches, one unforgettable tournament — powered by real-time GenAI assistance.',
    image: SHOWCASE_IMAGES.nations,
    stat: '32',
    statLabel: 'Nations',
    icon: Star,
    accent: theme.green,
  },
  {
    title: 'Fan-First Experience',
    desc: 'From gate to seat, every fan gets personalized navigation, translation, and live updates.',
    image: SHOWCASE_IMAGES.fans,
    stat: '5M+',
    statLabel: 'Expected Fans',
    icon: TrendingUp,
    accent: theme.pink,
  },
];

function useInView(threshold = 0.2) {
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

function ShowcaseRow({ item, index, reverse }) {
  const [ref, inView] = useInView(0.15);
  const Icon = item.icon;

  return (
    <div
      ref={ref}
      className={`grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center
        transition-all duration-700 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      <div className={`relative group ${reverse ? 'lg:order-2' : ''}`}>
        <div className="relative h-72 sm:h-80 lg:h-96 rounded-2xl overflow-hidden border border-brand-blue/20 shadow-2xl">
          <SafeImage
            src={item.image}
            alt={item.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-brand-darker/95 via-brand-green/10 to-transparent" />
          <div
            className="absolute inset-0 opacity-30 mix-blend-overlay transition-opacity duration-500 group-hover:opacity-50"
            style={{ background: `linear-gradient(135deg, ${item.accent}50, transparent)` }}
          />

          <div className="absolute bottom-5 left-5 bg-brand-darker/80 backdrop-blur-md border border-brand-blue/20 rounded-2xl px-5 py-3 flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: `${item.accent}20`, border: `1px solid ${item.accent}40` }}
            >
              <Icon size={18} style={{ color: item.accent }} />
            </div>
            <div>
              <div className="text-2xl font-black text-white leading-none">{item.stat}</div>
              <div className="text-brand-blue/70 text-xs font-medium">{item.statLabel}</div>
            </div>
          </div>
        </div>

        <div
          className="absolute -inset-4 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10 blur-2xl"
          style={{ background: `${item.accent}12` }}
        />
      </div>

      <div className={`space-y-5 ${reverse ? 'lg:order-1 lg:text-right' : ''}`}>
        <div
          className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 border text-sm font-semibold
            bg-brand-blue/10 border-brand-blue/25 text-brand-blue ${reverse ? 'lg:ml-auto' : ''}`}
        >
          <Icon size={14} />
          WC 2026
        </div>
        <h3 className="text-3xl sm:text-4xl font-black text-white leading-tight">{item.title}</h3>
        <p className="text-brand-blue/70 text-lg leading-relaxed max-w-md">{item.desc}</p>
        <div
          className={`h-1 w-16 rounded-full ${reverse ? 'lg:ml-auto' : ''}`}
          style={{ background: `linear-gradient(90deg, ${item.accent}, transparent)` }}
        />
      </div>
    </div>
  );
}

export default function FootballShowcase() {
  const [titleRef, titleInView] = useInView(0.3);

  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none opacity-[0.04]">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] border-2 border-brand-green rounded-lg" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 border-2 border-brand-blue rounded-full" />
        <div className="absolute top-1/2 left-0 right-0 h-px bg-brand-pink" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        <div
          ref={titleRef}
          className={`text-center mb-20 transition-all duration-700 ${titleInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
        >
          <div className="inline-flex items-center gap-2 bg-brand-green/10 border border-brand-green/25 rounded-full px-4 py-1.5 mb-4">
            <img src={FOOTBALL_ICON} alt="" width="20" height="20" className="w-5 h-5" aria-hidden="true" />
            <span className="text-brand-green text-sm font-semibold">The Beautiful Game Meets AI</span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-black text-white mb-4">
            Built for the<br />
            <span className="shimmer-text">Greatest Show on Earth</span>
          </h2>
          <p className="text-brand-blue/70 text-lg max-w-2xl mx-auto">
            StadiumAI brings cutting-edge generative AI to every corner of FIFA World Cup 2026 —
            from the pitch to the stands.
          </p>
        </div>

        <div className="space-y-24">
          {SHOWCASE.map((item, i) => (
            <ShowcaseRow key={item.title} item={item} index={i} reverse={i % 2 === 1} />
          ))}
        </div>
      </div>
    </section>
  );
}
