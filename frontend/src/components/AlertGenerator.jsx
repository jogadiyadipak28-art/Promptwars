import React, { useState } from 'react';
import { Bell, AlertTriangle, Info, AlertOctagon, Loader, Copy, CheckCheck, Volume2 } from 'lucide-react';
import { generateAlert } from '../api/client';

const LANGUAGES = ['English', 'Spanish', 'French', 'Portuguese', 'Arabic', 'German', 'Japanese', 'Chinese'];

const SEVERITY_CONFIG = {
  low: { label: 'Low – Informational', color: 'text-blue-400', bg: 'bg-blue-900/20 border-blue-800', icon: Info },
  medium: { label: 'Medium – Advisory', color: 'text-yellow-400', bg: 'bg-yellow-900/20 border-yellow-800', icon: AlertTriangle },
  high: { label: 'High – Urgent', color: 'text-red-400', bg: 'bg-red-900/20 border-red-800', icon: AlertOctagon }
};

const PRESET_SITUATIONS = [
  { label: '🚪 Gate Congestion', situation: 'Gate C is experiencing heavy congestion. Wait times exceed 20 minutes.' },
  { label: '⚕️ Medical Emergency', situation: 'Medical staff are needed in Section 112. Please clear the area.' },
  { label: '🌧️ Weather Warning', situation: 'Thunderstorm warning in effect. All outdoor areas will be closed in 15 minutes.' },
  { label: '🔥 Fire Alarm', situation: 'Fire alarm activated in Zone B. All fans must evacuate immediately via nearest exit.' },
  { label: '🏆 Match Update', situation: 'Match kickoff delayed by 30 minutes due to pitch maintenance.' },
  { label: '🅿️ Parking Full', situation: 'All premium parking lots are full. Please use shuttle service from remote lot P.' }
];

export default function AlertGenerator({ stadiumId, stadium }) {
  const [situation, setSituation] = useState('');
  const [severity, setSeverity] = useState('medium');
  const [language, setLanguage] = useState('English');
  const [alert, setAlert] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState([]);

  const handleGenerate = async (sit) => {
    const finalSit = sit || situation.trim();
    if (!finalSit) { setError('Please describe the situation.'); return; }
    setError('');
    setLoading(true);
    setAlert('');
    try {
      const res = await generateAlert({ situation: finalSit, stadiumId, severity, language });
      const newAlert = res.data.alert;
      setAlert(newAlert);
      setHistory(prev => [{ situation: finalSit, alert: newAlert, severity, language, time: new Date().toLocaleTimeString() }, ...prev.slice(0, 4)]);
    } catch {
      setError('Alert generation unavailable.');
    } finally {
      setLoading(false);
    }
  };

  const copy = () => {
    navigator.clipboard.writeText(alert);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const severityConf = SEVERITY_CONFIG[severity];
  const SevIcon = severityConf.icon;

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="flex items-center gap-3 mb-5">
          <Bell size={20} className="text-[#00A8E0]" />
          <h2 className="font-semibold text-white text-lg">PA Alert Generator</h2>
          {stadium && <span className="badge bg-gray-800 text-gray-400 border border-gray-700">{stadium.name}</span>}
        </div>

        {/* Preset Situations */}
        <div className="mb-5">
          <div className="text-xs text-gray-400 uppercase tracking-wider mb-2">Preset Scenarios</div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {PRESET_SITUATIONS.map(p => (
              <button
                key={p.label}
                onClick={() => { setSituation(p.situation); handleGenerate(p.situation); }}
                className="text-left text-xs bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 px-3 py-2.5 rounded-xl transition-all"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Severity */}
        <div className="mb-4">
          <div className="text-xs text-gray-400 mb-2">Severity Level</div>
          <div className="flex gap-2">
            {Object.entries(SEVERITY_CONFIG).map(([key, conf]) => {
              const Icon = conf.icon;
              return (
                <button
                  key={key}
                  onClick={() => setSeverity(key)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all border ${
                    severity === key
                      ? `${conf.bg} ${conf.color} border-current`
                      : 'bg-gray-800 text-gray-400 border-gray-700 hover:border-gray-500'
                  }`}
                >
                  <Icon size={14} /> {key.charAt(0).toUpperCase() + key.slice(1)}
                </button>
              );
            })}
          </div>
        </div>

        {/* Situation + Language */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
          <div className="sm:col-span-2">
            <label htmlFor="alert-situation" className="text-xs text-gray-400 mb-1.5 block">Situation Description</label>
            <textarea
              id="alert-situation"
              className="input resize-none"
              rows={3}
              placeholder="Describe the situation that requires a PA announcement..."
              value={situation}
              onChange={e => setSituation(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="alert-language" className="text-xs text-gray-400 mb-1.5 block">Language</label>
            <select id="alert-language" className="select" value={language} onChange={e => setLanguage(e.target.value)}>
              {LANGUAGES.map(l => <option key={l}>{l}</option>)}
            </select>
          </div>
        </div>

        {error && <div className="bg-red-900/20 border border-red-800 text-red-400 text-sm rounded-xl px-4 py-3 mb-4">{error}</div>}

        <button onClick={() => handleGenerate()} disabled={loading} className="btn-primary flex items-center gap-2">
          {loading ? <Loader size={16} className="animate-spin" /> : <Bell size={16} />}
          {loading ? 'Generating...' : 'Generate PA Announcement'}
        </button>
      </div>

      {/* Generated Alert */}
      {alert && (
        <div className={`card fade-in-up border ${severityConf.bg}`}>
          <div className="flex items-center justify-between mb-4">
            <div className={`flex items-center gap-2 ${severityConf.color}`}>
              <SevIcon size={18} />
              <span className="font-semibold">Generated Announcement ({severityConf.label})</span>
            </div>
            <div className="flex gap-2">
              <button onClick={copy} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded-lg transition-all">
                {copied ? <CheckCheck size={14} className="text-green-400" /> : <Copy size={14} />}
                {copied ? 'Copied' : 'Copy'}
              </button>
              <button className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded-lg transition-all">
                <Volume2 size={14} /> Play PA
              </button>
            </div>
          </div>
          <div className="bg-gray-900/50 rounded-xl p-4">
            <p className="text-white text-base leading-relaxed font-medium">{alert}</p>
          </div>
          <div className="mt-3 text-xs text-gray-400">📍 {stadium?.name || 'Venue'} · {language} · {severity.toUpperCase()}</div>
        </div>
      )}

      {/* Alert History */}
      {history.length > 1 && (
        <div className="card">
          <div className="text-sm font-semibold text-white mb-3">Recent Alerts</div>
          <div className="space-y-2">
            {history.slice(1).map((h, i) => {
              const conf = SEVERITY_CONFIG[h.severity];
              return (
                <div key={i} className="flex items-start gap-3 text-xs bg-gray-800 rounded-xl px-3 py-2">
                  <span className={`mt-0.5 ${conf.color}`}>●</span>
                  <div className="flex-1 text-gray-300">{h.alert}</div>
                  <span className="text-gray-400 whitespace-nowrap">{h.time}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
