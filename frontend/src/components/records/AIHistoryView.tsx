import React, { useState, useEffect } from 'react';
import { 
  Bot, 
  MessageSquare, 
  Calendar, 
  Sparkles, 
  ArrowRight, 
  FileText, 
  X, 
  Loader2,
  CheckCircle2,
  User,
  ShieldCheck
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';

interface AIConversationItem {
  id: string;
  title: string;
  updated_at: string;
  created_at: string;
  consultation_state: string;
  summary_preview?: string;
  messages_count?: number;
}

interface MessageItem {
  id: string;
  sender_role: 'user' | 'ai' | 'system';
  content: string;
  created_at: string;
}

export const AIHistoryView: React.FC = () => {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<AIConversationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Transcript Drawer State
  const [selectedConv, setSelectedConv] = useState<AIConversationItem | null>(null);
  const [transcriptMessages, setTranscriptMessages] = useState<MessageItem[]>([]);
  const [loadingTranscript, setLoadingTranscript] = useState(false);

  // Generated Summary Modal
  const [summaryReport, setSummaryReport] = useState<string | null>(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get<AIConversationItem[]>('/ai/conversations');
      setConversations(res.data || []);
    } catch (err: any) {
      console.error('Failed to load AI conversations:', err);
      setError('Unable to load AI conversations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  const openTranscript = async (conv: AIConversationItem) => {
    setSelectedConv(conv);
    try {
      setLoadingTranscript(true);
      const res = await api.get<MessageItem[]>(`/ai/conversations/${conv.id}/messages`);
      setTranscriptMessages(res.data || []);
    } catch (err) {
      console.error('Failed to load transcript:', err);
    } finally {
      setLoadingTranscript(false);
    }
  };

  const generateSummary = async (conv: AIConversationItem) => {
    try {
      setIsGeneratingSummary(true);
      const res = await api.post(`/ai/voice/sessions/${conv.id}/generate-report`);
      setSummaryReport(res.data.doctor_readable_report || res.data.report || 'Summary generated.');
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

  if (error || conversations.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
        <div className="w-14 h-14 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Bot className="w-7 h-7" />
        </div>
        <h3 className="text-base font-bold text-slate-800">No AI Consultations Yet</h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-4">
          Consult with the MediAssist AI Assistant for symptoms, medical inquiries, and triage recommendations.
        </p>
        <button
          onClick={() => navigate('/patient/ai-assistant')}
          className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-xl shadow-sm transition"
        >
          Start AI Consultation
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3.5">
        {conversations.map((conv) => (
          <div
            key={conv.id}
            className="bg-white rounded-2xl p-5 border border-slate-200 hover:border-teal-300 hover:shadow-sm transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
          >
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
                  <Bot className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-bold text-slate-900">{conv.title}</h4>
                <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 rounded-full text-[10px] font-semibold">
                  {conv.consultation_state || 'ACTIVE'}
                </span>
              </div>
              <p className="text-xs text-slate-500 line-clamp-1 pl-10.5">
                {conv.summary_preview || 'Clinical conversation on health guidance and pre-consultation triage.'}
              </p>
              <div className="flex items-center gap-3 text-[11px] text-slate-400 pl-10.5 pt-1">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(conv.updated_at || conv.created_at).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </span>
                <span>•</span>
                <span>Session ID: <strong className="font-mono text-slate-500">{conv.id.substring(0, 8)}</strong></span>
              </div>
            </div>

            <div className="flex items-center gap-2 pl-10 md:pl-0">
              <button
                onClick={() => openTranscript(conv)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-teal-700 bg-slate-50 hover:bg-teal-50 border border-slate-200 hover:border-teal-200 rounded-xl transition flex items-center gap-1.5"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Transcript</span>
              </button>
              <button
                onClick={() => generateSummary(conv)}
                disabled={isGeneratingSummary}
                className="px-3 py-1.5 text-xs font-semibold text-teal-700 hover:text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-xl transition flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Clinical Summary</span>
              </button>
              <button
                onClick={() => navigate('/patient/ai-assistant')}
                className="p-2 text-slate-400 hover:text-teal-600 hover:bg-slate-50 rounded-xl transition"
                title="Continue Consultation"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Transcript Drawer Modal */}
      {selectedConv && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <div>
                <h3 className="text-base font-bold text-slate-900">{selectedConv.title}</h3>
                <p className="text-xs text-slate-500">AI Consultation Transcript</p>
              </div>
              <button
                onClick={() => setSelectedConv(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {loadingTranscript ? (
                <div className="py-12 text-center text-slate-400 flex items-center justify-center gap-2 text-xs">
                  <Loader2 className="w-4 h-4 animate-spin" /> Loading transcript...
                </div>
              ) : transcriptMessages.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-8">No messages recorded in this session.</p>
              ) : (
                transcriptMessages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex flex-col ${m.sender_role === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mb-1 px-1">
                      {m.sender_role === 'user' ? <User className="w-3 h-3" /> : <Bot className="w-3 h-3 text-teal-600" />}
                      <span className="capitalize font-semibold">{m.sender_role === 'user' ? 'You' : 'MediAssist AI'}</span>
                    </div>
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                        m.sender_role === 'user'
                          ? 'bg-teal-600 text-white rounded-tr-none'
                          : 'bg-slate-100 text-slate-800 rounded-tl-none border border-slate-200/60'
                      }`}
                    >
                      {m.content}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                onClick={() => setSelectedConv(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-xl"
              >
                Close Transcript
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Generated Summary Modal */}
      {summaryReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-teal-50/50">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-teal-600" />
                <h3 className="text-base font-bold text-slate-900">Clinical AI Consultation Summary</h3>
              </div>
              <button
                onClick={() => setSummaryReport(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 text-xs text-slate-700 whitespace-pre-wrap leading-relaxed font-mono bg-slate-50/50">
              {summaryReport}
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-600" /> AI-Generated Pre-Consultation Summary
              </span>
              <button
                onClick={() => setSummaryReport(null)}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-xl"
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
