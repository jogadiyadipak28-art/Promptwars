import React, { useState, useEffect } from 'react';
import { Trophy, Users, Cpu, Zap, UserRound } from 'lucide-react';

export default function Header({ viewMode, setViewMode }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
      scrolled
        ? 'bg-brand-darker/95 backdrop-blur-xl border-b border-brand-blue/15 shadow-2xl shadow-black/50'
        : 'bg-transparent'
    }`}>
      <nav aria-label="Main navigation" className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">

        <div className="flex items-center gap-3 group cursor-pointer">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300
            bg-gradient-to-br from-brand-blue to-brand-green shadow-lg shadow-brand-green/20
            group-hover:shadow-brand-blue/30 group-hover:scale-105">
            <Trophy size={20} className="text-brand-darker" />
          </div>
          <div>
            <div className="font-black text-white text-lg leading-none tracking-tight flex items-center gap-2">
              StadiumAI
              <span className="hidden sm:inline badge bg-brand-green/15 text-brand-green border border-brand-green/25 text-[10px]">
                <Cpu size={9} /> GENAI
              </span>
            </div>
            <div className="text-brand-blue/60 text-[11px] font-medium tracking-widest uppercase">FIFA WC 2026</div>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-1 bg-brand-blue/5 border border-brand-blue/15 rounded-full px-4 py-1.5">
          <div className="w-2 h-2 rounded-full bg-brand-green animate-pulse" />
          <span className="text-xs text-brand-blue font-medium">Live · Match Day Operations</span>
          <div className="w-1 h-1 rounded-full bg-brand-pink/50 mx-1" />
          <Zap size={11} className="text-brand-pink" />
          <span className="text-xs text-brand-green font-semibold">AI Online</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-0.5 bg-white/5 border border-brand-blue/15 p-1 rounded-xl">
            <button
              aria-label="Fan view mode"
              onClick={() => setViewMode('fan')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                viewMode === 'fan'
                  ? 'bg-gradient-to-r from-brand-blue to-brand-green text-brand-darker shadow-md'
                  : 'text-brand-blue/60 hover:text-brand-blue'
              }`}
            >
              <UserRound size={13} /> <span className="hidden sm:inline">Fan</span>
            </button>
            <button
              aria-label="Ops view mode"
              onClick={() => setViewMode('ops')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                viewMode === 'ops'
                  ? 'bg-gradient-to-r from-brand-pink to-brand-red text-white shadow-md'
                  : 'text-brand-blue/60 hover:text-brand-pink'
              }`}
            >
              <Users size={13} /> <span className="hidden sm:inline">Ops</span>
            </button>
          </div>
        </div>
      </nav>
    </header>
  );
}
