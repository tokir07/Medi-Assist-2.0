import React, { useState } from 'react';
import {
  Folder,
  ChevronDown,
  ChevronUp,
  FileText,
  Calendar,
  Download,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Sparkles
} from 'lucide-react';
import type { SessionGroupItem, MedicalRecordItem } from '../../types/records';
import { recordsService } from '../../services/recordsService';
import { SessionSummaryModal } from './SessionSummaryModal';

interface SessionsViewProps {
  sessions: SessionGroupItem[];
  loading: boolean;
  onViewRecord: (record: MedicalRecordItem) => void;
  onUploadToSession?: (sessionName: string) => void;
}

export const SessionsView: React.FC<SessionsViewProps> = ({
  sessions,
  loading,
  onViewRecord,
  onUploadToSession
}) => {
  const [expandedSessions, setExpandedSessions] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    sessions.forEach((s) => { initial[s.session_name] = true; });
    return initial;
  });

  const [activeSessionSummary, setActiveSessionSummary] = useState<string | null>(null);

  const toggleSession = (name: string) => {
    setExpandedSessions((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-2xl p-5 border border-slate-200 animate-pulse space-y-3">
            <div className="h-6 bg-slate-100 rounded w-1/4" />
            <div className="h-16 bg-slate-50 rounded-xl" />
          </div>
        ))}
      </div>
    );
  }

  if (!sessions || sessions.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
        <div className="w-14 h-14 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Folder className="w-7 h-7" />
        </div>
        <h3 className="text-base font-bold text-slate-800">No Uploaded Sessions Found</h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
          Upload medical reports or prescriptions to organize them into sessions like "Annual Health Checkup" or "Dr. Sharma Consultation".
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {sessions.map((group) => {
        const isExpanded = expandedSessions[group.session_name] ?? true;

        return (
          <div
            key={group.session_name}
            className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all duration-200"
          >
            {/* Session Header */}
            <div
              onClick={() => toggleSession(group.session_name)}
              className="px-6 py-4 flex items-center justify-between cursor-pointer bg-gradient-to-r from-slate-50/80 to-white hover:bg-slate-50 border-b border-slate-100"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 border border-teal-100 flex items-center justify-center font-bold">
                  <Folder className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900">{group.session_name}</h3>
                    <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 rounded-full text-xs font-semibold">
                      {group.record_count} {group.record_count === 1 ? 'document' : 'documents'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Latest: {group.latest_date}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveSessionSummary(group.session_name);
                  }}
                  className="px-3 py-1.5 text-xs font-semibold text-teal-800 hover:text-teal-900 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg transition flex items-center gap-1.5 shadow-sm"
                  title="Generate combined AI summary for all documents in this session"
                >
                  <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                  <span>Session Summary</span>
                </button>

                {onUploadToSession && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onUploadToSession(group.session_name);
                    }}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition"
                  >
                    + Add to Session
                  </button>
                )}
                <div className="p-1 text-slate-400 hover:text-slate-600">
                  {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </div>
              </div>
            </div>

            {/* Session Documents List */}
            {isExpanded && (
              <div className="divide-y divide-slate-100">
                {group.records.map((rec) => (
                  <div
                    key={rec.id}
                    className="px-6 py-3.5 flex items-center justify-between hover:bg-slate-50/60 transition group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-600 border border-slate-200 flex items-center justify-center font-bold text-[11px] uppercase">
                        {rec.file_type || 'PDF'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-semibold text-slate-800 group-hover:text-teal-700 transition">
                            {rec.title}
                          </h4>
                          {rec.approval_status === 'APPROVED' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded text-[10px] font-semibold">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Verified
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-100 rounded text-[10px] font-semibold">
                              <AlertTriangle className="w-3 h-3 text-amber-600" /> Review
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                          <span>{rec.category}</span>
                          <span>•</span>
                          <span>{rec.doctor_name || 'Dr. Priya Sharma'}</span>
                          <span>•</span>
                          <span>{rec.file_size_formatted}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onViewRecord(rec)}
                        className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-teal-700 bg-white hover:bg-teal-50 border border-slate-200 hover:border-teal-200 rounded-lg transition flex items-center gap-1.5 shadow-sm"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View & Summary</span>
                      </button>
                      <a
                        href={recordsService.getFileUrl(rec.id)}
                        download={rec.file_name || `${rec.title}.pdf`}
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                        title="Download file"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {/* Session Summary Modal */}
      {activeSessionSummary && (
        <SessionSummaryModal
          sessionName={activeSessionSummary}
          isOpen={true}
          onClose={() => setActiveSessionSummary(null)}
        />
      )}
    </div>
  );
};
