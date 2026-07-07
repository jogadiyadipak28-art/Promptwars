import React, { useState, useCallback } from 'react';
import { Map, Navigation, Accessibility, ArrowRight, Loader } from 'lucide-react';
import { navigate } from '../api/client';

const LANGUAGES = ['English', 'Spanish', 'French', 'Portuguese', 'Arabic', 'German'];

const QUICK_ROUTES = [
  { from: 'Main Entrance Gate A', to: 'Section 112' },
  { from: 'Section 201', to: 'Nearest Restroom' },
  { from: 'Gate C', to: 'Medical Station' },
  { from: 'Parking Lot A', to: 'Gate D (Accessible)' },
  { from: 'Concourse Level 1', to: 'Family Zone Section 220' }
];

export default function NavigationTool({ stadiumId, stadium }) {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [language, setLanguage] = useState('English');
  const [accessibility, setAccessibility] = useState(false);
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleNavigate = useCallback(async () => {
    if (!from.trim() || !to.trim()) { setError('Please enter both origin and destination.'); return; }
    if (!stadiumId) { setError('Please select a stadium first.'); return; }
    setError('');
    setLoading(true);
    setResult('');
    try {
      const res = await navigate({ from, to, stadiumId, accessibility, language });
      setResult(res.data.instructions);
    } catch {
      setError('Navigation service unavailable. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }, [from, to, stadiumId, accessibility, language]);

  const applyQuickRoute = useCallback((route) => {
    setFrom(route.from);
    setTo(route.to);
  }, []);

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="flex items-center gap-3 mb-5">
          <Map size={20} className="text-[#00A8E0]" />
          <h2 className="font-semibold text-white text-lg">AI Indoor Navigation</h2>
          {stadium && (
            <span className="badge bg-gray-800 text-gray-400 border border-gray-700">
              {stadium.name}
            </span>
          )}
        </div>

        {/* Quick Routes */}
        <div className="mb-5">
          <div className="text-xs text-gray-400 uppercase tracking-wider mb-2">Quick Routes</div>
          <div className="flex flex-wrap gap-2">
            {QUICK_ROUTES.map(r => (
              <button
                key={r.from + r.to}
                onClick={() => applyQuickRoute(r)}
                className="text-xs bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 px-3 py-1.5 rounded-full transition-all flex items-center gap-1"
              >
                {r.from} <ArrowRight size={10} /> {r.to}
              </button>
            ))}
          </div>
        </div>

        {/* Form */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label htmlFor="nav-from" className="text-xs text-gray-400 mb-1.5 block">📍 From</label>
            <input id="nav-from" className="input" placeholder="e.g. Gate A, Section 112, Parking Lot" value={from} onChange={e => setFrom(e.target.value)} />
          </div>
          <div>
            <label htmlFor="nav-to" className="text-xs text-gray-400 mb-1.5 block">🎯 To</label>
            <input id="nav-to" className="input" placeholder="e.g. Section 301, Medical Station, Exit" value={to} onChange={e => setTo(e.target.value)} />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 mb-5">
          <div>
            <label htmlFor="nav-lang" className="text-xs text-gray-400 mb-1.5 block">🌐 Language</label>
            <select id="nav-lang" className="select w-36" value={language} onChange={e => setLanguage(e.target.value)}>
              {LANGUAGES.map(l => <option key={l}>{l}</option>)}
            </select>
          </div>
          <label htmlFor="nav-acc" className="flex items-center gap-2 cursor-pointer mt-4">
            <div
              className={`w-10 h-6 rounded-full transition-all ${accessibility ? 'bg-[#003DA5]' : 'bg-gray-700'} relative`}
              aria-hidden="true"
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${accessibility ? 'left-5' : 'left-1'}`} />
            </div>
            <span className="text-sm text-gray-300 flex items-center gap-1.5">
              <Accessibility size={14} className="text-[#00A8E0]" aria-hidden="true" /> Accessibility Route
            </span>
            <input
              id="nav-acc"
              type="checkbox"
              className="sr-only"
              checked={accessibility}
              onChange={e => setAccessibility(e.target.checked)}
              aria-label="Enable accessibility route"
            />
          </label>
        </div>

        {error && <div className="bg-red-900/20 border border-red-800 text-red-400 text-sm rounded-xl px-4 py-3 mb-4">{error}</div>}

        <button onClick={handleNavigate} disabled={loading} className="btn-primary flex items-center gap-2">
          {loading ? <Loader size={16} className="animate-spin" /> : <Navigation size={16} />}
          {loading ? 'Generating route...' : 'Get Directions'}
        </button>
      </div>

      {/* Results */}
      {result && (
        <div className="card fade-in-up">
          <div className="flex items-center gap-2 mb-4">
            <Navigation size={18} className="text-[#FFD700]" />
            <span className="font-semibold text-white">Navigation Instructions</span>
            {accessibility && (
              <span className="badge bg-blue-900/40 text-blue-400">
                <Accessibility size={10} /> Accessible Route
              </span>
            )}
          </div>
          <div className="bg-gray-800/50 rounded-xl p-4">
            <p className="text-gray-200 text-sm leading-relaxed whitespace-pre-wrap">{result}</p>
          </div>
          <div className="mt-3 text-xs text-gray-400 flex items-center gap-1">
            📍 {from} → {to} · {language}
          </div>
        </div>
      )}
    </div>
  );
}
