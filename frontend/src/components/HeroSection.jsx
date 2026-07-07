import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, Zap, Shield, Globe2, Users, Trophy, Calendar, Building2, Globe, UserRound } from 'lucide-react';
import SafeImage from './SafeImage';
import { IMAGES, FOOTBALL_ICON } from '../assets/images';
import { theme } from '../assets/theme';

const STATS = [
  { value: '48', label: 'Matches', icon: Calendar, color: theme.blue },
  { value: '16', label: 'Venues', icon: Building2, color: theme.green },
  { value: '32', label: 'Nations', icon: Globe, color: theme.pink },
  { value: '5M+', label: 'Fans', icon: UserRound, color: theme.red },
];

const FEATURES = [
  { icon: Zap,    color: 'from-brand-blue to-brand-blue-deep',   label: 'AI Navigation',   desc: 'Real-time indoor wayfinding' },
  { icon: Shield, color: 'from-brand-green to-brand-green-deep', label: 'Crowd Safety',    desc: 'Live occupancy intelligence' },
  { icon: Globe2, color: 'from-brand-blue-deep to-brand-green',  label: '20+ Languages',   desc: 'Multilingual assistance' },
  { icon: Users,  color: 'from-brand-pink to-brand-red',         label: 'Ops Command',     desc: 'Staff & volunteer tools' },
];

const PARTICLE_COLORS = [theme.blue, theme.green, theme.pink, theme.red];

function AnimatedCounter({ target, duration = 1500 }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        const numeric = parseInt(target.replace(/\D/g, ''));
        const suffix = target.replace(/[0-9]/g, '');
        const steps = 40;
        const increment = numeric / steps;
        let current = 0;
        const timer = setInterval(() => {
          current += increment;
          if (current >= numeric) {
            setCount(target);
            clearInterval(timer);
          } else {
            setCount(Math.floor(current) + suffix);
          }
        }, duration / steps);
      }
    }, { threshold: 0.5 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration]);

  return <span ref={ref}>{count || '0'}</span>;
}

export default function HeroSection({ onScrollToApp }) {
  const [loaded, setLoaded] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const timer = setTimeout(() => setLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({
      x: ((e.clientX - rect.left) / rect.width - 0.5) * 20,
      y: ((e.clientY - rect.top) / rect.height - 0.5) * 20,
    });
  };

  return (
    <section
      className="relative min-h-screen flex flex-col justify-center overflow-hidden"
      onMouseMove={handleMouseMove}
    >
      <div className="absolute inset-0 z-0">
        <SafeImage
          src={IMAGES.heroBg}
          alt="Stadium"
          className="w-full h-full object-cover object-center"
          style={{
            transform: `scale(1.08) translate(${mousePos.x * 0.3}px, ${mousePos.y * 0.3}px)`,
            transition: 'transform 0.8s cubic-bezier(.16,1,.3,1)',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-brand-darker/98 via-brand-dark/90 to-brand-blue/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-darker via-transparent to-brand-dark/70" />
        <div className="absolute inset-0 bg-gradient-to-br from-brand-green/15 via-transparent to-brand-pink/10" />
      </div>

      <div className="absolute inset-0 z-0 dot-pattern opacity-20" />

      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full opacity-20"
            style={{
              width: `${Math.random() * 4 + 2}px`,
              height: `${Math.random() * 4 + 2}px`,
              background: PARTICLE_COLORS[i % PARTICLE_COLORS.length],
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float ${4 + i * 0.5}s ease-in-out ${i * 0.3}s infinite`,
            }}
          />
        ))}
      </div>

      <div
        className="absolute right-0 bottom-0 z-[1] hidden lg:block"
        style={{
          transform: `translate(${mousePos.x * -0.5}px, ${mousePos.y * -0.3}px)`,
          transition: 'transform 1s cubic-bezier(.16,1,.3,1)',
        }}
      >
        <div className="relative w-[480px] h-[600px]">
          <SafeImage
            src={IMAGES.playerMain}
            alt="Football player"
            className={`w-full h-full object-cover object-top transition-all duration-1000 ${
              loaded ? 'opacity-80 scale-100' : 'opacity-0 scale-95'
            }`}
            style={{
              maskImage: 'linear-gradient(to left, rgba(0,0,0,0.8) 40%, transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to left, rgba(0,0,0,0.6) 30%, transparent 100%)',
              filter: 'brightness(0.9) contrast(1.05)',
            }}
          />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-brand-green/25 blur-3xl rounded-full" />
        </div>
      </div>

      <div className="absolute right-0 top-1/3 z-[1] lg:hidden opacity-25 pointer-events-none">
        <SafeImage
          src={IMAGES.playerAlt}
          alt=""
          aria-hidden="true"
          className="w-48 h-64 object-cover object-top"
          style={{
            maskImage: 'linear-gradient(to left, rgba(0,0,0,0.5) 0%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to left, rgba(0,0,0,0.5) 0%, transparent 100%)',
          }}
        />
      </div>

      <div className="absolute top-1/4 right-[15%] z-[2] hidden md:block ball-bounce pointer-events-none">
        <img src={FOOTBALL_ICON} alt="" width="56" height="56" aria-hidden="true" className="w-14 h-14 drop-shadow-2xl" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-28 pb-16 w-full">
        <div className="max-w-3xl">

          <div className={`inline-flex items-center gap-2 bg-brand-blue/10 border border-brand-blue/30 rounded-full px-4 py-1.5 mb-6 transition-all duration-700 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <Trophy size={14} className="text-brand-green" />
            <span className="text-brand-blue text-sm font-semibold tracking-wide">FIFA World Cup 2026</span>
            <span className="w-px h-4 bg-brand-green/30" />
            <span className="text-brand-green/80 text-xs">USA · Canada · Mexico</span>
          </div>

          <h1 className={`text-5xl sm:text-6xl lg:text-7xl font-black leading-[0.95] tracking-tight mb-4 transition-all duration-700 delay-100 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
            <span className="text-white block">The Future of</span>
            <span className="shimmer-text block">Stadium AI</span>
            <span className="text-white block">is Here.</span>
          </h1>

          <p className={`text-brand-blue/80 text-lg sm:text-xl leading-relaxed mb-8 max-w-xl transition-all duration-700 delay-200 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
            GenAI-powered navigation, crowd management, multilingual assistance,
            and real-time operations for the world's biggest sporting event.
          </p>

          <div className={`flex flex-wrap items-center gap-4 mb-12 transition-all duration-700 delay-300 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
            <button
              onClick={onScrollToApp}
              className="btn-white flex items-center gap-2 text-base px-7 py-3.5 rounded-2xl hover:scale-105 transition-transform duration-200"
            >
              <img src={FOOTBALL_ICON} alt="" width="20" height="20" className="w-5 h-5" aria-hidden="true" />
              Launch StadiumAI
            </button>
            <button
              onClick={onScrollToApp}
              className="flex items-center gap-2 text-white text-base font-semibold bg-brand-green/10 hover:bg-brand-green/20 border border-brand-green/30 px-7 py-3.5 rounded-2xl transition-all duration-200 hover:scale-105"
            >
              <Zap size={16} className="text-brand-green" /> See Features
            </button>
          </div>

          <div className={`flex flex-wrap gap-3 mb-14 transition-all duration-700 delay-400 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.label}
                  className="flex items-center gap-2 bg-white/[0.04] border border-brand-blue/20 rounded-full px-4 py-2 hover:bg-brand-blue/10 hover:border-brand-green/30 transition-all duration-200 cursor-default"
                >
                  <div className={`w-5 h-5 rounded-full bg-gradient-to-br ${f.color} flex items-center justify-center`}>
                    <Icon size={10} className="text-brand-darker" />
                  </div>
                  <span className="text-brand-blue/90 text-sm font-medium">{f.label}</span>
                </div>
              );
            })}
          </div>

          <div className={`grid grid-cols-4 gap-4 max-w-lg transition-all duration-700 delay-500 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
            {STATS.map(s => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="text-center group">
                  <div className="flex justify-center mb-1">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center border"
                      style={{ background: `${s.color}15`, borderColor: `${s.color}40` }}
                    >
                      <Icon size={14} style={{ color: s.color }} />
                    </div>
                  </div>
                  <div className="text-2xl font-black text-white leading-none">
                    <AnimatedCounter target={s.value} />
                  </div>
                  <div className="text-brand-blue/60 text-xs mt-0.5 font-medium">{s.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <button
        onClick={onScrollToApp}
        className={`absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-1 text-brand-blue/60 hover:text-brand-green transition-all duration-300 group ${loaded ? 'opacity-100' : 'opacity-0'}`}
      >
        <span className="text-xs tracking-widest uppercase font-medium">Explore</span>
        <ChevronDown size={20} className="animate-bounce group-hover:text-brand-pink transition-colors" />
      </button>
    </section>
  );
}
