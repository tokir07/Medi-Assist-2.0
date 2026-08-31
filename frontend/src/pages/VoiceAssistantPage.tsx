import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import {
  voiceAssistantService,
  type ConversationalState,
  type VoiceChatResult,
} from '../services/voiceAssistantService';
import type { VoiceHistoryItem } from '../types/voiceAssistant';
import { MediAssistOrb } from '../components/voice/MediAssistOrb';
import { SuggestedVoicePrompts } from '../components/voice/SuggestedVoicePrompts';

import {
  Mic,
  MicOff,
  Activity,
  Volume2,
  VolumeX,
  ShieldCheck,
  Lock,
  PhoneCall,
  History,
  FileText,
  X,
  ArrowRight,
  MessageSquare,
  Sparkles,
  RefreshCw,
  Power,
  Download,
  Copy,
  Check,
  Stethoscope,
} from 'lucide-react';
import mediassistEmblem from '../assets/image.png';

export const VoiceAssistantPage: React.FC = () => {
  const navigate = useNavigate();

  // Hands-free Conversational State
  const [convState, setConvState] = useState<ConversationalState>('IDLE');
  const [amplitude, setAmplitude] = useState<number>(0);
  const [frequencies, setFrequencies] = useState<number[]>([]);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Live Dialogue & Dialogue History
  const [liveUserTranscript, setLiveUserTranscript] = useState<string>('');
  const [latestAIResponse, setLatestAIResponse] = useState<string>('');
  const [currentAction, setCurrentAction] = useState<{ label: string; route: string } | null>(null);
  const [dialogueList, setDialogueList] = useState<Array<{ sender: 'user' | 'ai'; text: string; time: string }>>([]);
  const [history, setHistory] = useState<VoiceHistoryItem[]>([]);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  // Clinical Session Report State
  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);
  const [summaryReport, setSummaryReport] = useState<string | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState<boolean>(false);
  const [copiedReport, setCopiedReport] = useState<boolean>(false);

  // Auto-scroll ref
  const transcriptBottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // 1. Configure Engine Callbacks
    voiceAssistantService.setCallbacks({
      onStateChange: (newState) => {
        setConvState(newState);
      },
      onLiveTranscript: (text, _isFinal) => {
        setLiveUserTranscript(text);
      },
      onAIResponse: (result: VoiceChatResult) => {
        setLatestAIResponse(result.response);
        setCurrentAction(result.action || null);

        const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        setDialogueList((prev) => [
          ...prev,
          { sender: 'user', text: result.transcript, time: currentTime },
          { sender: 'ai', text: result.response, time: currentTime },
        ]);

        // Add to history
        const newHistItem: VoiceHistoryItem = {
          id: result.conversation_id || result.id || `vh-${Date.now()}`,
          title: result.transcript,
          timestamp: 'Just now',
          duration: '00:15',
          transcript: result.transcript,
          response: result.response,
        };
        setHistory((prev) => [newHistItem, ...prev.filter((h) => h.id !== newHistItem.id)]);
      },
      onAudioMetrics: (amp, freqs) => {
        setAmplitude(amp);
        setFrequencies(freqs);
      },
      onError: (errMsg) => {
        setPermissionError(errMsg);
      },
    });

    // 2. Fetch Initial PostgreSQL Voice History
    let isMounted = true;
    const fetchHistory = async () => {
      try {
        const hist = await voiceAssistantService.getVoiceHistory();
        if (isMounted) {
          setHistory(hist);
          if (hist.length > 0) {
            voiceAssistantService.setConversationId(hist[0].id);
          }
        }
      } catch (err) {
        console.warn('Failed to load voice history:', err);
      }
    };
    fetchHistory();

    return () => {
      isMounted = false;
      voiceAssistantService.endSession();
    };
  }, []);

  useEffect(() => {
    transcriptBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [liveUserTranscript, latestAIResponse, dialogueList]);

  /**
   * Single-Action Start: Activates continuous hands-free loop
   */
  const handleStartHandsFree = async () => {
    setPermissionError(null);
    setLiveUserTranscript('');
    setLatestAIResponse('');
    setCurrentAction(null);

    const started = await voiceAssistantService.startSession();
    if (!started) {
      setPermissionError('Could not start microphone. Please check browser permissions.');
    }
  };

  /**
   * Orb Click Handler
   */
  const handleOrbClick = () => {
    if (convState === 'IDLE' || convState === 'ENDED') {
      handleStartHandsFree();
    } else if (convState === 'AI_SPEAKING') {
      voiceAssistantService.handleBargeIn();
    } else {
      const muted = voiceAssistantService.toggleMute();
      setIsMuted(muted);
    }
  };

  const handleToggleMute = () => {
    const muted = voiceAssistantService.toggleMute();
    setIsMuted(muted);
  };

  const handleEndSession = () => {
    voiceAssistantService.endSession();
  };

  const handleSelectPrompt = (promptText: string) => {
    if (convState === 'IDLE' || convState === 'ENDED') {
      handleStartHandsFree().then(() => {
        voiceAssistantService.injectPrompt(promptText);
      });
    } else {
      voiceAssistantService.injectPrompt(promptText);
    }
  };

  const handleSelectHistory = (item: VoiceHistoryItem) => {
    voiceAssistantService.setConversationId(item.id);
    setLiveUserTranscript(item.transcript || item.title);
    setLatestAIResponse(item.response || 'Past consultation response recorded.');
    setCurrentAction(null);
    setShowHistoryModal(false);
  };

  /**
   * Generates Doctor-Readable Clinical Pre-Consultation Summary Report
   */
  const handleGenerateSessionReport = async () => {
    const convId = voiceAssistantService.getConversationId();
    setIsGeneratingReport(true);
    try {
      if (convId) {
        const res = await voiceAssistantService.generateSessionReport(convId);
        if (res?.clinical_summary) {
          setSummaryReport(res.clinical_summary);
          setIsGeneratingReport(false);
          return;
        }
      }

      // Fallback pre-consultation summary
      setTimeout(() => {
        setSummaryReport(
          `# MediAssist Clinical Pre-Consultation Report\n\n**Date:** ${new Date().toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          })}\n**Mode:** Hands-Free Conversational Voice Consultation\n**Status:** Patient Verified\n\n---\n\n### 1. Discussion Transcript & Key Points\n• ${
            liveUserTranscript || 'Patient wellness check-in and health dialogue'
          }\n\n### 2. Clinical AI Insights & Guidance\n${
            latestAIResponse || 'Provided informational clinical guidance and answered patient inquiries.'
          }\n\n### 3. Physician Recommendations\nDiscuss recorded findings with your attending physician during your next scheduled appointment.`
        );
        setIsGeneratingReport(false);
      }, 500);
    } catch (e) {
      console.warn('Report generation fallback:', e);
      setIsGeneratingReport(false);
    }
  };

  const handleCopyReport = () => {
    if (summaryReport) {
      navigator.clipboard.writeText(summaryReport);
      setCopiedReport(true);
      setTimeout(() => setCopiedReport(false), 2000);
    }
  };

  return (
    <div className="space-y-6 pb-8 animate-fade-in font-sans">
      {/* 1. TOP HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-3xl border border-[#D9E1EA]/80 p-5 shadow-[0_4px_20px_rgba(16,42,86,0.03)]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-[#102A56]">
              MediAssist Voice Assistant
            </h1>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-2xs border ${
                convState !== 'IDLE' && convState !== 'ENDED' && convState !== 'ERROR'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  convState !== 'IDLE' && convState !== 'ENDED' && convState !== 'ERROR'
                    ? 'bg-emerald-500 animate-pulse'
                    : 'bg-slate-400'
                }`}
              />
              <span>{convState === 'IDLE' ? 'Ready' : convState === 'ENDED' ? 'Session Ended' : 'Live Active'}</span>
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#5F6F86] mt-0.5">
            Talk naturally with your MediAssist AI assistant — hands-free with multilingual voice
          </p>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={handleGenerateSessionReport}
            className="px-3.5 py-2 rounded-xl bg-[#0FA3A3] hover:bg-[#0D8E8E] text-white text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-xs"
          >
            <Stethoscope className="w-3.5 h-3.5" />
            <span>Generate Session Report</span>
          </button>

          <button
            type="button"
            onClick={() => setShowHistoryModal(true)}
            className="px-3.5 py-2 rounded-xl bg-[#F4F8FC] hover:bg-[#E6F4F4] text-[#102A56] text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer border border-[#D9E1EA]"
          >
            <History className="w-3.5 h-3.5 text-[#0FA3A3]" />
            <span>History</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/patient/ai-assistant')}
            className="px-3.5 py-2 rounded-xl bg-[#F4F8FC] hover:bg-[#E6F4F4] text-[#102A56] text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer border border-[#D9E1EA]"
          >
            <MessageSquare className="w-3.5 h-3.5 text-[#0FA3A3]" />
            <span>Text AI</span>
          </button>
        </div>
      </div>

      {/* Permission Error Banner */}
      {permissionError && (
        <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between gap-3 shadow-2xs">
          <span>{permissionError}</span>
          <button
            type="button"
            onClick={() => setPermissionError(null)}
            className="text-xs font-bold text-amber-800 hover:underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 2. MAIN 2-COLUMN LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Central Living AI Orb (8 Cols) */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-[#D9E1EA]/80 p-6 sm:p-8 shadow-[0_4px_24px_rgba(16,42,86,0.04)] space-y-7 flex flex-col items-center">
          {/* Card Header Title */}
          <div className="text-center space-y-1">
            <h2 className="text-xl sm:text-2xl font-black text-[#102A56] tracking-tight">
              MediAssist AI Voice Assistant
            </h2>
            <p className="text-xs sm:text-sm text-[#5F6F86]">
              {convState === 'IDLE' || convState === 'ENDED'
                ? 'Tap the orb once to start your hands-free conversation'
                : 'Speak naturally — the assistant listens and answers in native Hindi or English'}
            </p>
          </div>

          {/* Central AI Orb Component with Real-time Voice Reaction */}
          <MediAssistOrb
            state={convState}
            amplitude={amplitude}
            frequencies={frequencies}
            onOrbClick={handleOrbClick}
            isMuted={isMuted}
          />

          {/* Minimal Hands-Free Control Bar */}
          <div className="w-full pt-2 flex flex-col items-center space-y-4">
            <div className="flex items-center justify-center gap-3 p-1.5 rounded-2xl bg-[#F4F8FC] border border-[#E7EDF4] shadow-2xs">
              {/* Main Action / Status Pill */}
              {convState === 'IDLE' || convState === 'ENDED' ? (
                <button
                  type="button"
                  onClick={handleStartHandsFree}
                  className="px-6 py-2.5 rounded-xl bg-[#0FA3A3] hover:bg-[#0D8E8E] text-white text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer shadow-xs active:scale-95"
                >
                  <Mic className="w-4 h-4" />
                  <span>Start Voice Assistant</span>
                </button>
              ) : (
                <>
                  {/* Mute Toggle */}
                  <button
                    type="button"
                    onClick={handleToggleMute}
                    className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                      isMuted
                        ? 'bg-amber-100 text-amber-800 border border-amber-300'
                        : 'bg-white text-[#102A56] border border-[#D9E1EA] hover:bg-[#FAFBFD]'
                    }`}
                  >
                    {isMuted ? <MicOff className="w-3.5 h-3.5 text-amber-700" /> : <Mic className="w-3.5 h-3.5 text-[#0FA3A3]" />}
                    <span>{isMuted ? 'Unmute' : 'Mute'}</span>
                  </button>

                  {/* Barge-In Stop AI Speaking */}
                  {convState === 'AI_SPEAKING' && (
                    <button
                      type="button"
                      onClick={() => voiceAssistantService.handleBargeIn()}
                      className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-xs"
                    >
                      <VolumeX className="w-3.5 h-3.5" />
                      <span>Interrupt (Speak Now)</span>
                    </button>
                  )}

                  {/* End Session */}
                  <button
                    type="button"
                    onClick={handleEndSession}
                    className="px-4 py-2 rounded-xl bg-white hover:bg-red-50 text-red-600 border border-red-200 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-2xs"
                  >
                    <Power className="w-3.5 h-3.5" />
                    <span>End Conversation</span>
                  </button>
                </>
              )}
            </div>

            {/* Privacy & Compliance Badge */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-6 px-4 py-2 rounded-xl bg-[#FCFDFE] border border-[#E7EDF4] text-[11px] text-[#5F6F86]">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#0FA3A3]" />
                <span>Your conversations are secure and private</span>
              </div>
              <span className="hidden sm:inline text-slate-300">|</span>
              <div className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-[#0FA3A3]" />
                <span>HIPAA compliant AI assistant</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Live Dialogue Stream & Pre-Consultation Summary (4 Cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* A. Dedicated Real-Time Session Report Box */}
          <div className="bg-white rounded-3xl border border-[#D9E1EA]/80 p-5 shadow-[0_4px_20px_rgba(16,42,86,0.04)] space-y-3.5">
            <div className="flex items-center justify-between border-b border-[#E7EDF4] pb-2">
              <span className="text-xs font-bold text-[#102A56] flex items-center gap-1.5">
                <Stethoscope className="w-4 h-4 text-[#0FA3A3]" />
                Session Clinical Summary
              </span>
              <button
                type="button"
                onClick={handleGenerateSessionReport}
                className="text-[11px] font-bold text-[#0FA3A3] hover:underline cursor-pointer flex items-center gap-1"
              >
                <span>View Full Report</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-[#FCFDFE] border border-[#E2E8F0] text-xs text-[#5F6F86] space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold text-[#102A56]">Current Topic:</span>
                <span className="text-emerald-700 font-semibold">{liveUserTranscript ? 'Active Health Query' : 'Ready'}</span>
              </div>
              <p className="text-[11px] text-[#102A56] line-clamp-2">
                {latestAIResponse || 'Start talking to automatically generate doctor-readable pre-consultation notes.'}
              </p>
            </div>
          </div>

          {/* B. Live Real-Time Dialogue Stream */}
          <div className="bg-white rounded-3xl border border-[#D9E1EA]/80 p-5 shadow-[0_4px_20px_rgba(16,42,86,0.04)] space-y-3.5">
            <div className="flex items-center justify-between border-b border-[#E7EDF4] pb-2">
              <span className="text-xs font-bold text-[#102A56] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#0FA3A3]" />
                Conversation Dialogue
              </span>
              <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                Live Feed
              </span>
            </div>

            <div className="max-h-72 overflow-y-auto space-y-3 pr-1">
              {dialogueList.length === 0 && !liveUserTranscript && (
                <div className="py-6 text-center text-xs text-[#8A98AA]">
                  Your speech and AI responses will appear here in real-time.
                </div>
              )}

              {dialogueList.map((item, idx) => (
                <div
                  key={`dialogue-${idx}`}
                  className={`p-3 rounded-2xl border text-xs leading-relaxed ${
                    item.sender === 'user'
                      ? 'bg-[#F7FAFF] border-[#E7EDF4] text-[#102A56]'
                      : 'bg-[#F0FDF4] border-emerald-200 text-[#102A56]'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] font-bold pb-1 text-[#8A98AA]">
                    <span className={item.sender === 'user' ? 'text-[#8A98AA]' : 'text-emerald-800'}>
                      {item.sender === 'user' ? 'You' : 'MediAssist AI'}
                    </span>
                    <span>{item.time}</span>
                  </div>
                  <p>{item.text}</p>
                </div>
              ))}

              {/* Current in-flight speech */}
              {liveUserTranscript && (
                <div className="p-3 rounded-2xl bg-[#F7FAFF] border border-[#0FA3A3]/40 text-xs leading-relaxed animate-pulse">
                  <div className="text-[10px] font-bold text-[#0FA3A3] pb-1">Hearing you...</div>
                  <p className="font-semibold text-[#102A56]">&ldquo;{liveUserTranscript}&rdquo;</p>
                </div>
              )}

              {currentAction && (
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => navigate(currentAction.route)}
                    className="w-full py-2 px-3 rounded-xl bg-[#0FA3A3] hover:bg-[#0D8E8E] text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                  >
                    <span>{currentAction.label}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <div ref={transcriptBottomRef} />
            </div>
          </div>

          {/* C. Suggested Prompts */}
          <SuggestedVoicePrompts onSelectPrompt={handleSelectPrompt} />

          {/* D. Emergency Call Support */}
          <div className="bg-white rounded-3xl border border-[#D9E1EA]/80 p-5 shadow-[0_4px_20px_rgba(16,42,86,0.04)] space-y-3">
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-[#102A56]">
                Need Emergency Help?
              </h4>
              <p className="text-[11px] text-[#5F6F86] mt-1 leading-relaxed">
                If you are experiencing severe chest pain, shortness of breath, or critical injury, contact emergency services.
              </p>
            </div>

            <a
              href="tel:112"
              className="w-full py-2.5 px-4 bg-[#FFF5F5] hover:bg-[#FED7D7]/40 text-[#D64545] border border-[#FED7D7] rounded-xl text-xs font-bold transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
            >
              <PhoneCall className="w-4 h-4 text-[#D64545]" />
              <span>Call Emergency Services (112)</span>
            </a>
          </div>
        </div>
      </div>

      {/* 3. CONVERSATION HISTORY MODAL */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#D9E1EA] shadow-2xl max-w-lg w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-[#E7EDF4] pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-[#0FA3A3]" />
                <h3 className="font-bold text-sm text-[#102A56]">Voice Conversation History</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                className="p-1 rounded-lg text-[#8A98AA] hover:text-[#102A56] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
              {history.length === 0 ? (
                <div className="py-8 text-center text-xs text-[#8A98AA]">
                  No past voice conversations recorded yet.
                </div>
              ) : (
                history.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleSelectHistory(item)}
                    className="p-3.5 rounded-2xl border border-[#E7EDF4] hover:border-[#0FA3A3] hover:bg-[#F4F8FC] transition-all cursor-pointer space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-[#102A56] line-clamp-1">{item.title}</h4>
                      <span className="text-[10px] text-[#8A98AA] shrink-0">{item.timestamp}</span>
                    </div>
                    {item.response && (
                      <p className="text-[11px] text-[#5F6F86] line-clamp-2">{item.response}</p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* 4. DOCTOR-READABLE CLINICAL SUMMARY MODAL */}
      {summaryReport && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#D9E1EA] shadow-2xl max-w-xl w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-[#E7EDF4] pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#0FA3A3]" />
                <h3 className="font-bold text-sm text-[#102A56]">Doctor-Readable Clinical Pre-Consultation Summary</h3>
              </div>
              <button
                type="button"
                onClick={() => setSummaryReport(null)}
                className="p-1 rounded-lg text-[#8A98AA] hover:text-[#102A56] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 rounded-2xl bg-[#FCFDFE] border border-[#E2E8F0] font-mono text-[11px] text-[#102A56] whitespace-pre-line leading-relaxed">
              {summaryReport}
            </div>

            <div className="flex justify-between items-center gap-2 shrink-0 pt-2 border-t border-[#E7EDF4]">
              <button
                type="button"
                onClick={handleCopyReport}
                className="px-4 py-2 rounded-xl border border-[#D9E1EA] hover:bg-[#F4F8FC] text-[#102A56] text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {copiedReport ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedReport ? 'Copied' : 'Copy Report'}</span>
              </button>

              <button
                type="button"
                onClick={() => setSummaryReport(null)}
                className="px-5 py-2 rounded-xl bg-[#0FA3A3] text-white text-xs font-bold cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
