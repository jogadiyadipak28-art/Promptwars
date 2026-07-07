import React, { useState } from 'react';
import { Leaf, Loader, Recycle, Wind, Droplets, Zap } from 'lucide-react';
import { sustainabilityAdvice } from '../api/client';

const SUSTAINABILITY_TOPICS = [
  { icon: '🚌', label: 'Green Transport', query: 'What are the greenest ways to get to and from the stadium?' },
  { icon: '♻️', label: 'Recycling', query: 'Where are the recycling stations and what can I recycle?' },
  { icon: '💧', label: 'Water Use', query: 'How is the venue reducing water consumption during the tournament?' },
  { icon: '⚡', label: 'Energy', query: 'Tell me about the renewable energy initiatives at this venue.' },
  { icon: '🥗', label: 'Food Waste', query: 'How is the stadium handling food waste and sustainable food options?' },
  { icon: '🌡️', label: 'Carbon Footprint', query: 'How can I offset my carbon footprint from attending this match?' }
];

const STATS = [
  { icon: Recycle, label: 'Recycling Rate', value: '73%', color: 'text-green-400' },
  { icon: Zap, label: 'Renewable Energy', value: '45%', color: 'text-yellow-400' },
  { icon: Droplets, label: 'Water Saved', value: '2.1M L', color: 'text-blue-400' },
  { icon: Wind, label: 'CO₂ Offset', value: '18K ton', color: 'text-teal-400' }
];

export default function SustainabilityPanel({ stadiumId, stadium }) {
  const [query, setQuery] = useState('');
  const [advice, setAdvice] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const askAdvice = async (q) => {
    const finalQuery = q || query.trim();
    if (!finalQuery) { setError('Please enter a question.'); return; }
    setError('');
    setLoading(true);
    setAdvice('');
    try {
      const res = await sustainabilityAdvice({ stadiumId: stadiumId || 'metlife', query: finalQuery });
      setAdvice(res.data.advice);
    } catch {
      setError('Sustainability service unavailable.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {STATS.map(stat => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="card text-center">
              <Icon size={24} className={`mx-auto mb-2 ${stat.color}`} />
              <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
              <div className="text-xs text-gray-400 mt-0.5">{stat.label}</div>
            </div>
          );
        })}
      </div>

      <div className="card">
        <div className="flex items-center gap-3 mb-5">
          <Leaf size={20} className="text-green-400" />
          <h2 className="font-semibold text-white text-lg">Sustainability Advisor</h2>
          <span className="badge bg-green-900/30 text-green-400 border border-green-800/50">🌍 Green WC 2026</span>
        </div>

        {/* Topic Shortcuts */}
        <div className="mb-5">
          <div className="text-xs text-gray-400 uppercase tracking-wider mb-2">Explore Topics</div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {SUSTAINABILITY_TOPICS.map(t => (
              <button
                key={t.label}
                onClick={() => { setQuery(t.query); askAdvice(t.query); }}
                className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 text-sm px-3 py-2.5 rounded-xl transition-all text-left"
              >
                <span className="text-lg">{t.icon}</span>
                <span>{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Custom Query */}
        <div className="flex gap-3 mb-4">
          <input
            className="input flex-1"
            placeholder="Ask about sustainability initiatives, eco tips..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && askAdvice()}
          />
          <button onClick={() => askAdvice()} disabled={loading} className="btn-primary flex items-center gap-2">
            {loading ? <Loader size={16} className="animate-spin" /> : <Leaf size={16} />}
            Ask
          </button>
        </div>

        {error && <div className="bg-red-900/20 border border-red-800 text-red-400 text-sm rounded-xl px-4 py-3">{error}</div>}

        {advice && (
          <div className="bg-green-950/30 border border-green-800/40 rounded-xl p-4 fade-in-up">
            <div className="flex items-center gap-2 mb-2 text-green-400 text-sm font-medium">
              <Leaf size={14} /> Sustainability Advisor
            </div>
            <p className="text-gray-200 text-sm leading-relaxed">{advice}</p>
          </div>
        )}
        {loading && (
          <div className="flex items-center gap-3 text-gray-400 text-sm py-2">
            <Loader size={16} className="animate-spin text-green-400" />
            Generating sustainability insights...
          </div>
        )}
      </div>
    </div>
  );
}
