import React, { useState, useEffect } from 'react';
import { Users, AlertTriangle, CheckCircle, RefreshCw, Brain } from 'lucide-react';
import { getCrowdData, crowdAnalysis } from '../api/client';

const MOCK_CROWD = [
  { id: 'metlife', name: 'MetLife Stadium', city: 'East Rutherford, NJ', currentOccupancy: 67800, capacity: 82500, occupancyPct: 82, hotspots: ['Gate C', 'Section 112'], waitTimes: { 'Gate A': 8, 'Gate B': 12, 'Gate C': 22, 'Gate D': 6 } },
  { id: 'atandt', name: 'AT&T Stadium', city: 'Arlington, TX', currentOccupancy: 71200, capacity: 80000, occupancyPct: 89, hotspots: ['Gate B', 'Plaza Level West'], waitTimes: { 'Gate A': 5, 'Gate B': 18, 'Gate C': 11 } },
  { id: 'sofi', name: 'SoFi Stadium', city: 'Inglewood, CA', currentOccupancy: 58900, capacity: 70240, occupancyPct: 84, hotspots: ['South Gate'], waitTimes: { 'North': 7, 'South': 20, 'East': 9 } },
  { id: 'azteca', name: 'Estadio Azteca', city: 'Mexico City', currentOccupancy: 81000, capacity: 87523, occupancyPct: 93, hotspots: ['Puerta Sur', 'Sección 115'], waitTimes: { 'Norte': 10, 'Sur': 25 } },
  { id: 'bcplace', name: 'BC Place', city: 'Vancouver', currentOccupancy: 49000, capacity: 54500, occupancyPct: 90, hotspots: ['Gate B'], waitTimes: { 'Gate A': 9, 'Gate B': 16 } }
];

function RiskBadge({ pct }) {
  if (pct >= 90) return <span className="badge bg-red-900/40 text-red-400">🔴 Critical</span>;
  if (pct >= 80) return <span className="badge bg-yellow-900/40 text-yellow-400">🟡 High</span>;
  if (pct >= 65) return <span className="badge bg-blue-900/40 text-blue-400">🔵 Medium</span>;
  return <span className="badge bg-green-900/40 text-green-400">🟢 Low</span>;
}

export default function CrowdDashboard({ stadiumId }) {
  const [crowdData, setCrowdData] = useState(MOCK_CROWD);
  const [aiAnalysis, setAiAnalysis] = useState('');
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    getCrowdData()
      .then(r => setCrowdData(r.data))
      .catch(() => {}); // use mock on error
  }, []);

  useEffect(() => {
    if (stadiumId) setSelected(stadiumId);
  }, [stadiumId]);

  const runAnalysis = async (id) => {
    setLoadingAnalysis(true);
    setAiAnalysis('');
    try {
      const res = await crowdAnalysis({ stadiumId: id });
      setAiAnalysis(res.data.analysis);
    } catch {
      setAiAnalysis('Unable to generate AI analysis at this time. Please check backend connection.');
    } finally {
      setLoadingAnalysis(false);
    }
  };

  const selectedData = crowdData.find(c => c.id === selected);

  return (
    <div className="space-y-6">
      {/* Overview Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {crowdData.map(v => (
          <button
            key={v.id}
            onClick={() => setSelected(selected === v.id ? null : v.id)}
            aria-pressed={selected === v.id}
            aria-label={`${v.name} — ${v.occupancyPct}% occupancy. Click to ${selected === v.id ? 'deselect' : 'view AI analysis'}`}
            className={`card text-left transition-all hover:border-gray-600 ${
              selected === v.id ? 'border-[#003DA5] ring-1 ring-[#003DA5]/50' : ''
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="font-semibold text-white">{v.name}</div>
                <div className="text-gray-400 text-xs">{v.city}</div>
              </div>
              <RiskBadge pct={v.occupancyPct} />
            </div>

            {/* Capacity Bar */}
            <div className="mb-3">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-400">Occupancy</span>
                <span className="text-white font-medium">
                  {v.currentOccupancy?.toLocaleString()} / {v.capacity?.toLocaleString()}
                </span>
              </div>
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    v.occupancyPct >= 90 ? 'bg-red-500' :
                    v.occupancyPct >= 80 ? 'bg-yellow-500' :
                    v.occupancyPct >= 65 ? 'bg-blue-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(v.occupancyPct, 100)}%` }}
                />
              </div>
              <div className="text-right text-xs text-gray-400 mt-0.5">{v.occupancyPct}%</div>
            </div>

            {/* Gate Wait Times */}
            <div className="space-y-1">
              {Object.entries(v.waitTimes || {}).slice(0, 3).map(([gate, mins]) => (
                <div key={gate} className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">{gate}</span>
                  <span className={`font-medium ${
                    mins > 15 ? 'text-red-400' : mins > 8 ? 'text-yellow-400' : 'text-green-400'
                  }`}>{mins} min wait</span>
                </div>
              ))}
            </div>
          </button>
        ))}
      </div>

      {/* AI Analysis Panel */}
      {selected && selectedData && (
        <div className="card fade-in-up">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Brain size={20} className="text-[#00A8E0]" />
              <span className="font-semibold text-white">AI Crowd Intelligence — {selectedData.name}</span>
            </div>
            <button
              onClick={() => runAnalysis(selected)}
              disabled={loadingAnalysis}
              className="btn-primary flex items-center gap-2 py-2 text-sm"
            >
              <RefreshCw size={14} className={loadingAnalysis ? 'animate-spin' : ''} />
              {loadingAnalysis ? 'Analyzing...' : 'Run AI Analysis'}
            </button>
          </div>

          {/* Hotspots */}
          <div className="mb-4">
            <div className="text-xs text-gray-400 uppercase tracking-wider mb-2">Current Hotspots</div>
            <div className="flex flex-wrap gap-2">
              {(selectedData.hotspots || []).map(h => (
                <span key={h} className="badge bg-red-900/30 text-red-400 border border-red-800/50">
                  <AlertTriangle size={10} /> {h}
                </span>
              ))}
            </div>
          </div>

          {/* All Gate Times */}
          <div className="mb-4">
            <div className="text-xs text-gray-400 uppercase tracking-wider mb-2">Gate Wait Times</div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {Object.entries(selectedData.waitTimes || {}).map(([gate, mins]) => (
                <div key={gate} className={`text-center p-2 rounded-lg ${
                  mins > 15 ? 'bg-red-900/20 border border-red-800/40' :
                  mins > 8 ? 'bg-yellow-900/20 border border-yellow-800/40' :
                  'bg-green-900/20 border border-green-800/40'
                }`}>
                  <div className="text-xs text-gray-400">{gate}</div>
                  <div className={`text-lg font-bold ${
                    mins > 15 ? 'text-red-400' : mins > 8 ? 'text-yellow-400' : 'text-green-400'
                  }`}>{mins}</div>
                  <div className="text-xs text-gray-400">min</div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Output */}
          {aiAnalysis && (
            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 fade-in-up">
              <div className="flex items-center gap-2 mb-3 text-[#00A8E0] text-sm font-medium">
                <Brain size={14} /> AI Analysis Report
              </div>
              <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">{aiAnalysis}</p>
            </div>
          )}

          {!aiAnalysis && !loadingAnalysis && (
            <div className="text-center text-gray-400 text-sm py-4">
              Click "Run AI Analysis" for real-time crowd intelligence and staff recommendations
            </div>
          )}
          {loadingAnalysis && (
            <div className="flex items-center gap-3 text-gray-400 text-sm py-4">
              <RefreshCw size={16} className="animate-spin text-[#00A8E0]" />
              Analyzing crowd patterns and generating recommendations...
            </div>
          )}
        </div>
      )}
    </div>
  );
}
