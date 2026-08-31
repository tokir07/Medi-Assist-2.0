import React, { useState, useRef, useEffect } from 'react';
import {
  Calendar,
  Eye,
  FileText,
  MoreVertical,
  Bell,
  Trash2,
  Share2,
  CheckCircle2,
  Clock,
  Sparkles,
  ExternalLink,
  Pill,
} from 'lucide-react';
import type { PrescriptionItem } from '../../types/prescriptions';

interface PrescriptionCardProps {
  prescription: PrescriptionItem;
  onView: (p: PrescriptionItem) => void;
  onOpenRecord?: (recordId: string) => void;
  onDownload?: (p: PrescriptionItem) => void;
  onSetReminder: (p: PrescriptionItem) => void;
  onRequestRefill: (p: PrescriptionItem) => void;
  onShare: (p: PrescriptionItem) => void;
  onDelete: (p: PrescriptionItem) => void;
}

export const PrescriptionCard: React.FC<PrescriptionCardProps> = ({
  prescription,
  onView,
  onOpenRecord,
  onSetReminder,
  onRequestRefill,
  onShare,
  onDelete,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const statusLower = (prescription.status || '').toLowerCase();
  const isActive = statusLower.includes('active');
  const isCompleted = statusLower.includes('completed');
  const isExpired = statusLower.includes('expired');

  const meds = prescription.medications && prescription.medications.length > 0
    ? prescription.medications
    : [{
        id: '1',
        medication_name: prescription.medication_name,
        dosage: prescription.dosage,
        frequency: prescription.frequency,
        duration: prescription.duration,
        instructions: prescription.instructions,
      }];

  const isClinicianReviewed = prescription.clinician_review_status === 'CLINICIAN_REVIEWED';
  const isManuallyAdded = prescription.provenance === 'MANUALLY_ADDED';

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs hover:border-teal-500/50 hover:shadow-md transition-all flex flex-col gap-3 group relative">
      {/* Top Row: Provider, Provenance, and Status */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-700 shrink-0 font-bold">
            <Pill className="w-5 h-5" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4
                onClick={() => onView(prescription)}
                className="text-sm font-bold text-slate-900 group-hover:text-teal-700 transition-colors cursor-pointer truncate"
              >
                {prescription.title || `Prescription - ${prescription.doctor_name}`}
              </h4>

              {/* Provenance Badge */}
              {isClinicianReviewed ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Clinician Verified</span>
                </span>
              ) : isManuallyAdded ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                  Manually Added
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-blue-500" />
                  <span>AI Extracted</span>
                </span>
              )}
            </div>

            <p className="text-xs text-slate-500 mt-0.5 truncate">
              <span className="font-semibold text-slate-700">{prescription.doctor_name}</span>
              <span className="mx-1.5 text-slate-300">•</span>
              <span>{prescription.doctor_specialty || 'Physician'}</span>
              <span className="mx-1.5 text-slate-300">•</span>
              <span>{prescription.hospital}</span>
            </p>
          </div>
        </div>

        {/* Status Badge */}
        <div className="shrink-0">
          {isActive ? (
            <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-teal-50 text-teal-700 border border-teal-200">
              Active
            </span>
          ) : isCompleted ? (
            <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
              Completed
            </span>
          ) : isExpired ? (
            <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
              Expired
            </span>
          ) : (
            <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
              {prescription.status}
            </span>
          )}
        </div>
      </div>

      {/* Middle Row: Medications Pill Tags */}
      <div className="bg-slate-50/70 rounded-xl p-3 border border-slate-100 space-y-1.5">
        <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider">
          <span>Prescribed Drugs ({meds.length})</span>
          {prescription.prescribed_date && (
            <span className="font-normal text-slate-400 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>{prescription.prescribed_date}</span>
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {meds.slice(0, 4).map((m, idx) => (
            <div
              key={idx}
              className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 font-medium flex items-center gap-1.5 shadow-2xs"
            >
              <span className="font-bold text-slate-900">{m.medication_name}</span>
              {m.dosage && <span className="text-teal-700 font-semibold">• {m.dosage}</span>}
              {m.frequency && <span className="text-slate-500 text-[11px]">({m.frequency})</span>}
            </div>
          ))}
          {meds.length > 4 && (
            <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-semibold">
              +{meds.length - 4} more
            </span>
          )}
        </div>
      </div>

      {/* Bottom Bar: Source Links & Actions */}
      <div className="flex items-center justify-between gap-3 pt-1 text-xs">
        {/* Linked Records or Appointments */}
        <div className="flex items-center gap-2 flex-wrap text-slate-500 text-[11px]">
          {prescription.appointment_title && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50/80 text-blue-700 border border-blue-100 rounded-md">
              <Calendar className="w-3 h-3" />
              <span className="truncate max-w-[140px]">{prescription.appointment_title}</span>
            </span>
          )}

          {prescription.record_id && (
            <button
              type="button"
              onClick={() => onOpenRecord && onOpenRecord(prescription.record_id!)}
              className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 hover:bg-teal-50 hover:text-teal-700 text-slate-700 border border-slate-200 rounded-md transition font-semibold"
              title="Open source document in Medical Records viewer"
            >
              <FileText className="w-3 h-3 text-slate-400" />
              <span className="truncate max-w-[150px]">
                {prescription.source_record_title || 'Original PDF'}
              </span>
              <ExternalLink className="w-2.5 h-2.5 ml-0.5" />
            </button>
          )}

          {prescription.session_name && (
            <span className="text-slate-400">
              Session: <strong className="text-slate-600">{prescription.session_name}</strong>
            </span>
          )}
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-1 shrink-0" ref={menuRef}>
          <button
            type="button"
            onClick={() => onSetReminder(prescription)}
            className="px-2.5 py-1 text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-lg font-bold text-xs transition flex items-center gap-1"
            title="Set medication reminder"
          >
            <Bell className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Set Reminder</span>
          </button>

          <button
            type="button"
            onClick={() => onView(prescription)}
            className="px-2.5 py-1 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg font-bold text-xs transition flex items-center gap-1"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Details</span>
          </button>

          {/* More Options Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-8 w-44 bg-white border border-slate-200 rounded-xl shadow-lg py-1 z-30 animate-fadeIn text-xs">
                {prescription.record_id && onOpenRecord && (
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onOpenRecord(prescription.record_id!);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-slate-700 hover:bg-slate-50 font-medium"
                  >
                    <FileText className="w-3.5 h-3.5 text-slate-400" />
                    <span>Open Original Record</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onShare(prescription);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-slate-700 hover:bg-slate-50 font-medium"
                >
                  <Share2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>Share Prescription</span>
                </button>

                <div className="h-px bg-slate-100 my-1" />

                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onDelete(prescription);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-rose-600 hover:bg-rose-50 font-medium"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Prescription</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
