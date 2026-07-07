import React, { useState, useEffect } from 'react';
import { Trophy, Users, Cpu, Zap, UserRound } from 'lucide-react';

export default function Header({ viewMode, setViewMode }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40);
    // passive: true — never calls preventDefault, so the browser can optimise scrolling
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'bg-[#081420]/95 backdrop-blur-xl border-b border-brand-blue/15 shadow-2xl shadow-black/50'
          : 'bg-transparent'
      }`}
    >
      <nav
        aria-label="Main navigation"
        className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between"
      >
        {/* Logo — wrapped in a landmark span so screen readers announce it */}
        <a
          href="#main-content"
          className="flex items-center gap-3 group focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue rounded-xl"
          aria-label="StadiumAI — FIFA World Cup 2026, go to main content"
          onClick={(e) => { e.preventDefault(); document.getElementById('main-content')?.scrollIntoView({ behavior: 'smooth' }); }}
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300
            bg-gradient-to-br from-brand-blue to-brand-green shadow-lg shadow-brand-green/20
            group-hover:shadow-brand-blue/30 group-hover:scale-105"
            aria-hidden="true"
          >
            <Trophy size={20} className="text-brand-darker" />
          </div>
          <div>
            <div className="font-black text-white text-lg leading-none tracking-tight flex items-center gap-2">
              StadiumAI
              <span
                className="hidden sm:inline badge bg-brand-green/15 text-brand-green border border-brand-green/25 text-[10px]"
                aria-hidden="true"
              >
                <Cpu size={9} /> GENAI
              </span>
            </div>
            <div className="text-brand-blue/60 text-[11px] font-medium tracking-widest uppercase">FIFA WC 2026</div>
          </div>
        </a>

        {/* Live status pill */}
        <div
          className="hidden md:flex items-center gap-1 bg-brand-blue/5 border border-brand-blue/15 rounded-full px-4 py-1.5"
          aria-label="System status: AI online, live match day operations"
        >
          <div className="w-2 h-2 rounded-full bg-brand-green animate-pulse" aria-hidden="true" />
          <span className="text-xs text-brand-blue font-medium">Live · Match Day Operations</span>
          <div className="w-1 h-1 rounded-full bg-brand-pink/50 mx-1" aria-hidden="true" />
          <Zap size={11} className="text-brand-pink" aria-hidden="true" />
          <span className="text-xs text-brand-green font-semibold">AI Online</span>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-3">
          <div
            className="flex items-center gap-0.5 bg-white/5 border border-brand-blue/15 p-1 rounded-xl"
            role="group"
            aria-label="View mode"
          >
            <button
              aria-label="Fan view mode"
              aria-pressed={viewMode === 'fan'}
              onClick={() => setViewMode('fan')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200
                focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue ${
                viewMode === 'fan'
                  ? 'bg-gradient-to-r from-brand-blue to-brand-green text-brand-darker shadow-md'
                  : 'text-brand-blue/60 hover:text-brand-blue'
              }`}
            >
              <UserRound size={13} aria-hidden="true" />
              <span className="hidden sm:inline">Fan</span>
            </button>
            <button
              aria-label="Ops view mode"
              aria-pressed={viewMode === 'ops'}
              onClick={() => setViewMode('ops')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200
                focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-pink ${
                viewMode === 'ops'
                  ? 'bg-gradient-to-r from-brand-pink to-brand-red text-white shadow-md'
                  : 'text-brand-blue/60 hover:text-brand-pink'
              }`}
            >
              <Users size={13} aria-hidden="true" />
              <span className="hidden sm:inline">Ops</span>
            </button>
          </div>
        </div>
      </nav>
    </header>
  );
}
