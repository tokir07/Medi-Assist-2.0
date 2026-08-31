import React from 'react';
import { RecordCard } from './RecordCard';
import { FileQuestion, AlertCircle, RefreshCw } from 'lucide-react';
import type { MedicalRecordItem } from '../../types/records';

interface RecordsGridProps {
  records: MedicalRecordItem[];
  loading: boolean;
  error?: string | null;
  onRetry?: () => void;
  onView: (record: MedicalRecordItem) => void;
  onDownload: (record: MedicalRecordItem) => void;
  onShare: (record: MedicalRecordItem) => void;
  onDelete: (record: MedicalRecordItem) => void;
  onOpenUpload: () => void;
}

export const RecordsGrid: React.FC<RecordsGridProps> = ({
  records,
  loading,
  error,
  onRetry,
  onView,
  onDownload,
  onShare,
  onDelete,
  onOpenUpload,
}) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, idx) => (
          <div
            key={idx}
            className="bg-white rounded-2xl border border-[#D9E1EA]/80 p-4 h-48 animate-pulse flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-200" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-3 w-16 bg-slate-200 rounded" />
                  <div className="h-2.5 w-24 bg-slate-100 rounded" />
                </div>
              </div>
              <div className="h-4 w-3/4 bg-slate-200 rounded" />
            </div>
            <div className="h-8 bg-slate-100 rounded-xl" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-12 px-4 text-center space-y-3">
        <div className="w-12 h-12 rounded-full bg-[#FFF5F5] border border-[#FED7D7] text-[#D64545] flex items-center justify-center mx-auto shadow-xs">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h4 className="text-sm font-bold text-[#102A56]">Unable to load medical records</h4>
        <p className="text-xs text-[#5F6F86] max-w-sm mx-auto">{error}</p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0FA3A3] hover:bg-[#0D8E8E] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Try Again</span>
          </button>
        )}
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="py-12 px-4 text-center space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-[#EEF5FF] text-[#0FA3A3] flex items-center justify-center mx-auto shadow-2xs">
          <FileQuestion className="w-6 h-6" />
        </div>
        <h4 className="text-sm font-bold text-[#102A56]">No Medical Records Found</h4>
        <p className="text-xs text-[#5F6F86] max-w-xs mx-auto">
          No records match your selected criteria or search term. Upload your reports to keep them organized.
        </p>
        <button
          type="button"
          onClick={onOpenUpload}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0FA3A3] hover:bg-[#0D8E8E] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
        >
          <span>Upload Record</span>
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {records.map((record) => (
        <RecordCard
          key={record.id}
          record={record}
          onView={onView}
          onDownload={onDownload}
          onShare={onShare}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};
