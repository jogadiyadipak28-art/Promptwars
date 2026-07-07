import React, { useState } from 'react';
import { Globe, ArrowRight, Copy, CheckCheck, Loader } from 'lucide-react';
import { translate } from '../api/client';

const LANGUAGES = [
  'Spanish', 'French', 'Portuguese', 'Arabic', 'German', 'Japanese',
  'Chinese (Simplified)', 'Hindi', 'Italian', 'Dutch', 'Korean', 'Russian',
  'Turkish', 'Polish', 'Swedish', 'Danish', 'Greek', 'Hebrew', 'Thai', 'Vietnamese'
];

const SAMPLE_ANNOUNCEMENTS = [
  'Gates will open in 30 minutes. Please make your way to the designated entrance.',
  'Attention: Section 112 is at full capacity. Please proceed to Section 113.',
  'Lost child alert: A child named Carlos, age 7, is at the medical station near Gate A.',
  'Last call for food and beverages before kickoff in 15 minutes.',
  'In case of emergency, please follow the green exit signs to the nearest exit.',
  'Wheelchair assistance is available at Gates A and D. Staff are ready to help.'
];

export default function TranslationTool() {
  const [text, setText] = useState('');
  const [targetLanguage, setTargetLanguage] = useState('Spanish');
  const [translated, setTranslated] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  const handleTranslate = async () => {
    if (!text.trim()) { setError('Please enter text to translate.'); return; }
    setError('');
    setLoading(true);
    setTranslated('');
    try {
      const res = await translate({ text, targetLanguage });
      setTranslated(res.data.translated);
    } catch {
      setError('Translation service unavailable. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(translated);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="flex items-center gap-3 mb-5">
          <Globe size={20} className="text-[#00A8E0]" />
          <h2 className="font-semibold text-white text-lg">Multilingual Translator</h2>
          <span className="badge bg-gray-800 text-gray-400 border border-gray-700">20+ Languages</span>
        </div>

        {/* Sample Announcements */}
        <div className="mb-5">
          <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">Sample Stadium Announcements</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {SAMPLE_ANNOUNCEMENTS.slice(0, 4).map((s, i) => (
              <button
                key={i}
                onClick={() => setText(s)}
                className="text-left text-xs bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 px-3 py-2 rounded-xl transition-all line-clamp-2"
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Language Selector */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-400">
            🇺🇸 English (Source)
          </div>
          <ArrowRight size={20} className="text-gray-500 flex-shrink-0" />
          <select
            className="select flex-1"
            value={targetLanguage}
            onChange={e => setTargetLanguage(e.target.value)}
          >
            {LANGUAGES.map(l => <option key={l}>{l}</option>)}
          </select>
        </div>

        {/* Text Input */}
        <div className="mb-4">
          <label className="text-xs text-gray-400 mb-1.5 block">Text to Translate</label>
          <textarea
            className="input resize-none"
            rows={4}
            placeholder="Enter stadium announcement, sign text, or any message..."
            value={text}
            onChange={e => setText(e.target.value)}
          />
          <div className="text-right text-xs text-gray-600 mt-1">{text.length} chars</div>
        </div>

        {error && <div className="bg-red-900/20 border border-red-800 text-red-400 text-sm rounded-xl px-4 py-3 mb-4">{error}</div>}

        <button onClick={handleTranslate} disabled={loading || !text.trim()} className="btn-primary flex items-center gap-2">
          {loading ? <Loader size={16} className="animate-spin" /> : <Globe size={16} />}
          {loading ? 'Translating...' : `Translate to ${targetLanguage}`}
        </button>
      </div>

      {/* Result */}
      {translated && (
        <div className="card fade-in-up">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Globe size={18} className="text-[#FFD700]" />
              <span className="font-semibold text-white">{targetLanguage} Translation</span>
            </div>
            <button
              onClick={copyToClipboard}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded-lg transition-all"
            >
              {copied ? <CheckCheck size={14} className="text-green-400" /> : <Copy size={14} />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-gray-800/50 rounded-xl p-4">
              <div className="text-xs text-gray-500 mb-2 uppercase tracking-wider">Original (English)</div>
              <p className="text-gray-300 text-sm leading-relaxed">{text}</p>
            </div>
            <div className="bg-[#003DA5]/10 border border-[#003DA5]/30 rounded-xl p-4">
              <div className="text-xs text-[#00A8E0] mb-2 uppercase tracking-wider">{targetLanguage}</div>
              <p className="text-white text-sm leading-relaxed">{translated}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
