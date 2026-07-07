import React, { useState, useRef, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Send, Bot, User, RefreshCw } from 'lucide-react';
import { fanAssistant } from '../api/client';
import { LANGUAGES } from '../constants/languages';

const QUICK_PROMPTS = [
  { id: 'seat',      text: '🗺️ How do I get to my seat?' },
  { id: 'restroom',  text: '🚻 Where are the nearest restrooms?' },
  { id: 'access',    text: '♿ I need accessible assistance' },
  { id: 'medical',   text: '🏥 Where is the medical station?' },
  { id: 'food',      text: '🍔 Where can I find food?' },
  { id: 'prayer',    text: '🙏 Is there a prayer room?' },
  { id: 'transport', text: '🚌 What transport options are available?' },
  { id: 'eco',       text: '🌿 How can I be eco-friendly today?' },
];

const INITIAL_MESSAGE = {
  role: 'assistant',
  content:
    "Hi! I'm StadiumAI ⚽ Your personal guide for FIFA World Cup 2026. " +
    "I can help you navigate the stadium, find facilities, get transport info, " +
    "and answer any questions — in any language! How can I help you today?",
};

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2" role="status" aria-label="Assistant is typing">
      <div className="w-8 h-8 rounded-full bg-[#003DA5] flex items-center justify-center flex-shrink-0" aria-hidden="true">
        <Bot size={16} className="text-white" />
      </div>
      <div className="bg-gray-800 rounded-2xl rounded-bl-sm px-4 py-3" aria-hidden="true">
        <div className="flex gap-1.5 items-center h-4">
          <div className="w-2 h-2 bg-gray-400 rounded-full typing-dot" />
          <div className="w-2 h-2 bg-gray-400 rounded-full typing-dot" />
          <div className="w-2 h-2 bg-gray-400 rounded-full typing-dot" />
        </div>
      </div>
    </div>
  );
}

export default function FanAssistant({ stadiumId }) {
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [input, setInput]       = useState('');
  const [language, setLanguage] = useState('English');
  const [loading, setLoading]   = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = useCallback(async (text) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setInput('');

    const history = messages.map(m => ({ role: m.role, content: m.content }));
    setMessages(prev => [...prev, { role: 'user', content: msg }]);
    setLoading(true);

    try {
      const res = await fanAssistant({ message: msg, language, stadiumId, conversationHistory: history });
      setMessages(prev => [...prev, { role: 'assistant', content: res.data.reply }]);
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "⚠️ I'm having trouble connecting right now. Please try again in a moment.",
      }]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages, language, stadiumId]);

  const reset = useCallback(() => {
    setMessages([INITIAL_MESSAGE]);
    setInput('');
  }, []);

  return (
    <div className="card flex flex-col h-[600px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#003DA5] rounded-xl flex items-center justify-center relative" aria-hidden="true">
            <Bot size={20} className="text-white" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-900" />
          </div>
          <div>
            <div className="font-semibold text-white">StadiumAI Fan Assistant</div>
            <div className="text-xs text-green-400" aria-live="polite">● Online · GenAI Powered</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select
            aria-label="Response language"
            value={language}
            onChange={e => setLanguage(e.target.value)}
            className="select text-sm py-1.5 w-auto"
            style={{ colorScheme: 'dark' }}
          >
            {LANGUAGES.map(l => (
              <option key={l} value={l} style={{ background: '#1f2937', color: '#fff' }}>
                {l}
              </option>
            ))}
          </select>
          <button
            aria-label="Reset conversation"
            onClick={reset}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-all"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto space-y-4 mb-4 pr-1"
        role="log"
        aria-live="polite"
        aria-label="Conversation"
      >
        {messages.map((msg, i) => (
          <div
            key={`${msg.role}-${i}`}
            className={`flex items-end gap-2 fade-in-up ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                msg.role === 'assistant' ? 'bg-[#003DA5]' : 'bg-gray-700'
              }`}
              aria-hidden="true"
            >
              {msg.role === 'assistant'
                ? <Bot size={16} className="text-white" />
                : <User size={16} className="text-white" />}
            </div>
            <div className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
              msg.role === 'assistant'
                ? 'bg-gray-800 text-white rounded-bl-sm'
                : 'bg-[#003DA5] text-white rounded-br-sm'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      {/* Quick prompts — only shown at conversation start */}
      {messages.length <= 1 && (
        <div className="flex flex-wrap gap-2 mb-3" aria-label="Suggested questions">
          {QUICK_PROMPTS.slice(0, 4).map(p => (
            <button
              key={p.id}
              onClick={() => sendMessage(p.text)}
              className="text-xs bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 px-3 py-1.5 rounded-full transition-all"
            >
              {p.text}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="flex gap-2">
        <input
          aria-label="Type your message"
          className="input flex-1"
          placeholder="Ask anything about the stadium..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
          disabled={loading}
          maxLength={500}
        />
        <button
          aria-label="Send message"
          onClick={() => sendMessage()}
          disabled={!input.trim() || loading}
          className="btn-primary px-4"
        >
          <Send size={18} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

FanAssistant.propTypes = {
  stadiumId: PropTypes.string,
};
