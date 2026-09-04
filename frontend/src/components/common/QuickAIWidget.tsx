import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { quickAiService } from '../../services/quickAiService';
import type { QuickAIMessage, QuickAIAction } from '../../types/quickAi';
import aiWidgetIcon from '../../assets/image.png';
import {
  Sparkles,
  Minus,
  X,
  Send,
  Paperclip,
  ExternalLink,
  Calendar,
  Upload,
  Pill,
  User,
  Bot,
  ArrowRight,
  Loader2,
  HelpCircle,
  FileText,
  Clock,
} from 'lucide-react';

const PATIENT_SUGGESTIONS = [
  { icon: Calendar, text: 'What is my next appointment?', color: 'text-[#2F80ED] bg-[#EEF5FF]' },
  { icon: Upload, text: 'How do I upload a medical record?', color: 'text-[#0FA3A3] bg-[#E6F7F7]' },
  { icon: Pill, text: 'What are my current medicines?', color: 'text-[#9B51E0] bg-[#F5EEFB]' },
  { icon: User, text: 'How can I change my profile?', color: 'text-[#1FA774] bg-[#E8F8F5]' },
];

const DOCTOR_SUGGESTIONS = [
  { icon: FileText, text: 'Summarize patient records', color: 'text-[#0FA3A3] bg-[#E6F7F7]' },
  { icon: Upload, text: 'Show recent medical reports', color: 'text-[#2F80ED] bg-[#EEF5FF]' },
  { icon: Clock, text: 'How do I manage my schedule?', color: 'text-[#9B51E0] bg-[#F5EEFB]' },
  { icon: Pill, text: 'Draft a patient reminder', color: 'text-[#1FA774] bg-[#E8F8F5]' },
];

export const QuickAIWidget: React.FC = () => {
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isDoctor = location.pathname.startsWith('/doctor') || role === 'DOCTOR';
  const defaultSuggestions = isDoctor ? DOCTOR_SUGGESTIONS : PATIENT_SUGGESTIONS;

  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [inputValue, setInputValue] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [showTooltip, setShowTooltip] = useState<boolean>(false);

  const [messages, setMessages] = useState<QuickAIMessage[]>([
    {
      id: 'msg-welcome',
      sender: 'ai',
      text: `Hi! I'm MediAssist AI 👋\nHow can I help you today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (isOpen && !isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isMinimized]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, isMinimized]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Auto-focus input when AI response finishes
  useEffect(() => {
    if (!loading && isOpen) {
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [loading, isOpen]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputValue).trim();
    if (!query || loading) return;

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg: QuickAIMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: timeStr,
      status: 'sent',
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputValue('');
    setLoading(true);

    try {
      const res = await quickAiService.askQuickAI(query);
      const aiMsg: QuickAIMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: res.message,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        action: res.action,
        suggestedQuestions: res.suggested_questions,
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.error('Quick AI error:', err);
      const errorMsg: QuickAIMessage = {
        id: `err-${Date.now()}`,
        sender: 'ai',
        text: 'Sorry, I could not process that request right now. Please try again or open the full AI Assistant.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        action: { label: 'Open AI Assistant', route: '/patient/ai-assistant' },
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleActionClick = (action: QuickAIAction) => {
    navigate(action.route);
    setIsOpen(false);
  };

  const latestMessage = messages[messages.length - 1];
  const showInitialSuggestions = messages.length === 1 && !loading;

  return (
    <div className="fixed bottom-6 right-6 z-40 font-sans select-none print:hidden">
      {/* 1. Chatbot Main Panel */}
      {isOpen && (
        <div
          className={`fixed bottom-24 right-6 w-[360px] max-w-[calc(100vw-32px)] bg-white rounded-3xl border border-[#D9E1EA] shadow-[0_12px_45px_rgba(16,42,86,0.18)] flex flex-col overflow-hidden transition-all duration-200 z-50 ${isMinimized ? 'h-14 overflow-hidden shadow-md' : 'h-[520px] max-h-[82vh]'
            }`}
          role="dialog"
          aria-label="MediAssist AI Quick Assistant"
        >
          {/* Header */}
          <div className="bg-[#0FA3A3] text-white px-4 py-3.5 flex items-center justify-between shrink-0 shadow-xs">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#FED7AA] animate-pulse" />
              <span className="font-bold text-sm tracking-wide">MediAssist AI</span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                aria-label={isMinimized ? 'Expand window' : 'Minimize window'}
              >
                <Minus className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                aria-label="Close MediAssist AI"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Online Status Row */}
              <div className="px-4 py-1.5 bg-[#F7FAFF] border-b border-[#E7EDF4] flex items-center gap-2 text-[11px] font-semibold text-[#5F6F86] shrink-0">
                <span className="w-2 h-2 rounded-full bg-[#1FA774] shadow-[0_0_8px_rgba(31,167,116,0.6)] animate-pulse" />
                <span>AI Assistant • Online</span>
              </div>

              {/* Messages Body */}
              <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-[#FCFDFE]">
                {messages.map((msg) => (
                  <div key={msg.id} className="space-y-1">
                    {msg.sender === 'user' ? (
                      /* User Message Bubble */
                      <div className="flex flex-col items-end space-y-1">
                        <div className="bg-[#102A56] text-white px-3.5 py-2.5 rounded-2xl rounded-tr-xs text-xs font-medium max-w-[85%] leading-relaxed shadow-2xs">
                          {msg.text}
                        </div>
                        <span className="text-[10px] text-[#8A98AA] font-medium pr-1">{msg.timestamp}</span>
                      </div>
                    ) : (
                      /* AI Message Card */
                      <div className="flex items-start gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-[#EEF5FF] text-[#0FA3A3] border border-[#D9E1EA] flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                          <Bot className="w-4 h-4" />
                        </div>
                        <div className="space-y-2 max-w-[85%]">
                          <div className="bg-[#F4F8FC] border border-[#E2E8F0] p-3 rounded-2xl rounded-tl-xs text-xs text-[#102A56] leading-relaxed shadow-2xs">
                            <p className="whitespace-pre-line">{msg.text}</p>
                            {msg.action && (
                              <div className="mt-2.5 pt-2 border-t border-[#E2E8F0]">
                                <button
                                  type="button"
                                  onClick={() => handleActionClick(msg.action!)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0FA3A3] hover:bg-[#0D8E8E] text-white text-[11px] font-bold shadow-2xs transition-all cursor-pointer"
                                >
                                  <span>{msg.action.label}</span>
                                  <ArrowRight className="w-3 h-3" />
                                </button>
                              </div>
                            )}
                          </div>
                          <span className="text-[10px] text-[#8A98AA] font-medium pl-1">{msg.timestamp}</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {/* Initial Suggested Questions Chips */}
                {showInitialSuggestions && (
                  <div className="space-y-2 pt-1 pl-9">
                    {defaultSuggestions.map((item, idx) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSendMessage(item.text)}
                          className="w-full flex items-center gap-2.5 p-2.5 rounded-2xl bg-white hover:bg-[#F4F8FC] border border-[#D9E1EA]/80 hover:border-[#0FA3A3] text-left text-xs font-semibold text-[#102A56] shadow-2xs transition-all cursor-pointer group"
                        >
                          <div className={`w-6 h-6 rounded-lg ${item.color} flex items-center justify-center shrink-0`}>
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                          <span className="truncate group-hover:text-[#0FA3A3]">{item.text}</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Loading indicator */}
                {loading && (
                  <div className="flex items-center gap-2.5 pl-2">
                    <div className="w-7 h-7 rounded-full bg-[#EEF5FF] text-[#0FA3A3] border border-[#D9E1EA] flex items-center justify-center shrink-0 shadow-2xs">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div className="bg-[#F4F8FC] border border-[#E2E8F0] px-3.5 py-2.5 rounded-2xl rounded-tl-xs flex items-center gap-1.5 shadow-2xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#0FA3A3] animate-bounce [animation-delay:-0.3s]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-[#0FA3A3] animate-bounce [animation-delay:-0.15s]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-[#0FA3A3] animate-bounce" />
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-3 bg-white border-t border-[#E7EDF4] flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => alert('To attach clinical reports, please visit the My Records section.')}
                  className="p-1.5 rounded-lg text-[#8A98AA] hover:text-[#102A56] hover:bg-[#F4F8FC] transition-colors cursor-pointer shrink-0"
                  aria-label="Attach file"
                  title="Attach file"
                >
                  <Paperclip className="w-4 h-4" />
                </button>

                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask something..."
                  disabled={loading}
                  className="flex-1 px-3.5 py-2 bg-[#F4F8FC] border border-[#D9E1EA] rounded-full text-xs text-[#102A56] font-medium placeholder:text-[#8A98AA] focus:bg-white focus:border-[#0FA3A3] focus:ring-1 focus:ring-[#0FA3A3] focus:outline-none transition-all disabled:opacity-50"
                />

                <button
                  type="button"
                  onClick={() => handleSendMessage()}
                  disabled={!inputValue.trim() || loading}
                  className="w-8 h-8 rounded-full bg-[#0FA3A3] hover:bg-[#0D8E8E] text-white flex items-center justify-center transition-all cursor-pointer shadow-xs disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                  aria-label="Send message"
                >
                  {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Footer Hand-off to Full AI Assistant */}
              <div className="px-4 py-2 bg-[#F7FAFF] border-t border-[#E7EDF4] text-center text-[11px] text-[#5F6F86] shrink-0">
                <span>For more detailed help, open </span>
                <button
                  type="button"
                  onClick={() => {
                    navigate('/patient/ai-assistant');
                    setIsOpen(false);
                  }}
                  className="text-[#0FA3A3] font-bold inline-flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <span>AI Assistant</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* 2. Floating Circular Trigger Button */}
      <div className="relative flex items-center justify-center">
        {/* Tooltip on hover */}
        {showTooltip && !isOpen && (
          <div className="absolute right-16 px-3 py-1.5 rounded-xl bg-[#102A56] text-white text-[11px] font-bold shadow-lg whitespace-nowrap animate-in fade-in zoom-in-95 duration-150">
            MediAssist AI
          </div>
        )}

        {/* Glow Ring Effect */}
        <div className="absolute -inset-1.5 rounded-full bg-[#0FA3A3]/25 animate-pulse blur-xs pointer-events-none" />

        <button
          type="button"
          onClick={() => {
            setIsOpen(!isOpen);
            setIsMinimized(false);
          }}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          className="relative w-14 h-14 rounded-full bg-white hover:bg-[#F4F8FC] flex items-center justify-center shadow-[0_8px_25px_rgba(15,163,163,0.35)] hover:shadow-[0_10px_30px_rgba(15,163,163,0.5)] hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer border-2 border-[#0FA3A3]/30 focus:outline-none focus:ring-4 focus:ring-[#0FA3A3]/30 p-1.5 overflow-hidden"
          aria-label="Open MediAssist AI Assistant"
          aria-expanded={isOpen}
        >
          {isOpen ? (
            <X className="w-6 h-6 text-[#102A56]" />
          ) : (
            <div className="relative w-full h-full flex items-center justify-center">
              <img
                src={aiWidgetIcon}
                alt="MediAssist AI"
                className="w-full h-full object-contain rounded-full"
              />
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#0FA3A3] border-2 border-white animate-ping" />
            </div>
          )}
        </button>
      </div>
    </div>
  );
};
