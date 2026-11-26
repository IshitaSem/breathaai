import React, { useState, useRef, useEffect } from 'react';
import { Send, Trash2, Sparkles, AlertCircle, Wind, Shield, HeartPulse, Home, Leaf, Sun } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { askAIAssistant } from '../services/api';
import { ChatMessage } from '../types';
import { PhotoFrame } from '../components/common/PhotoFrame';
import { PHOTOS } from '../constants/photos';

export const AssistantPage: React.FC = () => {
  const {
    state,
    airData,
    chatMessages,
    addChatMessage,
    clearChatHistory,
    showToast,
  } = useApp();

  const [inputVal, setInputVal] = useState('');
  const [loading, setLoading] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages, loading]);

  const handleSend = async (questionText?: string) => {
    const q = (questionText || inputVal).trim();
    if (!q) {
      showToast('Please type a question first');
      return;
    }

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'u',
      text: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    addChatMessage(userMsg);
    setInputVal('');
    setLoading(true);

    try {
      const res = await askAIAssistant(q, {
        loc: airData.loc,
        aqi: airData.aqi,
        pm25: airData.pollutants.pm25,
        pm10: airData.pollutants.pm10,
        fam: state.fam,
        sens: state.sens,
        life: state.life,
      });

      const aiMsg: ChatMessage = {
        id: `a-${Date.now()}`,
        role: 'a',
        text: res.text,
        cards: res.cards,
        isLiveGenAI: res.isLiveGenAI,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      addChatMessage(aiMsg);
    } catch {
      addChatMessage({
        id: `a-${Date.now()}`,
        role: 'a',
        text: 'Sorry, I encountered an issue connecting to the AI air intelligence service. Please try again.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      });
    } finally {
      setLoading(false);
    }
  };

  const suggestedPrompts = [
    { label: 'Is it safe to go outside today?', icon: Sun, tag: 'Outdoor' },
    { label: 'How can I protect my family from winter smog?', icon: Shield, tag: 'Family' },
    { label: 'When should I exercise outdoors?', icon: HeartPulse, tag: 'Fitness' },
    { label: 'How can I improve my indoor air quality?', icon: Home, tag: 'Indoor' },
    { label: 'What should I do when PM2.5 is high?', icon: Wind, tag: 'PM2.5' },
    { label: 'How can I reduce my pollution contribution?', icon: Leaf, tag: 'Action' },
  ];

  return (
    <div className="space-y-6">
      {/* Editorial Intro Banner */}
      <div className="rounded-3xl overflow-hidden bg-card border border-line shadow-subtle grid grid-cols-1 md:grid-cols-3">
        <PhotoFrame
          photo={PHOTOS.morningForest}
          className="min-h-[150px] md:min-h-full"
          overlayClassName="bg-gradient-to-r from-[#173F35]/65 to-transparent"
        >
          <div className="absolute bottom-4 left-4 z-10 text-[#F8F7F2]">
            <span className="badge bg-white/20 backdrop-blur-md text-white border border-white/20">
              <Sparkles size={11} />
              Wellness Advisor
            </span>
          </div>
        </PhotoFrame>

        <div className="md:col-span-2 p-6 flex flex-col justify-center">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
            <h1 className="m-0">Aireolifye Air Assistant</h1>
            <span className={`badge ${airData.isLive ? 'live' : 'demo'}`}>
              {airData.isLive ? 'Active Live Context' : 'Baseline Mode'}
            </span>
          </div>
          <p className="sub text-sm leading-relaxed m-0">
            Personalised environmental guidance tuned for <b>{airData.loc}</b> (AQI {airData.aqi},{' '}
            {airData.category.name}) and your household of <b>{state.fam}</b> ({state.sens}).
          </p>
        </div>
      </div>

      {/* Chat Workspace */}
      <div className="card">
        <div className="chat" id="chat">
          {chatMessages.length === 0 ? (
            <div className="empty flex flex-col items-center justify-center h-full gap-3 text-mute max-w-md mx-auto">
              <div className="w-12 h-12 rounded-2xl bg-forest-mint text-forest grid place-items-center">
                <Sparkles size={22} />
              </div>
              <h2 className="m-0 text-ink">How can I help you breathe easier today?</h2>
              <p className="text-sm text-mute m-0 leading-relaxed">
                Ask about safe outdoor windows, air purifier placement, family precautions, or
                select one of the suggested cards below.
              </p>
            </div>
          ) : (
            chatMessages.map(m => (
              <div key={m.id} className={`m ${m.role === 'u' ? 'u' : 'a'}`}>
                <div className="leading-relaxed text-sm whitespace-pre-line">{m.text}</div>

                {m.cards && m.cards.length > 0 && (
                  <div className="space-y-2 mt-3">
                    {m.cards.map(([title, why], idx) => (
                      <div key={idx} className="rc">
                        <b className="text-ink font-display">{title}</b>
                        <div className="sub text-xs mt-1 leading-relaxed">
                          <strong className="text-forest">Why:</strong> {why}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex justify-between items-center text-[10px] mt-2 opacity-75">
                  <span>{m.timestamp}</span>
                  {m.role === 'a' && (
                    <span>{m.isLiveGenAI ? 'Gemini AI' : 'Contextual Engine'}</span>
                  )}
                </div>
              </div>
            ))
          )}

          {loading && (
            <div className="m a">
              <div className="dots">
                <span />
                <span />
                <span />
              </div>
            </div>
          )}

          <div ref={chatBottomRef} />
        </div>

        {/* Suggested Question Cards */}
        <div className="mt-4 pt-4 border-t border-line/70">
          <div className="text-xs font-semibold uppercase tracking-wider text-mute mb-2.5">
            Suggested Questions
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {suggestedPrompts.map((item, idx) => {
              const Icon = item.icon;
              return (
                <button
                  key={idx}
                  type="button"
                  className="chip flex items-start gap-2.5"
                  disabled={loading}
                  onClick={() => handleSend(item.label)}
                >
                  <Icon size={15} className="text-forest mt-0.5 flex-shrink-0" />
                  <div className="text-xs leading-snug font-medium">{item.label}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Input Bar */}
        <div className="row mt-4 gap-2">
          <input
            type="text"
            className="in flex-1"
            placeholder={`Ask about the air in ${airData.loc} today...`}
            value={inputVal}
            onChange={e => setInputVal(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') handleSend();
            }}
            disabled={loading}
          />
          <button
            type="button"
            className="btn"
            onClick={() => handleSend()}
            disabled={loading}
            aria-label="Send message"
          >
            <Send size={16} />
            <span className="hidden sm:inline">Ask</span>
          </button>
          <button
            type="button"
            className="btn o"
            onClick={clearChatHistory}
            disabled={loading || chatMessages.length === 0}
            title="Clear conversation"
          >
            <Trash2 size={16} />
            <span className="hidden sm:inline">Clear</span>
          </button>
        </div>

        <div className="flex items-center gap-1.5 sub text-xs mt-3 text-mute">
          <AlertCircle size={13} />
          <span>
            Aireolifye generates contextual recommendations. It does not substitute clinical
            medical advice.
          </span>
        </div>
      </div>
    </div>
  );
};
