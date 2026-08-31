import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  Folder,
  FileText,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check
} from 'lucide-react';
import { recordsService } from '../../services/recordsService';
import type { SessionSummaryResponse } from '../../types/records';

interface SessionSummaryModalProps {
  sessionName: string;
  isOpen: boolean;
  onClose: () => void;
}

export const SessionSummaryModal: React.FC<SessionSummaryModalProps> = ({
  sessionName,
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  const [summaryData, setSummaryData] = useState<SessionSummaryResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    fetchSessionSummary();
  }, [sessionName]);

  const fetchSessionSummary = async () => {
    try {
      setLoading(true);
      const res = await recordsService.getSessionSummary(sessionName);
      setSummaryData(res);
    } catch (err) {
      console.error('Failed to get session summary:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (summaryData?.summary_markdown) {
      navigator.clipboard.writeText(summaryData.summary_markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl flex flex-col overflow-hidden max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600 font-bold">
              <Folder className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">Session Summary: {sessionName}</h2>
                <span className="text-[10px] font-semibold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                  Combined Encounter Digest
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                AI clinical synthesis aggregated across all documents uploaded in this encounter.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-500 gap-2">
              <Loader2 className="w-7 h-7 animate-spin text-teal-600" />
              <span className="text-xs">Generating encounter session summary...</span>
            </div>
          ) : !summaryData ? (
            <div className="p-10 text-center bg-slate-50 rounded-2xl border border-slate-200 text-slate-500">
              <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="font-semibold text-xs text-slate-700">Unable to load session summary</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Documents Included Badges */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs flex items-center justify-between">
                <div>
                  <span className="text-slate-500 block text-[10px] font-bold uppercase tracking-wider">
                    Included Documents ({summaryData.record_count})
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap mt-1">
                    {summaryData.documents.map((doc, idx) => (
                      <span key={idx} className="px-2 py-0.5 bg-white border border-slate-200 rounded text-slate-700 font-medium text-[11px] flex items-center gap-1">
                        <FileText className="w-3 h-3 text-teal-600" /> {doc}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Flagged Values in Session */}
              {summaryData.flagged_parameters && summaryData.flagged_parameters.length > 0 && (
                <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl space-y-1.5">
                  <span className="text-[11px] font-bold text-amber-900 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Flagged Results in This Session ({summaryData.flagged_parameters.length})
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {summaryData.flagged_parameters.map((f, idx) => (
                      <div key={idx} className="p-2 bg-white rounded-lg border border-amber-200 text-xs flex items-center justify-between">
                        <div>
                          <span className="font-semibold text-slate-800">{f.param}</span>
                          <span className="text-[10px] text-slate-400 block">{f.doc}</span>
                        </div>
                        <span className="font-mono font-bold text-rose-700 text-xs">{f.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Formatted Markdown Content */}
              <div className="p-4 bg-slate-50/60 rounded-xl border border-slate-200 text-xs leading-relaxed text-slate-800 whitespace-pre-line font-sans">
                {summaryData.summary_markdown}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <button
            onClick={handleCopy}
            className="px-3.5 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 transition flex items-center gap-1.5"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-600" />}
            <span>{copied ? 'Copied' : 'Copy Summary'}</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-lg transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
