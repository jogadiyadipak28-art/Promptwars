import React, { useRef, useEffect, useState } from 'react';
import { Bot, Map, Users, Globe, Zap, Leaf, ArrowRight, Sparkles } from 'lucide-react';
import SafeImage from './SafeImage';
import { FEATURE_IMAGES } from '../assets/images';
import { theme } from '../assets/theme';

const FEATURE_CARDS = [
  {
    id: 'chatbot',
    icon: Bot,
    title: 'AI Chatbot',
    subtitle: 'Julep AI · GPT-4',
    desc: 'Conversational assistant that understands your question in any language and gives live stadium-aware answers.',
    gradient: 'from-brand-blue/20 to-brand-blue-deep/10',
    accent: theme.blue,
    image: FEATURE_IMAGES.chatbot,
    tag: 'NEW',
  },
  {
    id: 'navigation',
    icon: Map,
    title: 'AI Navigation',
    subtitle: 'Indoor wayfinding',
    desc: 'Step-by-step crowd-aware directions to any seat, facility, or exit — with full accessibility routing.',
    gradient: 'from-brand-green/20 to-brand-green-deep/10',
    accent: theme.green,
    image: FEATURE_IMAGES.navigation,
  },
  {
    id: 'crowd',
    icon: Users,
    title: 'Crowd Intelligence',
    subtitle: 'Real-time density',
    desc: 'Live occupancy tracking, gate wait-times, hotspot alerts, and AI-generated staff recommendations.',
    gradient: 'from-brand-red/20 to-brand-pink/10',
    accent: theme.red,
    image: FEATURE_IMAGES.crowd,
  },
  {
    id: 'translate',
    icon: Globe,
    title: 'Multilingual',
    subtitle: '20+ languages',
    desc: 'Instant translation of announcements, signs, and conversations for fans from every corner of the world.',
    gradient: 'from-brand-green-deep/20 to-brand-blue/10',
    accent: theme.greenDeep,
    image: FEATURE_IMAGES.translate,
  },
  {
    id: 'transport',
    icon: Zap,
    title: 'Smart Transport',
    subtitle: 'Eco-first routing',
    desc: 'AI-powered transit recommendations based on your origin, group size, arrival time, and sustainability goals.',
    gradient: 'from-brand-blue/15 to-brand-green/10',
    accent: theme.blueDeep,
    image: FEATURE_IMAGES.transport,
  },
  {
    id: 'sustainability',
    icon: Leaf,
    title: 'Sustainability',
    subtitle: 'Green WC 2026',
    desc: 'Recycling guides, carbon offset tips, eco-transport suggestions, and tournament sustainability stats.',
    gradient: 'from-brand-green/15 to-brand-blue/5',
    accent: theme.green,
    image: FEATURE_IMAGES.sustainability,
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

function FeatureCard({ card, index, onSelect }) {
  const [ref, inView] = useInView(0.1);
  const Icon = card.icon;

  return (
    <div
      ref={ref}
      onClick={() => onSelect(card.id)}
      className={`feature-card group bg-gradient-to-br ${card.gradient} hover-glow
        transition-all duration-500 cursor-pointer
        ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
      style={{ transitionDelay: `${index * 80}ms` }}
    >
      <div className="relative h-44 overflow-hidden rounded-t-2xl">
        <SafeImage
          src={card.image}
          alt={card.title}
          className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-darker via-brand-dark/40 to-transparent" />
        <div className="absolute inset-0 opacity-25" style={{ background: `radial-gradient(circle at 50% 100%, ${card.accent}50, transparent 70%)` }} />

        {card.tag && (
          <div className="absolute top-3 right-3 badge bg-brand-pink/20 text-brand-pink border border-brand-pink/30 text-[10px] font-bold">
            <Sparkles size={9} /> {card.tag}
          </div>
        )}

        <div
          className="absolute bottom-3 left-4 w-10 h-10 rounded-xl flex items-center justify-center shadow-lg backdrop-blur-sm"
          style={{ background: `${card.accent}20`, border: `1px solid ${card.accent}50` }}
        >
          <Icon size={18} style={{ color: card.accent }} />
        </div>
      </div>

      <div className="p-5">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h3 className="font-bold text-white text-lg leading-tight">{card.title}</h3>
            <p className="text-xs font-medium mt-0.5" style={{ color: card.accent }}>{card.subtitle}</p>
          </div>
          <ArrowRight size={16} className="text-brand-blue/40 group-hover:text-brand-green group-hover:translate-x-1 transition-all duration-200 mt-1 flex-shrink-0" />
        </div>
        <p className="text-brand-blue/70 text-sm leading-relaxed">{card.desc}</p>
      </div>

      <div className="h-0.5 mx-5 mb-4 rounded-full opacity-50" style={{ background: `linear-gradient(90deg, transparent, ${card.accent}, transparent)` }} />
    </div>
  );
}

export default function FeaturesSection({ onSelectFeature }) {
  const [titleRef, titleInView] = useInView(0.2);

  return (
    <section className="py-20 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-brand-green/5 to-brand-blue/5 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div
          ref={titleRef}
          className={`text-center mb-14 transition-all duration-700 ${titleInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
        >
          <div className="inline-flex items-center gap-2 bg-brand-blue/10 border border-brand-blue/25 rounded-full px-4 py-1.5 mb-4">
            <Sparkles size={13} className="text-brand-green" />
            <span className="text-brand-blue text-sm font-semibold">AI-Powered Features</span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-black text-white mb-4 leading-tight">
            Every Tool You Need<br />
            <span className="shimmer-text">on Match Day</span>
          </h2>
          <p className="text-brand-blue/70 text-lg max-w-xl mx-auto leading-relaxed">
            From arrival to departure, StadiumAI handles navigation, safety, communication, and operations — all in one place.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURE_CARDS.map((card, i) => (
            <FeatureCard key={card.id} card={card} index={i} onSelect={onSelectFeature} />
          ))}
        </div>
      </div>
    </section>
  );
}
