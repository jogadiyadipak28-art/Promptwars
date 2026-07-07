import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Map, Users, Globe, Zap, Leaf, Bell, Clipboard, Bot, ChevronRight } from 'lucide-react';

import Header from './components/Header';
import HeroSection from './components/HeroSection';
import FeaturesSection from './components/FeaturesSection';
import PlayerBanner from './components/PlayerBanner';
import FootballShowcase from './components/FootballShowcase';
import StadiumSection from './components/StadiumSection';
import CrowdDashboard from './components/CrowdDashboard';
import FanAssistant from './components/FanAssistant';
import NavigationTool from './components/NavigationTool';
import TranslationTool from './components/TranslationTool';
import TransportAdvisor from './components/TransportAdvisor';
import SustainabilityPanel from './components/SustainabilityPanel';
import AlertGenerator from './components/AlertGenerator';
import VolunteerBriefing from './components/VolunteerBriefing';
import JulepChatbot from './components/JulepChatbot';
import SafeImage from './components/SafeImage';
import { getStadiums } from './api/client';
import { IMAGES, FLAGS, FOOTBALL_ICON } from './assets/images';
import { TAB_COLORS, theme } from './assets/theme';

const TABS = [
  { id: 'chatbot',        label: 'AI Chatbot',      icon: Bot,           role: 'fan',  color: TAB_COLORS.chatbot },
  { id: 'assistant',      label: 'Fan Assistant',    icon: MessageCircle, role: 'fan',  color: TAB_COLORS.assistant },
  { id: 'navigation',     label: 'Navigation',       icon: Map,           role: 'fan',  color: TAB_COLORS.navigation },
  { id: 'crowd',          label: 'Crowd Intel',      icon: Users,         role: 'ops',  color: TAB_COLORS.crowd },
  { id: 'translate',      label: 'Translate',        icon: Globe,         role: 'fan',  color: TAB_COLORS.translate },
  { id: 'transport',      label: 'Transport',        icon: Zap,           role: 'fan',  color: TAB_COLORS.transport },
  { id: 'sustainability', label: 'Eco Guide',        icon: Leaf,          role: 'fan',  color: TAB_COLORS.sustainability },
  { id: 'alerts',         label: 'PA Alerts',        icon: Bell,          role: 'ops',  color: TAB_COLORS.alerts },
  { id: 'volunteer',      label: 'Staff Brief',      icon: Clipboard,     role: 'ops',  color: TAB_COLORS.volunteer },
];

const FALLBACK_STADIUMS = [
  { id: 'metlife', name: 'MetLife Stadium',  city: 'East Rutherford, NJ', country: 'USA',    capacity: 82500 },
  { id: 'atandt',  name: 'AT&T Stadium',     city: 'Arlington, TX',       country: 'USA',    capacity: 80000 },
  { id: 'sofi',    name: 'SoFi Stadium',     city: 'Inglewood, CA',       country: 'USA',    capacity: 70240 },
  { id: 'azteca',  name: 'Estadio Azteca',   city: 'Mexico City',         country: 'Mexico', capacity: 87523 },
  { id: 'bcplace', name: 'BC Place',         city: 'Vancouver',           country: 'Canada', capacity: 54500 },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('chatbot');
  const [stadiums, setStadiums] = useState([]);
  const [selectedStadium, setSelectedStadium] = useState(null);
  const [viewMode, setViewMode] = useState('fan');
  const [tabChanging, setTabChanging] = useState(false);
  const appRef = useRef(null);

  useEffect(() => {
    getStadiums()
      .then(r => { setStadiums(r.data); setSelectedStadium(r.data[0]); })
      .catch(() => { setStadiums(FALLBACK_STADIUMS); setSelectedStadium(FALLBACK_STADIUMS[0]); });
  }, []);

  const scrollToApp = () => {
    appRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleTabChange = (tabId) => {
    if (tabId === activeTab) return;
    setTabChanging(true);
    setTimeout(() => {
      setActiveTab(tabId);
      setTabChanging(false);
    }, 150);
  };

  const handleFeatureSelect = (tabId) => {
    scrollToApp();
    setTimeout(() => handleTabChange(tabId), 400);
  };

  const visibleTabs = TABS.filter(t => viewMode === 'ops' || t.role === 'fan');
  const activeTabData = TABS.find(t => t.id === activeTab);

  return (
    <div className="min-h-screen bg-brand-darker">
      <Header viewMode={viewMode} setViewMode={setViewMode} onScrollToFeatures={scrollToApp} />

      {/* ── Hero ── */}
      <HeroSection onScrollToApp={scrollToApp} />

      {/* ── Scrolling football gallery ── */}
      <PlayerBanner />

      {/* ── Features showcase ── */}
      <FeaturesSection onSelectFeature={handleFeatureSelect} />

      {/* ── Football showcase with imagery ── */}
      <FootballShowcase />

      {/* ── App section ── */}
      <div ref={appRef} className="relative py-8 sm:py-12">
        {/* Section glow */}
        <div className="absolute inset-0 bg-gradient-to-b from-brand-blue/5 via-brand-green/5 to-brand-pink/5 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8 relative z-10">

          {/* Stadium Selector */}
          <StadiumSection
            stadiums={stadiums}
            selected={selectedStadium}
            onChange={setSelectedStadium}
          />

          {/* Tab nav */}
          <div className="relative">
            {/* Background blur panel */}
            <div className="bg-white/[0.02] backdrop-blur-sm border border-white/5 rounded-2xl p-2 shadow-2xl">
              <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-0.5">
                {visibleTabs.map(tab => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      aria-label={tab.label}
                      onClick={() => handleTabChange(tab.id)}
                      className={`tab-btn flex-shrink-0 relative ${isActive ? 'active' : ''}`}
                      style={isActive ? { background: `linear-gradient(135deg, ${tab.color}30, ${tab.color}15)`, borderColor: `${tab.color}40`, border: `1px solid ${tab.color}40` } : {}}
                    >
                      <Icon size={15} style={isActive ? { color: tab.color } : {}} />
                      <span className="hidden sm:inline">{tab.label}</span>
                      {tab.id === 'chatbot' && !isActive && (
                        <span className="text-[9px] bg-brand-green/20 text-brand-green px-1.5 py-0.5 rounded-full font-bold leading-none">
                          AI
                        </span>
                      )}
                      {isActive && (
                        <div
                          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full"
                          style={{ background: tab.color }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Active tab label */}
          {activeTabData && (
            <div className="flex items-center gap-2 -mt-4">
              <div className="w-1 h-5 rounded-full" style={{ background: activeTabData.color }} />
              <span className="text-white font-bold text-lg">{activeTabData.label}</span>
              {selectedStadium && (
                <>
                  <ChevronRight size={14} className="text-gray-600" />
                  <span className="text-gray-400 text-sm">{selectedStadium.name}</span>
                </>
              )}
            </div>
          )}

          {/* Tab content with transition */}
          <div className={`transition-all duration-150 ${tabChanging ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'}`}>
            {activeTab === 'chatbot'        && <JulepChatbot stadiumId={selectedStadium?.id} stadium={selectedStadium} />}
            {activeTab === 'assistant'      && <FanAssistant stadiumId={selectedStadium?.id} />}
            {activeTab === 'navigation'     && <NavigationTool stadiumId={selectedStadium?.id} stadium={selectedStadium} />}
            {activeTab === 'crowd'          && <CrowdDashboard stadiumId={selectedStadium?.id} />}
            {activeTab === 'translate'      && <TranslationTool />}
            {activeTab === 'transport'      && <TransportAdvisor stadiumId={selectedStadium?.id} stadium={selectedStadium} />}
            {activeTab === 'sustainability' && <SustainabilityPanel stadiumId={selectedStadium?.id} stadium={selectedStadium} />}
            {activeTab === 'alerts'         && <AlertGenerator stadiumId={selectedStadium?.id} stadium={selectedStadium} />}
            {activeTab === 'volunteer'      && <VolunteerBriefing stadiumId={selectedStadium?.id} stadium={selectedStadium} />}
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <Footer />

      {/* ── Floating chatbot ── */}
      {activeTab !== 'chatbot' && (
        <JulepChatbot stadiumId={selectedStadium?.id} stadium={selectedStadium} floating />
      )}
    </div>
  );
}

function Footer() {
  const nations = [
    { flag: FLAGS.USA, label: 'United States — 11 Venues' },
    { flag: FLAGS.Mexico, label: 'Mexico — 3 Venues' },
    { flag: FLAGS.Canada, label: 'Canada — 2 Venues' },
  ];

  return (
    <footer className="relative mt-16 border-t border-white/10 overflow-hidden">
      <div className="absolute inset-0 z-0">
        <SafeImage
          src={IMAGES.stadium}
          alt=""
          aria-hidden="true"
          className="w-full h-full object-cover opacity-[0.08]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-darker via-brand-dark/95 to-brand-dark/85" />
      </div>

      {/* Football field lines decoration */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-5">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-64 h-32 border-2 border-white rounded-t-full" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-8 border-2 border-white rounded-full" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-white" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-brand-blue to-brand-green rounded-xl flex items-center justify-center border border-brand-blue/30">
                <img src={FOOTBALL_ICON} alt="" width="24" height="24" className="w-6 h-6" aria-hidden="true" />
              </div>
              <div>
                <div className="font-black text-white text-lg">StadiumAI</div>
                <div className="text-gray-500 text-xs">FIFA World Cup 2026</div>
              </div>
            </div>
            <p className="text-gray-500 text-sm leading-relaxed">
              The world's most advanced AI platform for stadium operations and fan experience.
            </p>
          </div>

          {/* Venues */}
          <div>
            <h4 className="text-white font-bold text-sm mb-4 uppercase tracking-wider">Host Nations</h4>
            <div className="space-y-2 text-blue-200/60 text-sm">
              {nations.map(n => (
                <div key={n.label} className="flex items-center gap-2">
                  <div className="w-6 h-4 rounded overflow-hidden border border-white/20 flex-shrink-0">
                    <SafeImage src={n.flag} alt="" className="w-full h-full object-cover" />
                  </div>
                  <span>{n.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* AI stack */}
          <div>
            <h4 className="text-white font-bold text-sm mb-4 uppercase tracking-wider">Powered By</h4>
            <div className="space-y-2">
              {[
                { name: 'Julep AI', desc: 'Conversational memory', color: theme.blue },
                { name: 'OpenAI GPT', desc: 'Natural language', color: theme.green },
                { name: 'React + Vite', desc: 'Frontend', color: theme.pink },
                { name: 'Node.js API', desc: 'Backend', color: theme.red },
              ].map(t => (
                <div key={t.name} className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: t.color }} />
                  <span className="text-gray-300 text-sm font-medium">{t.name}</span>
                  <span className="text-gray-600 text-xs">· {t.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between pt-6 border-t border-white/5 gap-3">
          <p className="text-gray-600 text-xs">
            © 2026 StadiumAI · Built for FIFA World Cup 2026 · Generative AI Platform
          </p>
          <div className="flex items-center gap-2 text-brand-blue/50 text-xs">
            <div className="w-1.5 h-1.5 rounded-full bg-brand-green animate-pulse" />
            All systems operational
          </div>
        </div>
      </div>
    </footer>
  );
}
