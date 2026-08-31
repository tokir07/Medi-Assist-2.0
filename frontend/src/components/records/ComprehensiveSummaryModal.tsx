import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Calendar,
  CheckCircle2,
  Download,
  Copy,
  Check,
  Loader2,
  FileText,
  ShieldCheck,
  Bot,
  Mic,
  Folder
} from 'lucide-react';
import { recordsService } from '../../services/recordsService';

interface ComprehensiveSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ComprehensiveSummaryModal: React.FC<ComprehensiveSummaryModalProps> = ({
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  const [dateFrom, setDateFrom] = useState<string>('24 Aug 2026');
  const [dateTo, setDateTo] = useState<string>('30 Aug 2026');
  const [includeAI, setIncludeAI] = useState<boolean>(true);
  const [includeVoice, setIncludeVoice] = useState<boolean>(true);
  const [includeUploads, setIncludeUploads] = useState<boolean>(true);

  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [summaryMarkdown, setSummaryMarkdown] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  const handleGenerate = async () => {
    try {
      setIsGenerating(true);
      const res = await recordsService.generateComprehensiveSummary({
        date_from: dateFrom,
        date_to: dateTo,
        include_ai_history: includeAI,
        include_voice_history: includeVoice,
        include_uploaded_records: includeUploads
      });
      setSummaryMarkdown(res.summary_markdown);
    } catch (err) {
      console.error('Summary generation failed:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    if (summaryMarkdown) {
      navigator.clipboard.writeText(summaryMarkdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (summaryMarkdown) {
      const blob = new Blob([summaryMarkdown], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `MediAssist_Doctor_Summary_${Date.now()}.md`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Doctor-Readable Pre-Consultation Summary</h3>
              <p className="text-xs text-slate-500">Synthesizes AI consultations, voice sessions & uploaded reports</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {!summaryMarkdown ? (
            <div className="space-y-4">
              <div className="p-4 bg-teal-50/60 border border-teal-100 rounded-2xl text-xs text-teal-900 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-bold mb-0.5">Clinical Digest Generator</strong>
                  Select your consultation date range and sources to produce a clean, structured digest designed for your attending physician.
                </div>
              </div>

              {/* Date Range Selection */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">From Date</label>
                  <input
                    type="text"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    placeholder="e.g. 20 Aug 2026"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-teal-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">To Date</label>
                  <input
                    type="text"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    placeholder="e.g. 30 Aug 2026"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-teal-500 outline-none"
                  />
                </div>
              </div>

              {/* Source Selection Checkboxes */}
              <div className="space-y-2 pt-2">
                <label className="block text-xs font-bold text-slate-800">Select Information Sources</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <label className={`p-3 rounded-xl border flex items-center gap-2.5 cursor-pointer transition ${
                    includeAI ? 'bg-teal-50/50 border-teal-300 text-teal-900' : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}>
                    <input
                      type="checkbox"
                      checked={includeAI}
                      onChange={(e) => setIncludeAI(e.target.checked)}
                      className="rounded text-teal-600 focus:ring-teal-500"
                    />
                    <Bot className="w-4 h-4 text-teal-600" />
                    <span className="text-xs font-semibold">AI Text Chats</span>
                  </label>

                  <label className={`p-3 rounded-xl border flex items-center gap-2.5 cursor-pointer transition ${
                    includeVoice ? 'bg-teal-50/50 border-teal-300 text-teal-900' : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}>
                    <input
                      type="checkbox"
                      checked={includeVoice}
                      onChange={(e) => setIncludeVoice(e.target.checked)}
                      className="rounded text-teal-600 focus:ring-teal-500"
                    />
                    <Mic className="w-4 h-4 text-teal-600" />
                    <span className="text-xs font-semibold">Voice Sessions</span>
                  </label>

                  <label className={`p-3 rounded-xl border flex items-center gap-2.5 cursor-pointer transition ${
                    includeUploads ? 'bg-teal-50/50 border-teal-300 text-teal-900' : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}>
                    <input
                      type="checkbox"
                      checked={includeUploads}
                      onChange={(e) => setIncludeUploads(e.target.checked)}
                      className="rounded text-teal-600 focus:ring-teal-500"
                    />
                    <Folder className="w-4 h-4 text-teal-600" />
                    <span className="text-xs font-semibold">Uploaded Reports</span>
                  </label>
                </div>
              </div>
            </div>
          ) : (
            /* Generated Markdown Preview */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">Generated Clinical Summary Digest</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopy}
                    className="px-2.5 py-1 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1 transition"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                  <button
                    onClick={handleDownload}
                    className="px-2.5 py-1 text-xs font-semibold text-teal-700 hover:text-teal-900 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg flex items-center gap-1 transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download MD</span>
                  </button>
                </div>
              </div>

              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-800 font-mono leading-relaxed whitespace-pre-wrap max-h-[50vh] overflow-y-auto">
                {summaryMarkdown}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/60">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800"
          >
            Close
          </button>
          {!summaryMarkdown ? (
            <button
              onClick={handleGenerate}
              disabled={isGenerating || (!includeAI && !includeVoice && !includeUploads)}
              className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-2 disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Synthesizing Summary...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Summary</span>
                </>
              )}
            </button>
          ) : (
            <button
              onClick={() => setSummaryMarkdown(null)}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-xl"
            >
              Adjust Parameters
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
