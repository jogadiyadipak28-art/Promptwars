import React, { useState } from 'react';
import { Clipboard, User, Clock, Loader, Download } from 'lucide-react';
import { volunteerBrief } from '../api/client';

const ROLES = [
  'Gate Marshal', 'Accessibility Assistant', 'Medical Support', 'Information Desk',
  'Crowd Flow Controller', 'Lost & Found Coordinator', 'Transport Liaison',
  'Sustainability Champion', 'Emergency Response', 'VIP Hospitality'
];

const SHIFTS = [
  'Pre-Match (Gates Open -3h)', 'Match Day Morning', 'Match Day Afternoon',
  'Kickoff Window', 'Half Time', 'Post-Match Crowd Dispersal', 'Night Shift'
];

const LANGUAGES = ['English', 'Spanish', 'French', 'Portuguese', 'Arabic', 'German'];

export default function VolunteerBriefing({ stadiumId, stadium }) {
  const [role, setRole] = useState('');
  const [shiftTime, setShiftTime] = useState('');
  const [language, setLanguage] = useState('English');
  const [brief, setBrief] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    if (!role) { setError('Please select a volunteer role.'); return; }
    if (!stadiumId) { setError('Please select a stadium.'); return; }
    setError('');
    setLoading(true);
    setBrief('');
    try {
      const res = await volunteerBrief({ role, stadiumId, shiftTime, language });
      setBrief(res.data.brief);
    } catch {
      setError('Briefing generation unavailable.');
    } finally {
      setLoading(false);
    }
  };

  const downloadBrief = () => {
    const blob = new Blob([`FIFA World Cup 2026\nRole: ${role}\nShift: ${shiftTime}\nStadium: ${stadium?.name}\n\n${brief}`], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `brief-${role.replace(/\s+/g, '-').toLowerCase()}.txt`;
    a.click();
  };

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="flex items-center gap-3 mb-5">
          <Clipboard size={20} className="text-[#00A8E0]" />
          <h2 className="font-semibold text-white text-lg">Volunteer Shift Briefing Generator</h2>
          {stadium && <span className="badge bg-gray-800 text-gray-400 border border-gray-700">{stadium.name}</span>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          {/* Role */}
          <div>
            <label htmlFor="vol-role" className="text-xs text-gray-400 mb-1.5 block flex items-center gap-1">
              <User size={12} /> Volunteer Role
            </label>
            <select id="vol-role" className="select" value={role} onChange={e => setRole(e.target.value)}>
              <option value="">Select your role...</option>
              {ROLES.map(r => <option key={r}>{r}</option>)}
            </select>
          </div>

          {/* Shift */}
          <div>
            <label htmlFor="vol-shift" className="text-xs text-gray-400 mb-1.5 block flex items-center gap-1">
              <Clock size={12} /> Shift
            </label>
            <select id="vol-shift" className="select" value={shiftTime} onChange={e => setShiftTime(e.target.value)}>
              <option value="">Select shift...</option>
              {SHIFTS.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>

          {/* Language */}
          <div>
            <label htmlFor="vol-lang" className="text-xs text-gray-400 mb-1.5 block">🌐 Briefing Language</label>
            <select id="vol-lang" className="select" value={language} onChange={e => setLanguage(e.target.value)}>
              {LANGUAGES.map(l => <option key={l}>{l}</option>)}
            </select>
          </div>
        </div>

        {/* Role Cards */}
        <div className="mb-5">
          <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">Quick Select Role</div>
          <div className="flex flex-wrap gap-2">
            {ROLES.slice(0, 5).map(r => (
              <button
                key={r}
                onClick={() => setRole(r)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                  role === r
                    ? 'bg-[#003DA5] border-[#003DA5] text-white'
                    : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-white hover:border-gray-500'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {error && <div className="bg-red-900/20 border border-red-800 text-red-400 text-sm rounded-xl px-4 py-3 mb-4">{error}</div>}

        <button onClick={handleGenerate} disabled={loading} className="btn-primary flex items-center gap-2">
          {loading ? <Loader size={16} className="animate-spin" /> : <Clipboard size={16} />}
          {loading ? 'Generating briefing...' : 'Generate Shift Briefing'}
        </button>
      </div>

      {/* Brief Output */}
      {brief && (
        <div className="card fade-in-up">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clipboard size={18} className="text-[#FFD700]" />
              <span className="font-semibold text-white">Shift Briefing — {role}</span>
            </div>
            <button
              onClick={downloadBrief}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded-lg transition-all"
            >
              <Download size={14} /> Download
            </button>
          </div>

          <div className="flex flex-wrap gap-3 mb-4">
            <span className="badge bg-[#003DA5]/20 text-[#00A8E0] border border-[#003DA5]/40">{role}</span>
            {shiftTime && <span className="badge bg-gray-800 text-gray-400 border border-gray-700">{shiftTime}</span>}
            <span className="badge bg-gray-800 text-gray-400 border border-gray-700">{stadium?.name}</span>
            <span className="badge bg-gray-800 text-gray-400 border border-gray-700">{language}</span>
          </div>

          <div className="bg-gray-800/50 rounded-xl p-5">
            <p className="text-gray-200 text-sm leading-relaxed whitespace-pre-wrap">{brief}</p>
          </div>
        </div>
      )}
    </div>
  );
}
