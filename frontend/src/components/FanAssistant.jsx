import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Mic, RefreshCw } from 'lucide-react';
import { fanAssistant } from '../api/client';

const LANGUAGES = ['English', 'Spanish', 'French', 'Portuguese', 'Arabic', 'German', 'Japanese', 'Chinese', 'Hindi', 'Italian'];

const QUICK_PROMPTS = [
  '🗺️ How do I get to my seat?',
  '🚻 Where are the nearest restrooms?',
  '♿ I need accessible assistance',
  '🏥 Where is the medical station?',
  '🍔 Where can I find food?',
  '🙏 Is there a prayer room?',
  '🚌 What transport options are available?',
  '🌿 How can I be eco-friendly today?'
];

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2">
      <div className="w-8 h-8 rounded-full bg-[#003DA5] flex items-center justify-center flex-shrink-0">
        <Bot size={16} className="text-gray-900" />
      </div>
      <div className="bg-gray-50 rounded-2xl rounded-bl-sm px-4 py-3">
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
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hi! I'm StadiumAI ⚽ Your personal guide for FIFA World Cup 2026. I can help you navigate the stadium, find facilities, get transport info, and answer any questions — in any language! How can I help you today?"
    }
  ]);
  const [input, setInput] = useState('');
  const [language, setLanguage] = useState('English');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = async (text) => {
    const msg = text || input.trim();
    if (!msg || loading) return;
    setInput('');

    const history = messages.map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content }));
    setMessages(prev => [...prev, { role: 'user', content: msg }]);
    setLoading(true);

    try {
      const res = await fanAssistant({
        message: msg,
        language,
        stadiumId,
        conversationHistory: history
      });
      setMessages(prev => [...prev, { role: 'assistant', content: res.data.reply }]);
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '⚠️ I\'m having trouble connecting right now. Please try again in a moment.'
      }]);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setMessages([{
      role: 'assistant',
      content: "Hi! I'm StadiumAI ⚽ Your personal guide for FIFA World Cup 2026. How can I help you today?"
    }]);
  };

  return (
    <div className="card flex flex-col h-[600px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#003DA5] rounded-xl flex items-center justify-center relative">
            <Bot size={20} className="text-gray-900" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-900" />
          </div>
          <div>
            <div className="font-semibold text-gray-900">StadiumAI Fan Assistant</div>
            <div className="text-xs text-green-400">● Online · GenAI Powered</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={language}
            onChange={e => setLanguage(e.target.value)}
            className="select text-sm py-1.5 w-auto"
          >
            {LANGUAGES.map(l => <option key={l}>{l}</option>)}
          </select>
          <button onClick={reset} className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all">
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-1">
        {messages.map((msg, i) => (
          <div key={i} className={`flex items-end gap-2 fade-in-up ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
              msg.role === 'assistant' ? 'bg-[#003DA5]' : 'bg-gray-100'
            }`}>
              {msg.role === 'assistant' ? <Bot size={16} className="text-gray-900" /> : <User size={16} className="text-gray-900" />}
            </div>
            <div className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
              msg.role === 'assistant'
                ? 'bg-gray-50 text-gray-900 rounded-bl-sm'
                : 'bg-[#003DA5] text-gray-900 rounded-br-sm'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      {/* Quick Prompts */}
      {messages.length <= 1 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {QUICK_PROMPTS.slice(0, 4).map(p => (
            <button
              key={p}
              onClick={() => sendMessage(p)}
              className="text-xs bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 px-3 py-1.5 rounded-full transition-all"
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="flex gap-2">
        <input
          className="input flex-1"
          placeholder="Ask anything about the stadium..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendMessage()}
          disabled={loading}
        />
        <button
          onClick={() => sendMessage()}
          disabled={!input.trim() || loading}
          className="btn-primary px-4"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}
