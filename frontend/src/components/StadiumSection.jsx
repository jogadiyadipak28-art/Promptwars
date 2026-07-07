import React, { useState, useRef, useEffect } from 'react';
import { MapPin, Users, ChevronRight, Trophy } from 'lucide-react';
import SafeImage from './SafeImage';
import { STADIUM_IMAGES, FLAGS } from '../assets/images';

const OCCUPANCY_MOCK = {
  metlife: 82, atandt: 89, sofi: 84, azteca: 93, bcplace: 90
};

const MATCHES = [
  { home: 'Brazil', away: 'Argentina', date: 'Jun 14', time: '20:00', stadium: 'MetLife Stadium' },
  { home: 'France', away: 'Germany',   date: 'Jun 15', time: '17:00', stadium: 'AT&T Stadium' },
  { home: 'Spain',  away: 'Portugal',  date: 'Jun 16', time: '20:00', stadium: 'SoFi Stadium' },
];

function OccupancyBar({ pct }) {
  const [animated, setAnimated] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 300);
    return () => clearTimeout(timer);
  }, []);
  return (
    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-1000 ease-out ${
          pct >= 90 ? 'bg-brand-red' : pct >= 80 ? 'bg-brand-pink' : 'bg-brand-green'
        }`}
        style={{ width: animated ? `${pct}%` : '0%' }}
      />
    </div>
  );
}

function FlagBadge({ country }) {
  const src = FLAGS[country];
  if (!src) {
    return (
      <div className="absolute top-2 left-2 w-7 h-5 rounded bg-white/10 border border-white/20 flex items-center justify-center">
        <Trophy size={12} className="text-white" />
      </div>
    );
  }
  return (
    <div className="absolute top-2 left-2 w-8 h-6 rounded overflow-hidden border border-white/30 shadow-md">
      <SafeImage src={src} alt={country} className="w-full h-full object-cover" />
    </div>
  );
}

export default function StadiumSection({ stadiums, selected, onChange }) {
  const [hovered, setHovered] = useState(null);

  if (!stadiums?.length) return null;

  return (
    <section className="py-16 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Trophy size={16} className="text-brand-green" />
              <span className="text-brand-blue text-sm font-semibold uppercase tracking-wider">2026 Venues</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white">Select Your Stadium</h2>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-brand-blue/60 text-sm">
            <div className="w-2 h-2 rounded-full bg-brand-green animate-pulse" />
            Live occupancy data
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-10">
          {stadiums.map((s, i) => {
            const occ = OCCUPANCY_MOCK[s.id] || 80;
            const img = STADIUM_IMAGES[s.id];
            const isSelected = selected?.id === s.id;
            const isHovered = hovered === s.id;

            return (
              <button
                key={s.id}
                onClick={() => onChange(s)}
                onMouseEnter={() => setHovered(s.id)}
                onMouseLeave={() => setHovered(null)}
                className={`relative overflow-hidden rounded-2xl border text-left transition-all duration-300 group
                  ${isSelected
                    ? 'border-brand-green ring-2 ring-brand-green/30 scale-[1.02]'
                    : 'border-brand-blue/15 hover:border-brand-blue/35 hover:scale-[1.01]'
                  }`}
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="relative h-36 overflow-hidden">
                  <SafeImage
                    src={img}
                    alt={s.name}
                    className={`w-full h-full object-cover transition-transform duration-500 ${isHovered || isSelected ? 'scale-110' : 'scale-100'}`}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-brand-darker via-brand-blue/15 to-transparent" />
                  {isSelected && (
                    <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-brand-green flex items-center justify-center shadow-lg">
                      <div className="w-2 h-2 rounded-full bg-brand-darker" />
                    </div>
                  )}
                  <FlagBadge country={s.country} />
                </div>

                <div className={`p-3 transition-colors duration-300 ${isSelected ? 'bg-brand-green/10' : 'bg-brand-dark/80'}`}>
                  <div className="font-bold text-white text-sm leading-tight mb-0.5 line-clamp-1">{s.name}</div>
                  <div className="flex items-center gap-1 text-brand-blue/60 text-xs mb-2">
                    <MapPin size={9} />
                    <span className="truncate">{s.city}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs mb-1">
                    <span className="text-brand-blue/50 flex items-center gap-1">
                      <Users size={9} /> {(s.capacity / 1000).toFixed(0)}K cap.
                    </span>
                    <span className={`font-bold ${occ >= 90 ? 'text-brand-red' : occ >= 80 ? 'text-brand-pink' : 'text-brand-green'}`}>
                      {occ}%
                    </span>
                  </div>
                  <OccupancyBar pct={occ} />
                </div>
              </button>
            );
          })}
        </div>

        <div className="relative overflow-hidden rounded-2xl bg-brand-blue/5 border border-brand-blue/15 px-6 py-4">
          <div className="flex items-center gap-4 overflow-x-auto scrollbar-hide">
            <div className="flex items-center gap-2 flex-shrink-0 mr-4">
              <div className="w-2 h-2 rounded-full bg-brand-pink animate-pulse" />
              <span className="text-xs text-brand-pink font-bold uppercase tracking-wider">Upcoming</span>
            </div>
            {MATCHES.map((m, i) => (
              <div key={i} className="flex items-center gap-3 flex-shrink-0 bg-brand-green/5 rounded-xl px-4 py-2 border border-brand-green/15 hover:border-brand-green/30 transition-colors cursor-default">
                <span className="text-white font-bold text-sm">{m.home}</span>
                <span className="text-brand-red text-xs font-black">VS</span>
                <span className="text-white font-bold text-sm">{m.away}</span>
                <span className="w-px h-4 bg-brand-blue/20" />
                <span className="text-brand-blue/60 text-xs">{m.date} · {m.time}</span>
                <ChevronRight size={12} className="text-brand-green/50" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
