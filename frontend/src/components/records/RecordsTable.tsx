import React from 'react';
import { RecordRow } from './RecordRow';
import { FileQuestion, AlertCircle, RefreshCw } from 'lucide-react';
import type { MedicalRecordItem } from '../../types/records';

interface RecordsTableProps {
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

export const RecordsTable: React.FC<RecordsTableProps> = ({
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
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#E7EDF4] text-[11px] font-bold text-[#8A98AA] uppercase tracking-wider">
              <th className="py-3 px-4">Record Name</th>
              <th className="py-3 px-4">Type</th>
              <th className="py-3 px-4">Date</th>
              <th className="py-3 px-4">Doctor / Source</th>
              <th className="py-3 px-4">Tags</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {[...Array(6)].map((_, idx) => (
              <tr key={idx} className="border-b border-[#F0F4F8] animate-pulse">
                <td className="py-4 px-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-200" />
                    <div className="space-y-1.5">
                      <div className="h-3.5 w-40 bg-slate-200 rounded" />
                      <div className="h-2.5 w-20 bg-slate-100 rounded" />
                    </div>
                  </div>
                </td>
                <td className="py-4 px-4">
                  <div className="h-5 w-20 bg-slate-200 rounded-lg" />
                </td>
                <td className="py-4 px-4">
                  <div className="h-3.5 w-24 bg-slate-200 rounded" />
                </td>
                <td className="py-4 px-4">
                  <div className="h-3.5 w-28 bg-slate-200 rounded" />
                </td>
                <td className="py-4 px-4">
                  <div className="h-4 w-14 bg-slate-200 rounded-md" />
                </td>
                <td className="py-4 px-4 text-right">
                  <div className="h-6 w-16 bg-slate-200 rounded ml-auto" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
    <div className="overflow-x-auto -mx-5 sm:mx-0">
      <table className="w-full text-left border-collapse min-w-[700px]">
        <thead>
          <tr className="border-b border-[#E7EDF4] text-[11px] font-bold text-[#8A98AA] uppercase tracking-wider">
            <th className="py-3 px-4">Record Name</th>
            <th className="py-3 px-4">Type</th>
            <th className="py-3 px-4">Date</th>
            <th className="py-3 px-4">Doctor / Source</th>
            <th className="py-3 px-4">Tags</th>
            <th className="py-3 px-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {records.map((record) => (
            <RecordRow
              key={record.id}
              record={record}
              onView={onView}
              onDownload={onDownload}
              onShare={onShare}
              onDelete={onDelete}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
};
