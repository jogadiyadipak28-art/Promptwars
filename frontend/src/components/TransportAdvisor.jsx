import React, { useState } from 'react';
import { Zap, MapPin, Users, Accessibility, Loader, Train, Bus, Car } from 'lucide-react';
import { transportRecommend } from '../api/client';

const LANGUAGES = ['English', 'Spanish', 'French', 'Portuguese', 'Arabic', 'German'];

const TRANSPORT_ICONS = {
  subway: Train, bus: Bus, parking: Car, rideshare: Car
};

export default function TransportAdvisor({ stadiumId, stadium }) {
  const [origin, setOrigin] = useState('');
  const [arrivalTime, setArrivalTime] = useState('');
  const [groupSize, setGroupSize] = useState(1);
  const [accessibility, setAccessibility] = useState(false);
  const [language, setLanguage] = useState('English');
  const [recommendation, setRecommendation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRecommend = async () => {
    if (!origin.trim()) { setError('Please enter your origin.'); return; }
    if (!stadiumId) { setError('Please select a stadium.'); return; }
    setError('');
    setLoading(true);
    setRecommendation('');
    try {
      const res = await transportRecommend({ stadiumId, origin, arrivalTime, groupSize, accessibility, language });
      setRecommendation(res.data.recommendation);
    } catch {
      setError('Transport service unavailable. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="flex items-center gap-3 mb-5">
          <Zap size={20} className="text-[#00A8E0]" />
          <h2 className="font-semibold text-white text-lg">Smart Transport Advisor</h2>
          {stadium && <span className="badge bg-gray-800 text-gray-400 border border-gray-700">{stadium.name}</span>}
        </div>

        {/* Info Cards for stadium transport */}
        {stadium?.transportation && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
            {Object.entries(stadium.transportation).map(([mode, info]) => {
              const Icon = TRANSPORT_ICONS[mode] || Zap;
              const labels = { subway: '🚇 Metro/Rail', bus: '🚌 Bus', parking: '🅿️ Parking', rideshare: '🚗 Rideshare' };
              return (
                <div key={mode} className="bg-gray-800 rounded-xl p-3 border border-gray-700">
                  <div className="text-xs text-gray-400 mb-1">{labels[mode] || mode}</div>
                  <div className="text-xs text-white leading-relaxed">
                    {Array.isArray(info) ? info[0] : info}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Form */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-xs text-gray-400 mb-1.5 block">📍 Your Origin</label>
            <input className="input" placeholder="e.g. Downtown Hotel, Airport, Times Square" value={origin} onChange={e => setOrigin(e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1.5 block">⏰ Desired Arrival Time</label>
            <input className="input" type="time" value={arrivalTime} onChange={e => setArrivalTime(e.target.value)} />
          </div>
        </div>

        <div className="flex flex-wrap items-end gap-4 mb-5">
          <div>
            <label className="text-xs text-gray-400 mb-1.5 block">
              <Users size={12} className="inline mr-1" />Group Size
            </label>
            <input
              className="input w-24"
              type="number"
              min={1}
              max={50}
              value={groupSize}
              onChange={e => setGroupSize(Number(e.target.value))}
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1.5 block">🌐 Language</label>
            <select className="select w-36" value={language} onChange={e => setLanguage(e.target.value)}>
              {LANGUAGES.map(l => <option key={l}>{l}</option>)}
            </select>
          </div>
          <label className="flex items-center gap-2 cursor-pointer pb-1">
            <div className={`w-10 h-6 rounded-full transition-all ${accessibility ? 'bg-[#003DA5]' : 'bg-gray-700'} relative`}>
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${accessibility ? 'left-5' : 'left-1'}`} />
            </div>
            <span className="text-sm text-gray-300 flex items-center gap-1.5">
              <Accessibility size={14} className="text-[#00A8E0]" /> Accessibility Needs
            </span>
            <input type="checkbox" className="hidden" checked={accessibility} onChange={e => setAccessibility(e.target.checked)} />
          </label>
        </div>

        {error && <div className="bg-red-900/20 border border-red-800 text-red-400 text-sm rounded-xl px-4 py-3 mb-4">{error}</div>}

        <button onClick={handleRecommend} disabled={loading} className="btn-primary flex items-center gap-2">
          {loading ? <Loader size={16} className="animate-spin" /> : <Zap size={16} />}
          {loading ? 'Finding best route...' : 'Get Transport Recommendation'}
        </button>
      </div>

      {recommendation && (
        <div className="card fade-in-up">
          <div className="flex items-center gap-2 mb-4">
            <Zap size={18} className="text-[#FFD700]" />
            <span className="font-semibold text-white">AI Transport Recommendation</span>
          </div>
          <div className="bg-gray-800/50 rounded-xl p-4">
            <p className="text-gray-200 text-sm leading-relaxed whitespace-pre-wrap">{recommendation}</p>
          </div>
          <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
            <span>📍 {origin} → {stadium?.name}</span>
            <span>👥 {groupSize} {groupSize === 1 ? 'person' : 'people'}</span>
            {accessibility && <span>♿ Accessible</span>}
          </div>
        </div>
      )}
    </div>
  );
}
