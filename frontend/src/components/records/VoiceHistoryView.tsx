import React, { useState, useEffect } from 'react';
import {
  Mic,
  Calendar,
  Clock,
  MessageSquare,
  Sparkles,
  ArrowRight,
  X,
  Loader2,
  Volume2,
  ShieldCheck,
  ListChecks,
  FileText,
  Activity
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';

interface VoiceSessionItem {
  id: string;
  title: string;
  timestamp: string;
  duration?: string;
  transcript: string;
  response: string;
  consultation_state?: string;
  conversation_mode?: string;
  key_points?: string[];
}

interface VoiceMessageItem {
  id: string;
  role: string;
  content: string;
  sequence_number: number;
  timestamp: string;
  message_type?: string;
}

interface FullVoiceSessionDetails {
  session_id: string;
  patient_id: string;
  started_at: string;
  ended_at: string;
  status: string;
  language: string;
  conversation_mode: string;
  duration: string;
  summary: string;
  key_points: string[];
  extracted_medical_context: Record<string, any>;
  messages: VoiceMessageItem[];
}

export const VoiceHistoryView: React.FC = () => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<VoiceSessionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Full Conversation Modal State
  const [selectedSession, setSelectedSession] = useState<VoiceSessionItem | null>(null);
  const [fullSession, setFullSession] = useState<FullVoiceSessionDetails | null>(null);
  const [loadingFullSession, setLoadingFullSession] = useState(false);
  const [activeTab, setActiveTab] = useState<'transcript' | 'summary' | 'key_points' | 'context'>('transcript');

  // Summary Modal State
  const [summaryReport, setSummaryReport] = useState<string | null>(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);

  const fetchVoiceHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get<VoiceSessionItem[]>('/ai/voice/history');
      setSessions(res.data || []);
    } catch (err: any) {
      console.error('Failed to load voice history:', err);
      setError('Unable to retrieve voice consultation history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVoiceHistory();
  }, []);

  const handleOpenFullConversation = async (session: VoiceSessionItem) => {
    setSelectedSession(session);
    setActiveTab('transcript');
    setLoadingFullSession(true);
    setFullSession(null);

    try {
      const res = await api.get<FullVoiceSessionDetails>(`/ai/voice/sessions/${session.id}/full`);
      setFullSession(res.data);
    } catch (err) {
      console.error('Failed to fetch full voice session:', err);
    } finally {
      setLoadingFullSession(false);
    }
  };

  const generateSummary = async (session: VoiceSessionItem) => {
    try {
      setIsGeneratingSummary(true);
      const res = await api.post(`/ai/voice/sessions/${session.id}/generate-report`);
      setSummaryReport(res.data.doctor_readable_report || res.data.clinical_summary || 'Summary generated.');
    } catch (err) {
      console.error('Summary generation failed:', err);
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-2xl p-5 border border-slate-200 animate-pulse space-y-2">
            <div className="h-5 bg-slate-100 rounded w-1/3" />
            <div className="h-4 bg-slate-50 rounded w-2/3" />
          </div>
        ))}
      </div>
    );
  }

  if (error || sessions.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
        <div className="w-14 h-14 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Mic className="w-7 h-7" />
        </div>
        <h3 className="text-base font-bold text-slate-800">No Voice Sessions Recorded</h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-4">
          Speak hands-free with the MediAssist Conversational Voice AI to describe symptoms naturally.
        </p>
        <button
          onClick={() => navigate('/patient/voice-assistant')}
          className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-xl shadow-sm transition"
        >
          Launch Voice Assistant
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3.5">
        {sessions.map((sess) => (
          <div
            key={sess.id}
            className="bg-white rounded-2xl p-5 border border-slate-200 hover:border-teal-300 hover:shadow-sm transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
          >
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
                  <Mic className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-bold text-slate-900 line-clamp-1">{sess.title || 'Voice Consultation'}</h4>
                <span className="px-2.5 py-0.5 bg-teal-50 text-teal-700 border border-teal-100 rounded-full text-[10px] font-semibold flex items-center gap-1 shrink-0">
                  <Volume2 className="w-3 h-3" /> {sess.conversation_mode || 'Voice Session'}
                </span>
              </div>
              <p className="text-xs text-slate-600 line-clamp-1 pl-10.5 font-medium">
                "{sess.transcript}"
              </p>
              <div className="flex items-center gap-3 text-[11px] text-slate-400 pl-10.5 pt-1">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {sess.timestamp}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {sess.duration || '00:30'}
                </span>
                <span>•</span>
                <span>Status: <strong className="text-slate-600">{sess.consultation_state || 'Recorded'}</strong></span>
              </div>
            </div>

            <div className="flex items-center gap-2 pl-10 md:pl-0 shrink-0">
              <button
                onClick={() => handleOpenFullConversation(sess)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-teal-700 bg-slate-50 hover:bg-teal-50 border border-slate-200 hover:border-teal-200 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Open Full Conversation</span>
              </button>
              <button
                onClick={() => generateSummary(sess)}
                disabled={isGeneratingSummary}
                className="px-3.5 py-2 text-xs font-semibold text-teal-700 hover:text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Clinical Summary</span>
              </button>
              <button
                onClick={() => navigate('/patient/voice-assistant')}
                className="p-2 text-slate-400 hover:text-teal-600 hover:bg-slate-50 rounded-xl transition cursor-pointer"
                title="Continue in Voice Assistant"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Complete Voice Conversation Modal */}
      {selectedSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center shrink-0">
                  <Mic className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">VOICE CONVERSATION</h3>
                  <p className="text-xs text-slate-500 flex items-center gap-2">
                    <span>{fullSession?.started_at || selectedSession.timestamp}</span>
                    <span>•</span>
                    <span>Duration: {fullSession?.duration || selectedSession.duration || '00:30'}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => { setSelectedSession(null); setFullSession(null); }}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center border-b border-slate-200 bg-white px-6 gap-6 text-xs font-bold">
              <button
                onClick={() => setActiveTab('transcript')}
                className={`py-3 border-b-2 flex items-center gap-1.5 cursor-pointer transition ${
                  activeTab === 'transcript' ? 'border-teal-600 text-teal-700' : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>FULL TRANSCRIPT ({fullSession?.messages?.length || 0})</span>
              </button>
              <button
                onClick={() => setActiveTab('summary')}
                className={`py-3 border-b-2 flex items-center gap-1.5 cursor-pointer transition ${
                  activeTab === 'summary' ? 'border-teal-600 text-teal-700' : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>SESSION SUMMARY</span>
              </button>
              <button
                onClick={() => setActiveTab('key_points')}
                className={`py-3 border-b-2 flex items-center gap-1.5 cursor-pointer transition ${
                  activeTab === 'key_points' ? 'border-teal-600 text-teal-700' : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <ListChecks className="w-3.5 h-3.5" />
                <span>KEY POINTS</span>
              </button>
              <button
                onClick={() => setActiveTab('context')}
                className={`py-3 border-b-2 flex items-center gap-1.5 cursor-pointer transition ${
                  activeTab === 'context' ? 'border-teal-600 text-teal-700' : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                <span>EXTRACTED CONTEXT</span>
              </button>
            </div>

            {/* Tab Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {loadingFullSession ? (
                <div className="py-12 text-center text-slate-400 space-y-2">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-teal-600" />
                  <p className="text-xs">Loading complete voice transcript session...</p>
                </div>
              ) : activeTab === 'transcript' ? (
                <div className="space-y-4">
                  {fullSession?.messages && fullSession.messages.length > 0 ? (
                    fullSession.messages.map((m) => (
                      <div
                        key={m.id || m.sequence_number}
                        className={`p-4 rounded-2xl border space-y-1 ${
                          m.role === 'user'
                            ? 'bg-slate-50 border-slate-200 text-slate-900 ml-4'
                            : 'bg-teal-50/70 border-teal-100 text-slate-900 mr-4'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider">
                          <span className={m.role === 'user' ? 'text-slate-500' : 'text-teal-700'}>
                            {m.role === 'user' ? 'YOU' : 'MEDIASSIST AI'}
                          </span>
                          <span className="text-slate-400 font-normal">
                            #{m.sequence_number} • {m.timestamp}
                          </span>
                        </div>
                        <p className="text-xs leading-relaxed font-medium whitespace-pre-wrap">
                          {m.content}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="space-y-3">
                      <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">YOU</span>
                        <p className="font-semibold text-slate-900 text-sm mt-0.5">"{selectedSession.transcript}"</p>
                      </div>
                      <div className="p-3.5 bg-teal-50/60 rounded-xl border border-teal-100">
                        <span className="text-[10px] font-bold text-teal-600 uppercase tracking-wider">MEDIASSIST AI</span>
                        <p className="text-slate-800 leading-relaxed text-xs mt-0.5">{selectedSession.response}</p>
                      </div>
                    </div>
                  )}
                </div>
              ) : activeTab === 'summary' ? (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Generated Session Summary</h4>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    {fullSession?.summary || 'User discussed health concerns during this voice consultation.'}
                  </p>
                </div>
              ) : activeTab === 'key_points' ? (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Key Clinical Points</h4>
                  {fullSession?.key_points && fullSession.key_points.length > 0 ? (
                    <ul className="space-y-1.5 text-xs text-slate-700">
                      {fullSession.key_points.map((kp, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-teal-600 font-bold">•</span>
                          <span>{kp}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-slate-500">No key points extracted yet.</p>
                  )}
                </div>
              ) : (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Extracted Medical Context</h4>
                  {fullSession?.extracted_medical_context && Object.keys(fullSession.extracted_medical_context).length > 0 ? (
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {Object.entries(fullSession.extracted_medical_context).map(([k, v]) => (
                        <div key={k} className="p-2.5 bg-white rounded-xl border border-slate-200">
                          <span className="text-[10px] font-bold text-slate-400 uppercase block">{k.replace(/_/g, ' ')}</span>
                          <span className="font-semibold text-slate-800">{Array.isArray(v) ? v.join(', ') : String(v)}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500">No structured medical context extracted.</p>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-600" /> Complete Voice Session Record
              </span>
              <button
                onClick={() => { setSelectedSession(null); setFullSession(null); }}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-xl cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Generated Voice Clinical Summary Modal */}
      {summaryReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-teal-50/50">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-teal-600" />
                <h3 className="text-base font-bold text-slate-900">Voice Session Pre-Consultation Summary</h3>
              </div>
              <button
                onClick={() => setSummaryReport(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 text-xs text-slate-700 whitespace-pre-wrap leading-relaxed font-mono bg-slate-50/50">
              {summaryReport}
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-600" /> Doctor-Readable Voice Consultation Summary
              </span>
              <button
                onClick={() => setSummaryReport(null)}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-xl cursor-pointer"
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
