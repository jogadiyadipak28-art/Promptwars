import React, { useState, useRef, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Send, Bot, User, RefreshCw, Sparkles, Wifi, WifiOff, ChevronDown, X } from 'lucide-react';
import { chatbotMessage, chatbotReset, chatbotStatus } from '../api/client';
import { LANGUAGES } from '../constants/languages';

const QUICK_PROMPTS = [
  { icon: '🗺️', label: 'Get to my seat', text: 'How do I find my seat from the main entrance?' },
  { icon: '🚻', label: 'Restrooms', text: 'Where are the nearest restrooms?' },
  { icon: '♿', label: 'Accessibility', text: 'I need wheelchair-accessible assistance to reach my seat.' },
  { icon: '🏥', label: 'Medical help', text: 'Where is the nearest medical station?' },
  { icon: '🍔', label: 'Food & drinks', text: 'Where can I find food and beverages near my section?' },
  { icon: '🚌', label: 'Transport home', text: 'What are the best transport options after the match?' },
  { icon: '🌿', label: 'Go green', text: 'How can I be more eco-friendly during my visit today?' },
  { icon: '⚽', label: 'Match info', text: 'Tell me about today\'s match and the teams playing.' }
];

function TypingDots() {
  return (
    <div className="flex items-end gap-2" role="status" aria-label="StadiumAI is typing">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#003DA5] to-[#00A8E0] flex items-center justify-center flex-shrink-0 shadow-lg" aria-hidden="true">
        <Bot size={15} className="text-white" />
      </div>
      <div className="bg-gray-800 border border-gray-700 rounded-2xl rounded-bl-sm px-4 py-3" aria-hidden="true">
        <div className="flex gap-1.5 items-center h-4">
          <div className="w-2 h-2 bg-[#00A8E0] rounded-full typing-dot" />
          <div className="w-2 h-2 bg-[#00A8E0] rounded-full typing-dot" />
          <div className="w-2 h-2 bg-[#00A8E0] rounded-full typing-dot" />
        </div>
      </div>
    </div>
  );
}

/** @type {import('react')} */
const messagePropType = PropTypes.shape({
  role:      PropTypes.string.isRequired,
  content:   PropTypes.string.isRequired,
  timestamp: PropTypes.string,
});

function Message({ msg }) {
  const isBot = msg.role === 'assistant';
  return (
    <div className={`flex items-end gap-2 fade-in-up ${isBot ? '' : 'flex-row-reverse'}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow ${
        isBot
          ? 'bg-gradient-to-br from-[#003DA5] to-[#00A8E0]'
          : 'bg-gradient-to-br from-gray-600 to-gray-700'
      }`}>
        {isBot ? <Bot size={15} className="text-white" /> : <User size={15} className="text-white" />}
      </div>
      <div className={`max-w-[78%] px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
        isBot
          ? 'bg-gray-800 border border-gray-700 text-white rounded-bl-sm'
          : 'bg-gradient-to-br from-[#003DA5] to-[#0051CC] text-white rounded-br-sm'
      }`}>
        <p className="whitespace-pre-wrap">{msg.content}</p>
        {msg.timestamp && (
          <div className={`text-xs mt-1.5 ${isBot ? 'text-gray-400' : 'text-blue-200/60'}`}>
            {msg.timestamp}
          </div>
        )}
      </div>
    </div>
  );
}

Message.propTypes = { msg: messagePropType.isRequired };

export default function JulepChatbot({ stadiumId, stadium, floating = false }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hi! I'm StadiumAI ⚽ — powered by Julep AI. I'm your personal guide for FIFA World Cup 2026.\n\nI can help with navigation, facilities, transport, accessibility, sustainability, and more — in any language. What can I do for you?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState('');
  const [language, setLanguage] = useState('English');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(() => crypto.randomUUID?.() || Math.random().toString(36).slice(2));
  const [status, setStatus] = useState('checking'); // 'online' | 'offline' | 'checking'
  const [isOpen, setIsOpen] = useState(!floating);
  const [showQuickPrompts, setShowQuickPrompts] = useState(true);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  // Check Julep status on mount
  useEffect(() => {
    chatbotStatus()
      .then(() => setStatus('online'))
      .catch(() => setStatus('offline'));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  const sendMessage = useCallback(async (text) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setInput('');
    setShowQuickPrompts(false);

    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setMessages(prev => [...prev, { role: 'user', content: msg, timestamp: now }]);
    setLoading(true);

    try {
      const res = await chatbotMessage({ message: msg, sessionId, stadiumId, language });
      const reply = res.data.reply || "I couldn't generate a response. Please try again.";

      // Update sessionId if server created a new one
      if (res.data.sessionId && res.data.sessionId !== sessionId) {
        setSessionId(res.data.sessionId);
      }

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } catch (err) {
      const errMsg = err.response?.data?.reply ||
        '⚠️ Connection issue. Please check your network and try again.';
      setMessages(prev => [...prev, { role: 'assistant', content: errMsg, timestamp: now }]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, sessionId, stadiumId, language]);

  const resetChat = async () => {
    try {
      await chatbotReset({ sessionId });
    } catch { /* ignore */ }
    const newSession = crypto.randomUUID?.() || Math.random().toString(36).slice(2);
    setSessionId(newSession);
    setMessages([{
      role: 'assistant',
      content: "Chat cleared! ⚽ How can I help you today?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }]);
    setShowQuickPrompts(true);
  };

  const StatusBadge = () => (
    <div className={`flex items-center gap-1.5 text-xs font-medium ${
      status === 'online' ? 'text-green-400' :
      status === 'offline' ? 'text-red-400' :
      'text-yellow-400'
    }`}>
      {status === 'online' ? <Wifi size={11} /> : status === 'offline' ? <WifiOff size={11} /> : null}
      <span>
        {status === 'online' ? '● Live · Julep AI' :
         status === 'offline' ? '● Offline' :
         '○ Connecting...'}
      </span>
    </div>
  );

  const ChatContent = () => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 bg-gray-900 rounded-t-2xl flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-[#003DA5] to-[#00A8E0] rounded-xl flex items-center justify-center shadow relative">
            <Bot size={18} className="text-white" />
            {status === 'online' && (
              <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-gray-900" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-1.5 font-semibold text-white text-sm">
              StadiumAI Chatbot
              <span className="badge bg-[#FFD700]/20 text-[#FFD700] text-[10px]">
                <Sparkles size={9} /> Julep AI
              </span>
            </div>
            <StatusBadge />
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <select
            aria-label="Language"
            value={language}
            onChange={e => setLanguage(e.target.value)}
            className="text-xs bg-gray-800 border border-gray-700 text-gray-300 rounded-lg px-2 py-1 focus:outline-none focus:border-[#003DA5]"
          >
            {LANGUAGES.map(l => <option key={l}>{l}</option>)}
          </select>
          <button
            aria-label="New conversation"
            onClick={resetChat}
            title="New conversation"
            className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-all"
          >
            <RefreshCw size={14} />
          </button>
          {floating && (
            <button
              aria-label="Minimize chat"
              onClick={() => setIsOpen(false)}
              className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-all"
            >
              <ChevronDown size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Stadium badge */}
      {stadium && (
        <div className="px-4 py-1.5 bg-[#003DA5]/10 border-b border-[#003DA5]/20 flex-shrink-0">
          <span className="text-[11px] text-[#00A8E0]">
            📍 {stadium.name} · {stadium.city}
          </span>
        </div>
      )}

      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-0"
        role="log"
        aria-live="polite"
        aria-label="Chat conversation"
        aria-relevant="additions"
      >
        {messages.map((msg, i) => <Message key={i} msg={msg} />)}
        {loading && <TypingDots />}
        <div ref={bottomRef} />
      </div>

      {/* Quick Prompts */}
      {showQuickPrompts && messages.length <= 1 && (
        <div className="px-4 pb-3 flex-shrink-0">
          <div className="text-[11px] text-gray-400 mb-2 uppercase tracking-wider">Suggested questions</div>
          <div className="grid grid-cols-2 gap-1.5">
            {QUICK_PROMPTS.map(p => (
              <button
                key={p.label}
                onClick={() => sendMessage(p.text)}
                className="flex items-center gap-1.5 text-left text-xs bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 px-2.5 py-2 rounded-xl transition-all truncate"
              >
                <span>{p.icon}</span>
                <span className="truncate">{p.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="px-4 pb-4 flex-shrink-0">
        <div className="flex gap-2 bg-gray-800 border border-gray-700 rounded-xl p-1 focus-within:border-[#003DA5] transition-all">
          <input
            aria-label="Message"
            ref={inputRef}
            className="flex-1 bg-transparent text-white text-sm placeholder-gray-400 px-3 py-2 focus:outline-none"
            placeholder="Ask me anything..."
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
            className="w-9 h-9 rounded-lg bg-[#003DA5] hover:bg-[#0051CC] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-all flex-shrink-0"
          >
            <Send size={15} className="text-white" />
          </button>
        </div>
        <div className="text-center text-[10px] text-gray-400 mt-1.5">
          Powered by Julep AI · FIFA World Cup 2026
        </div>
      </div>
    </div>
  );

  // ── Floating mode (bubble) ─────────────────────────────────────────────────
  if (floating) {
    return (
      <>
        {/* Chat panel */}
        {isOpen && (
          <div className="fixed bottom-20 right-4 w-[380px] h-[580px] bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden fade-in-up">
            <ChatContent />
          </div>
        )}

        {/* Floating trigger button */}
        <button
          aria-label={isOpen ? "Close chat" : "Open chat"}
          onClick={() => setIsOpen(o => !o)}
          className="fixed bottom-4 right-4 w-14 h-14 bg-gradient-to-br from-[#003DA5] to-[#00A8E0] rounded-full shadow-xl flex items-center justify-center z-50 hover:scale-105 transition-transform"
          title="Chat with StadiumAI"
        >
          {isOpen
            ? <X size={22} className="text-white" />
            : <Bot size={24} className="text-white" />
          }
          {status === 'online' && !isOpen && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-white rounded-full" />
            </div>
          )}
        </button>
      </>
    );
  }

  // ── Inline mode (tab panel) ────────────────────────────────────────────────
  return (
    <div className="card p-0 overflow-hidden h-[600px] flex flex-col">
      <ChatContent />
    </div>
  );
}

JulepChatbot.propTypes = {
  stadiumId: PropTypes.string,
  stadium:   PropTypes.shape({ name: PropTypes.string, city: PropTypes.string }),
  floating:  PropTypes.bool,
};
