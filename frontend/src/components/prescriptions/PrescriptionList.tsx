import React from 'react';
import { PrescriptionCard } from './PrescriptionCard';
import { Pill, AlertCircle, RefreshCw, Plus, Upload } from 'lucide-react';
import type { PrescriptionItem } from '../../types/prescriptions';

interface PrescriptionListProps {
  prescriptions: PrescriptionItem[];
  loading: boolean;
  error?: string | null;
  onRetry?: () => void;
  onView: (p: PrescriptionItem) => void;
  onOpenRecord?: (recordId: string) => void;
  onDownload: (p: PrescriptionItem) => void;
  onSetReminder: (p: PrescriptionItem) => void;
  onRequestRefill: (p: PrescriptionItem) => void;
  onShare: (p: PrescriptionItem) => void;
  onDelete: (p: PrescriptionItem) => void;
  onOpenUpload: () => void;
  onOpenAddManual?: () => void;
}

export const PrescriptionList: React.FC<PrescriptionListProps> = ({
  prescriptions,
  loading,
  error,
  onRetry,
  onView,
  onOpenRecord,
  onDownload,
  onSetReminder,
  onRequestRefill,
  onShare,
  onDelete,
  onOpenUpload,
  onOpenAddManual,
}) => {
  if (loading) {
    return (
      <div className="space-y-3.5">
        {[...Array(4)].map((_, idx) => (
          <div
            key={idx}
            className="bg-white rounded-2xl border border-slate-200 p-5 h-28 animate-pulse flex items-center justify-between"
          >
            <div className="flex items-center gap-3.5 flex-1">
              <div className="w-10 h-10 rounded-xl bg-slate-200" />
              <div className="space-y-2 flex-1 max-w-sm">
                <div className="h-4 bg-slate-200 rounded w-3/4" />
                <div className="h-3 bg-slate-100 rounded w-1/2" />
              </div>
            </div>
            <div className="h-6 w-24 bg-slate-100 rounded-lg hidden sm:block" />
            <div className="h-8 w-20 bg-slate-200 rounded-xl" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-12 px-4 text-center space-y-3">
        <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto shadow-xs">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h4 className="text-sm font-bold text-slate-900">Unable to load prescriptions</h4>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">{error}</p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-xs transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Try Again</span>
          </button>
        )}
      </div>
    );
  }

  if (prescriptions.length === 0) {
    return (
      <div className="py-16 px-4 text-center space-y-3 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
        <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-700 border border-teal-100 flex items-center justify-center mx-auto shadow-2xs">
          <Pill className="w-6 h-6" />
        </div>
        <h4 className="text-sm font-bold text-slate-900">No Prescriptions Found</h4>
        <p className="text-xs text-slate-500 max-w-xs mx-auto">
          No prescriptions found matching your current filter. You can upload a doctor's prescription PDF or add medications manually.
        </p>
        <div className="flex items-center justify-center gap-2 pt-2">
          {onOpenAddManual && (
            <button
              type="button"
              onClick={onOpenAddManual}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold rounded-xl shadow-2xs transition"
            >
              <Plus className="w-3.5 h-3.5 text-teal-600" />
              <span>Add Manually</span>
            </button>
          )}
          <button
            type="button"
            onClick={onOpenUpload}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-sm transition"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Prescription</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {prescriptions.map((p) => (
        <PrescriptionCard
          key={p.id}
          prescription={p}
          onView={onView}
          onOpenRecord={onOpenRecord}
          onDownload={onDownload}
          onSetReminder={onSetReminder}
          onRequestRefill={onRequestRefill}
          onShare={onShare}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};
