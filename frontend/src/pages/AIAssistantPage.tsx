import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { aiAssistantService } from '../services/aiAssistantService';
import type {
  ConversationThread,
  ChatMessage,
  ClinicalSummary,
  StructuredReviewPayload,
} from '../types/aiAssistant';

import {
  Sparkles,
  Plus,
  Search,
  Calendar,
  FileText,
  Share2,
  Printer,
  Trash2,
  Send,
  User,
  ArrowRight,
  Loader2,
  CheckCircle2,
  Copy,
  Check,
  X,
  ShieldCheck,
  AlertTriangle,
  Edit3,
  Stethoscope,
  Info,
} from 'lucide-react';
import logoImg from '../assets/image.png';

export const AIAssistantPage: React.FC = () => {
  const navigate = useNavigate();

  // State: Conversations & Active Chat
  const [conversations, setConversations] = useState<ConversationThread[]>([]);
  const [activeId, setActiveId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [loading, setLoading] = useState<boolean>(true);
  const [sending, setSending] = useState<boolean>(false);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // State: Inline Edit Modal for Review Card
  const [editingCard, setEditingCard] = useState<StructuredReviewPayload | null>(null);
  const [editChiefComplaint, setEditChiefComplaint] = useState<string>('');
  const [editOnset, setEditOnset] = useState<string>('');
  const [editSeverity, setEditSeverity] = useState<string>('');
  const [editLocation, setEditLocation] = useState<string>('');
  const [confirmingConsultation, setConfirmingConsultation] = useState<boolean>(false);

  // State: Summary Modal
  const [showSummaryModal, setShowSummaryModal] = useState<boolean>(false);
  const [summaryDateFrom, setSummaryDateFrom] = useState<string>(
    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [summaryDateTo, setSummaryDateTo] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [selectedConvIds, setSelectedConvIds] = useState<string[]>([]);
  const [generatingSummary, setGeneratingSummary] = useState<boolean>(false);
  const [generatedSummary, setGeneratedSummary] = useState<ClinicalSummary | null>(null);
  const [summaryTab, setSummaryTab] = useState<'patient' | 'doctor'>('patient');
  const [shareSuccess, setShareSuccess] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Load conversations
  const loadConversations = async () => {
    try {
      setLoading(true);
      const data = await aiAssistantService.getConversations(searchQuery, dateFilter !== 'all' ? dateFilter : undefined);
      setConversations(data);
      if (data.length > 0 && (!activeId || !data.some((c) => c.id === activeId))) {
        setActiveId(data[0].id);
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConversations();
  }, [dateFilter]);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversations, sending, activeId]);

  // Auto-focus input when sending finishes
  useEffect(() => {
    if (!sending) {
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [sending]);

  const activeConversation = conversations.find((c) => c.id === activeId) || conversations[0];

  const handleCreateNewConversation = async () => {
    try {
      const newConv = await aiAssistantService.createConversation('New Health Consultation');
      setConversations((prev) => [newConv, ...prev]);
      setActiveId(newConv.id);
      setTimeout(() => inputRef.current?.focus(), 100);
    } catch (err) {
      console.error('Failed to create new conversation:', err);
    }
  };

  const handleSendMessage = async (customText?: string) => {
    const textToSend = (customText || inputMessage).trim();
    if (!textToSend || sending) return;

    let targetConvId = activeId;
    if (!targetConvId || !conversations.some((c) => c.id === targetConvId)) {
      try {
        const newConv = await aiAssistantService.createConversation('Health Consultation');
        setConversations((prev) => [newConv, ...prev.filter((c) => c.id !== newConv.id)]);
        targetConvId = newConv.id;
        setActiveId(newConv.id);
      } catch (err) {
        console.error('Failed to ensure active consultation:', err);
        return;
      }
    }

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: timeStr,
    };

    // Optimistically append user message
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === targetConvId) {
          return {
            ...c,
            snippet: `You: ${textToSend.slice(0, 45)}...`,
            messages: [...c.messages, userMsg],
          };
        }
        return c;
      })
    );

    if (!customText) setInputMessage('');
    setSending(true);

    try {
      const placeholderId = `ai-stream-${Date.now()}`;
      const placeholderMsg: ChatMessage = {
        id: placeholderId,
        sender: 'ai',
        text: '...',
        timestamp: timeStr,
      };

      setConversations((prev) =>
        prev.map((c) => (c.id === targetConvId ? { ...c, messages: [...c.messages, placeholderMsg] } : c))
      );

      await aiAssistantService.streamMessage(
        targetConvId,
        textToSend,
        (currentText) => {
          setConversations((prev) =>
            prev.map((c) => {
              if (c.id === targetConvId) {
                const updatedMsgs = c.messages.map((m) =>
                  m.id === placeholderId ? { ...m, text: currentText } : m
                );
                return { ...c, messages: updatedMsgs };
              }
              return c;
            })
          );
        }
      );
    } catch (err) {
      console.error('Failed to send message:', err);
      const errMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'ai',
        text: 'Sorry, I could not process your request at this moment. Please check your connection and try again.',
        timestamp: timeStr,
      };
      setConversations((prev) =>
        prev.map((c) => (c.id === targetConvId ? { ...c, messages: [...c.messages, errMsg] } : c))
      );
    } finally {
      setSending(false);
    }
  };

  const handleOpenEditCard = (payload: StructuredReviewPayload) => {
    setEditingCard(payload);
    setEditChiefComplaint(payload.chief_complaint || '');
    setEditOnset(payload.onset || '');
    setEditSeverity(payload.severity || '');
    setEditLocation(payload.location || '');
  };

  const handleSaveCorrections = async () => {
    if (!activeId) return;
    try {
      await aiAssistantService.correctConsultationContext(activeId, {
        chief_complaint: editChiefComplaint,
        onset: editOnset,
        severity: editSeverity,
        location: editLocation,
      });

      setConversations((prev) =>
        prev.map((c) => {
          if (c.id === activeId) {
            const updatedMessages = c.messages.map((m) => {
              if (m.message_type === 'review_card' && m.structured_payload) {
                return {
                  ...m,
                  structured_payload: {
                    ...m.structured_payload,
                    chief_complaint: editChiefComplaint,
                    onset: editOnset,
                    severity: editSeverity,
                    location: editLocation,
                    provenance: {
                      ...m.structured_payload.provenance,
                      chief_complaint: 'PATIENT_CORRECTED',
                      onset: 'PATIENT_CORRECTED',
                      severity: 'PATIENT_CORRECTED',
                      location: 'PATIENT_CORRECTED',
                    },
                  },
                };
              }
              return m;
            });
            return { ...c, messages: updatedMessages };
          }
          return c;
        })
      );
      setEditingCard(null);
    } catch (err) {
      console.error('Failed to save corrections:', err);
    }
  };

  const handleConfirmConsultation = async () => {
    if (!activeId || confirmingConsultation) return;
    try {
      setConfirmingConsultation(true);
      await aiAssistantService.confirmConsultation(activeId);
      loadConversations();
    } catch (err) {
      console.error('Failed to confirm consultation:', err);
    } finally {
      setConfirmingConsultation(false);
    }
  };

  const handleDeleteConversation = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this consultation?')) return;
    try {
      await aiAssistantService.deleteConversation(id);
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (activeId === id) {
        const remaining = conversations.filter((c) => c.id !== id);
        if (remaining.length > 0) setActiveId(remaining[0].id);
      }
    } catch (err) {
      console.error('Failed to delete conversation:', err);
    }
  };

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Generate Summary Handler
  const handleGenerateSummary = async () => {
    try {
      setGeneratingSummary(true);
      const summary = await aiAssistantService.generateSummary({
        conversation_ids: selectedConvIds.length > 0 ? selectedConvIds : undefined,
        date_from: summaryDateFrom,
        date_to: summaryDateTo,
      });
      setGeneratedSummary(summary);
    } catch (err) {
      console.error('Failed to generate summary:', err);
    } finally {
      setGeneratingSummary(false);
    }
  };

  const handleShareWithDoctor = async () => {
    if (!generatedSummary) return;
    try {
      await aiAssistantService.shareSummary(generatedSummary.id);
      setShareSuccess(true);
      setTimeout(() => setShareSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to share summary:', err);
    }
  };

  const healthTopics = aiAssistantService.getHealthTopics();

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-130px)] max-h-[calc(100vh-130px)] overflow-hidden font-sans">
      {/* 1. LEFT SIDEBAR: Consultations List & Search */}
      <div className="w-full lg:w-80 h-full max-h-full bg-white rounded-3xl border border-[#D9E1EA] shadow-sm flex flex-col overflow-hidden shrink-0">
        {/* Header & New Consultation */}
        <div className="p-4 border-b border-[#E7EDF4] space-y-3 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#0FA3A3]/10 border border-[#0FA3A3]/20 flex items-center justify-center p-1">
                <img src={logoImg} alt="MediAssist Logo" className="w-full h-full object-contain" />
              </div>
              <h2 className="font-bold text-[#102A56] text-sm">Consultations</h2>
            </div>
            <button
              type="button"
              onClick={handleCreateNewConversation}
              className="px-3 py-1.5 rounded-xl bg-[#0FA3A3] hover:bg-[#0D8E8E] text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#8A98AA] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadConversations()}
              placeholder="Search consultations..."
              className="w-full pl-8 pr-3 py-1.5 bg-[#F4F8FC] border border-[#D9E1EA] rounded-xl text-xs text-[#102A56] placeholder:text-[#8A98AA] focus:bg-white focus:border-[#0FA3A3] focus:outline-none transition-all"
            />
          </div>

          {/* Date Filter & Summary Generator Trigger */}
          <div className="flex items-center justify-between gap-2 pt-1">
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="text-[11px] font-semibold text-[#5F6F86] bg-[#F4F8FC] border border-[#D9E1EA] rounded-lg px-2 py-1 focus:outline-none cursor-pointer"
            >
              <option value="all">All Dates</option>
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="last7">Last 7 Days</option>
              <option value="last30">Last 30 Days</option>
            </select>

            <button
              type="button"
              onClick={() => {
                setGeneratedSummary(null);
                setShowSummaryModal(true);
              }}
              className="text-[11px] font-bold text-[#0FA3A3] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Summary</span>
            </button>
          </div>
        </div>

        {/* Consultations List */}
        <div className="flex-1 overflow-y-auto sidebar-scrollbar p-2 space-y-1.5">
          {loading ? (
            <div className="p-8 text-center text-[#8A98AA] text-xs flex flex-col items-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-[#0FA3A3]" />
              <span>Loading consultations...</span>
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-6 text-center text-[#8A98AA] text-xs">
              No consultations found. Click <strong>+ New</strong> to begin.
            </div>
          ) : (
            conversations.map((conv) => {
              const isActive = conv.id === activeId;
              const isConfirmed = conv.consultation_state === 'CONFIRMED' || conv.consultation_state === 'COMPLETED';
              return (
                <div
                  key={conv.id}
                  onClick={() => setActiveId(conv.id)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer group flex items-start justify-between gap-2 ${
                    isActive
                      ? 'bg-[#EEF5FF] border-[#2F80ED]/40 shadow-xs'
                      : 'bg-white hover:bg-[#F8FAFC] border-transparent hover:border-[#E2E8F0]'
                  }`}
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <h4
                        className={`text-xs font-bold truncate ${
                          isActive ? 'text-[#102A56]' : 'text-[#2D3748]'
                        }`}
                      >
                        {conv.title}
                      </h4>
                      <span className="text-[10px] text-[#8A98AA] whitespace-nowrap shrink-0">
                        {conv.timestamp}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-[11px] text-[#5F6F86] truncate flex-1">{conv.snippet}</p>
                      {isConfirmed && (
                        <span className="px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[9px] font-bold shrink-0">
                          Reviewed
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => handleDeleteConversation(e, conv.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-[#8A98AA] hover:text-red-500 rounded-lg hover:bg-white transition-all shrink-0"
                    title="Delete consultation"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 2. MAIN CONVERSATION / CONSULTATION AREA */}
      <div className="flex-1 h-full max-h-full bg-white rounded-3xl border border-[#D9E1EA] shadow-sm flex flex-col overflow-hidden">
        {/* Top Header */}
        <div className="p-4 border-b border-[#E7EDF4] flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#0FA3A3]/10 border border-[#0FA3A3]/30 flex items-center justify-center p-1.5 shadow-2xs">
              <img src={logoImg} alt="MediAssist AI" className="w-full h-full object-contain" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-sm text-[#102A56]">
                  {activeConversation?.title || 'MediAssist AI Pre-Consultation'}
                </h1>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {activeConversation?.consultation_state === 'CONFIRMED' ? 'Confirmed' : 'Active'}
                </span>
              </div>
              <p className="text-[11px] text-[#5F6F86]">
                Adaptive pre-consultation reasoning, triage & structured medical history
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setGeneratedSummary(null);
              setShowSummaryModal(true);
            }}
            className="px-3 py-1.5 rounded-xl border border-[#0FA3A3] text-[#0FA3A3] hover:bg-[#E6F7F7] text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
          >
            <FileText className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Generate Summary</span>
          </button>
        </div>

        {/* Messages Feed */}
        <div className="flex-1 p-6 overflow-y-auto chat-scrollbar space-y-6 bg-[#FCFDFE]">
          {activeConversation?.messages && activeConversation.messages.length > 0 ? (
            activeConversation.messages.map((msg) => {
              const isUser = msg.sender === 'user';
              const isReviewCard = msg.message_type === 'review_card' && msg.structured_payload;
              const isRedFlag = msg.message_type === 'red_flag_alert';
              const isReport = msg.message_type === 'report';

              return (
                <div key={msg.id} className={`flex items-start gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
                  {!isUser && (
                    <div className="w-8 h-8 rounded-full bg-[#0FA3A3]/10 border border-[#0FA3A3]/30 flex items-center justify-center shrink-0 mt-0.5 p-1">
                      <img src={logoImg} alt="AI" className="w-full h-full object-contain" />
                    </div>
                  )}

                  <div className={`space-y-2 max-w-[90%] sm:max-w-[80%] ${isUser ? 'items-end' : 'items-start'}`}>
                    {/* Normal Chat Bubble */}
                    <div
                      className={`p-4 rounded-3xl text-xs leading-relaxed shadow-2xs ${
                        isUser
                          ? 'bg-[#102A56] text-white rounded-tr-xs'
                          : isRedFlag
                          ? 'bg-rose-50 border-2 border-rose-300 text-rose-950 rounded-tl-xs'
                          : 'bg-[#F4F8FC] text-[#102A56] border border-[#E2E8F0] rounded-tl-xs'
                      }`}
                    >
                      {isRedFlag && (
                        <div className="flex items-center gap-2 mb-2 font-bold text-rose-700 text-xs">
                          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                          <span>Emergency Medical Alert</span>
                        </div>
                      )}

                      <p className="whitespace-pre-line font-medium">{msg.text}</p>

                      {/* Navigation Action Button */}
                      {msg.action && (
                        <div className="mt-3 pt-2.5 border-t border-[#E2E8F0]">
                          <button
                            type="button"
                            onClick={() => navigate(msg.action!.route)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#0FA3A3] hover:bg-[#0D8E8E] text-white text-xs font-bold shadow-2xs transition-all cursor-pointer"
                          >
                            <span>{msg.action.label}</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* INTERACTIVE STRUCTURED REVIEW CARD */}
                    {isReviewCard && msg.structured_payload && (
                      <div className="p-5 rounded-3xl bg-white border-2 border-[#0FA3A3]/40 shadow-md space-y-4 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between border-b border-[#E7EDF4] pb-3">
                          <div className="flex items-center gap-2">
                            <Stethoscope className="w-4 h-4 text-[#0FA3A3]" />
                            <h3 className="font-bold text-xs text-[#102A56]">Your Consultation Summary</h3>
                          </div>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#E6F7F7] text-[#0FA3A3]">
                            Ready for Review
                          </span>
                        </div>

                        {/* Structured Clinical Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          <div className="p-2.5 rounded-xl bg-[#F4F8FC] border border-[#E2E8F0]">
                            <span className="text-[10px] font-bold text-[#8A98AA] block uppercase">Main Concern</span>
                            <span className="font-bold text-[#102A56]">{msg.structured_payload.chief_complaint || 'Not specified'}</span>
                          </div>
                          <div className="p-2.5 rounded-xl bg-[#F4F8FC] border border-[#E2E8F0]">
                            <span className="text-[10px] font-bold text-[#8A98AA] block uppercase">Started</span>
                            <span className="font-bold text-[#102A56]">{msg.structured_payload.onset || 'Not mentioned'}</span>
                          </div>
                          <div className="p-2.5 rounded-xl bg-[#F4F8FC] border border-[#E2E8F0]">
                            <span className="text-[10px] font-bold text-[#8A98AA] block uppercase">Severity</span>
                            <span className="font-bold text-[#102A56]">{msg.structured_payload.severity || 'Not mentioned'}</span>
                          </div>
                          <div className="p-2.5 rounded-xl bg-[#F4F8FC] border border-[#E2E8F0]">
                            <span className="text-[10px] font-bold text-[#8A98AA] block uppercase">Location</span>
                            <span className="font-bold text-[#102A56]">{msg.structured_payload.location || 'Not mentioned'}</span>
                          </div>
                        </div>

                        {/* Provenance note */}
                        <div className="flex items-center gap-1.5 text-[10px] text-[#5F6F86] bg-[#F8FAFC] p-2 rounded-xl border border-[#E2E8F0]">
                          <Info className="w-3.5 h-3.5 text-[#0FA3A3] shrink-0" />
                          <span>All extracted details can be adjusted to ensure total clinical accuracy.</span>
                        </div>

                        {/* Card Actions */}
                        <div className="flex items-center gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEditCard(msg.structured_payload!)}
                            className="px-3.5 py-2 rounded-xl bg-[#F4F8FC] hover:bg-[#E2E8F0] text-[#102A56] text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-[#D9E1EA]"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Edit Information</span>
                          </button>

                          <button
                            type="button"
                            onClick={handleConfirmConsultation}
                            disabled={confirmingConsultation}
                            className="flex-1 px-4 py-2 rounded-xl bg-[#1FA774] hover:bg-[#1A8D62] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs transition-all cursor-pointer disabled:opacity-50"
                          >
                            {confirmingConsultation ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Check className="w-3.5 h-3.5" />
                            )}
                            <span>Everything Looks Correct & Confirm</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* CONFIRMED REPORT PREVIEW */}
                    {isReport && msg.structured_payload?.report && (
                      <div className="p-5 rounded-3xl bg-white border border-[#D9E1EA] shadow-md space-y-3">
                        <div className="flex items-center justify-between border-b border-[#E7EDF4] pb-2">
                          <div className="flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-emerald-600" />
                            <h4 className="font-bold text-xs text-[#102A56]">Confirmed Pre-Consultation Summary</h4>
                          </div>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                            Ready for Doctor
                          </span>
                        </div>
                        <div className="p-4 rounded-2xl bg-[#FCFDFE] border border-[#E2E8F0] font-mono text-[11px] text-[#102A56] whitespace-pre-line leading-relaxed">
                          {msg.structured_payload.report}
                        </div>
                      </div>
                    )}

                    <div className={`flex items-center gap-2 px-1 text-[10px] text-[#8A98AA] ${isUser ? 'justify-end' : 'justify-start'}`}>
                      <span>{msg.timestamp}</span>
                      {!isUser && (
                        <button
                          type="button"
                          onClick={() => handleCopyText(msg.id, msg.text)}
                          className="hover:text-[#102A56] transition-colors cursor-pointer"
                          title="Copy text"
                        >
                          {copiedId === msg.id ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        </button>
                      )}
                    </div>
                  </div>

                  {isUser && (
                    <div className="w-8 h-8 rounded-full bg-[#102A56] text-white flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-4">
              <div className="w-14 h-14 rounded-3xl bg-[#0FA3A3]/10 border border-[#0FA3A3]/20 flex items-center justify-center p-2.5 shadow-sm">
                <img src={logoImg} alt="MediAssist AI" className="w-full h-full object-contain" />
              </div>
              <div className="max-w-md space-y-1">
                <h3 className="font-bold text-sm text-[#102A56]">Welcome to MediAssist AI</h3>
                <p className="text-xs text-[#5F6F86]">
                  Speak naturally about your symptoms. The assistant will adaptively collect key details and prepare your pre-consultation summary.
                </p>
              </div>

              {/* Health Topic Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-xl text-left pt-4">
                {healthTopics.map((ht) => (
                  <button
                    key={ht.id}
                    type="button"
                    onClick={() => handleSendMessage(ht.prompt)}
                    className="p-4 rounded-2xl bg-white hover:bg-[#F4F8FC] border border-[#D9E1EA] hover:border-[#0FA3A3] active:scale-[0.98] transition-all text-left shadow-2xs group cursor-pointer"
                  >
                    <h4 className="text-xs font-bold text-[#102A56] group-hover:text-[#0FA3A3]">{ht.name}</h4>
                    <p className="text-[11px] text-[#5F6F86] mt-1 line-clamp-2">{ht.prompt}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Typing Indicator */}
          {sending && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#0FA3A3]/10 border border-[#0FA3A3]/30 flex items-center justify-center shrink-0 p-1">
                <img src={logoImg} alt="AI" className="w-full h-full object-contain" />
              </div>
              <div className="bg-[#F4F8FC] border border-[#E2E8F0] px-4 py-3 rounded-3xl rounded-tl-xs flex items-center gap-1.5 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-[#0FA3A3] animate-bounce [animation-delay:-0.3s]" />
                <span className="w-2 h-2 rounded-full bg-[#0FA3A3] animate-bounce [animation-delay:-0.15s]" />
                <span className="w-2 h-2 rounded-full bg-[#0FA3A3] animate-bounce" />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-4 bg-white border-t border-[#E7EDF4] shrink-0">
          <div className="flex items-end gap-2 bg-[#F4F8FC] border border-[#D9E1EA] rounded-2xl p-2 focus-within:bg-white focus-within:border-[#0FA3A3] focus-within:ring-1 focus-within:ring-[#0FA3A3] transition-all">
            <textarea
              ref={inputRef}
              rows={2}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Ask anything or tell me what's on your mind..."
              disabled={sending}
              className="flex-1 bg-transparent text-xs text-[#102A56] placeholder:text-[#8A98AA] focus:outline-none resize-none p-1.5"
            />

            <button
              type="button"
              onClick={() => handleSendMessage()}
              disabled={!inputMessage.trim() || sending}
              className="w-9 h-9 rounded-xl bg-[#0FA3A3] hover:bg-[#0D8E8E] text-white flex items-center justify-center transition-all cursor-pointer shadow-xs disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
              aria-label="Send Message"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>

          <div className="mt-2 text-center">
            <span className="text-[10px] text-[#8A98AA]">
              MediAssist AI provides clinical pre-consultation guidance and does not replace emergency medical care.
            </span>
          </div>
        </div>
      </div>

      {/* 3. INLINE EDIT MODAL FOR PATIENT CORRECTIONS */}
      {editingCard && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#D9E1EA] shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[#E7EDF4] pb-3">
              <h3 className="font-bold text-sm text-[#102A56]">Correct Extracted Information</h3>
              <button
                type="button"
                onClick={() => setEditingCard(null)}
                className="p-1 rounded-lg text-[#8A98AA] hover:text-[#102A56] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-[#102A56] mb-1">Main Concern</label>
                <input
                  type="text"
                  value={editChiefComplaint}
                  onChange={(e) => setEditChiefComplaint(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F4F8FC] border border-[#D9E1EA] rounded-xl text-[#102A56] focus:outline-none focus:border-[#0FA3A3]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#102A56] mb-1">When Did It Start? (Onset)</label>
                <input
                  type="text"
                  value={editOnset}
                  onChange={(e) => setEditOnset(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F4F8FC] border border-[#D9E1EA] rounded-xl text-[#102A56] focus:outline-none focus:border-[#0FA3A3]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#102A56] mb-1">Severity (e.g. 6/10 or Mild/Moderate)</label>
                <input
                  type="text"
                  value={editSeverity}
                  onChange={(e) => setEditSeverity(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F4F8FC] border border-[#D9E1EA] rounded-xl text-[#102A56] focus:outline-none focus:border-[#0FA3A3]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#102A56] mb-1">Location / Pain Area</label>
                <input
                  type="text"
                  value={editLocation}
                  onChange={(e) => setEditLocation(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F4F8FC] border border-[#D9E1EA] rounded-xl text-[#102A56] focus:outline-none focus:border-[#0FA3A3]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E7EDF4]">
              <button
                type="button"
                onClick={() => setEditingCard(null)}
                className="px-4 py-2 rounded-xl bg-[#F4F8FC] text-[#5F6F86] text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveCorrections}
                className="px-4 py-2 rounded-xl bg-[#0FA3A3] hover:bg-[#0D8E8E] text-white text-xs font-bold cursor-pointer shadow-2xs"
              >
                Save Corrections
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. CLINICAL SUMMARY & DOCTOR REPORT MODAL */}
      {showSummaryModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border border-[#D9E1EA] shadow-2xl max-w-3xl w-full overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 bg-[#0FA3A3] text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <FileText className="w-5 h-5 text-[#FED7AA]" />
                <div>
                  <h3 className="font-bold text-base">Generate Clinical AI Summary</h3>
                  <p className="text-xs text-white/80">Date-range aggregation & doctor-readable report</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSummaryModal(false)}
                className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-[#FCFDFE]">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white p-4 rounded-2xl border border-[#D9E1EA]">
                <div>
                  <label className="block text-xs font-bold text-[#102A56] mb-1">From Date</label>
                  <input
                    type="date"
                    value={summaryDateFrom}
                    onChange={(e) => setSummaryDateFrom(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F4F8FC] border border-[#D9E1EA] rounded-xl text-xs text-[#102A56] focus:outline-none focus:border-[#0FA3A3]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#102A56] mb-1">To Date</label>
                  <input
                    type="date"
                    value={summaryDateTo}
                    onChange={(e) => setSummaryDateTo(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F4F8FC] border border-[#D9E1EA] rounded-xl text-xs text-[#102A56] focus:outline-none focus:border-[#0FA3A3]"
                  />
                </div>
              </div>

              {!generatedSummary && (
                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={handleGenerateSummary}
                    disabled={generatingSummary}
                    className="px-6 py-3 rounded-2xl bg-[#0FA3A3] hover:bg-[#0D8E8E] text-white font-bold text-xs flex items-center gap-2 mx-auto shadow-md transition-all cursor-pointer disabled:opacity-50"
                  >
                    {generatingSummary ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Analyzing Conversations & Building Report...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Generate Structured Clinical Summary</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {generatedSummary && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-[#E7EDF4] pb-2">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSummaryTab('patient')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          summaryTab === 'patient'
                            ? 'bg-[#102A56] text-white shadow-2xs'
                            : 'text-[#5F6F86] hover:bg-[#F4F8FC]'
                        }`}
                      >
                        Patient Overview
                      </button>
                      <button
                        type="button"
                        onClick={() => setSummaryTab('doctor')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          summaryTab === 'doctor'
                            ? 'bg-[#0FA3A3] text-white shadow-2xs'
                            : 'text-[#5F6F86] hover:bg-[#F4F8FC]'
                        }`}
                      >
                        Doctor-Readable Report
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => window.print()}
                        className="p-1.5 rounded-lg text-[#5F6F86] hover:text-[#102A56] hover:bg-[#F4F8FC] transition-colors cursor-pointer"
                        title="Print"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={handleShareWithDoctor}
                        className="px-3 py-1.5 rounded-xl bg-[#1FA774] hover:bg-[#1A8D62] text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>Share with Doctor</span>
                      </button>
                    </div>
                  </div>

                  {shareSuccess && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Summary successfully shared with attending physician!</span>
                    </div>
                  )}

                  {summaryTab === 'patient' && (
                    <div className="space-y-4">
                      <div className="p-4 rounded-2xl bg-white border border-[#D9E1EA] space-y-2">
                        <h4 className="text-xs font-bold text-[#102A56]">Key Concerns & Topics</h4>
                        <ul className="list-disc pl-5 text-xs text-[#5F6F86] space-y-1">
                          {generatedSummary.main_concerns?.map((c, i) => (
                            <li key={i}>{c}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="p-4 rounded-2xl bg-white border border-[#D9E1EA] space-y-2">
                        <h4 className="text-xs font-bold text-[#102A56]">Reported Symptoms & Inquiries</h4>
                        <div className="flex flex-wrap gap-1.5">
                          {generatedSummary.symptoms_mentioned?.map((s, i) => (
                            <span key={i} className="px-2.5 py-1 rounded-lg bg-[#EEF5FF] text-[#2F80ED] text-[11px] font-bold">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="p-4 rounded-2xl bg-white border border-[#D9E1EA] space-y-2">
                        <h4 className="text-xs font-bold text-[#102A56]">AI Guidance Provided</h4>
                        <p className="text-xs text-[#5F6F86] leading-relaxed whitespace-pre-line">
                          {generatedSummary.ai_guidance}
                        </p>
                      </div>
                    </div>
                  )}

                  {summaryTab === 'doctor' && (
                    <div className="p-5 rounded-2xl bg-white border border-[#D9E1EA] font-mono text-xs text-[#102A56] whitespace-pre-line leading-relaxed shadow-2xs">
                      {generatedSummary.doctor_readable_report}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="p-4 bg-white border-t border-[#E7EDF4] flex items-center justify-between shrink-0">
              <span className="text-[11px] text-[#8A98AA]">
                AI Summaries reflect patient interactions and do not replace professional diagnoses.
              </span>
              <button
                type="button"
                onClick={() => setShowSummaryModal(false)}
                className="px-4 py-2 rounded-xl bg-[#F4F8FC] hover:bg-[#E2E8F0] text-xs font-bold text-[#102A56] transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
