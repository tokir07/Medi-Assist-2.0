import React, { useState, useEffect } from 'react';
import { X, Trash2, RotateCcw, AlertTriangle, FileText, CheckCircle2 } from 'lucide-react';
import type { MedicalRecordItem } from '../../types/records';
import { recordsService } from '../../services/recordsService';

interface DeletedRecordsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefreshParent: () => void;
}

export const DeletedRecordsModal: React.FC<DeletedRecordsModalProps> = ({
  isOpen,
  onClose,
  onRefreshParent,
}) => {
  const [deletedList, setDeletedList] = useState<MedicalRecordItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const fetchTrash = async () => {
    try {
      setLoading(true);
      const data = await recordsService.getTrashRecords();
      setDeletedList(data);
    } catch (err) {
      console.error('Failed to load trash:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchTrash();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRestore = async (id: string) => {
    try {
      await recordsService.restoreRecord(id);
      setMessage('Record restored successfully.');
      fetchTrash();
      onRefreshParent();
      setTimeout(() => setMessage(null), 2500);
    } catch (err) {
      console.error('Failed to restore:', err);
    }
  };

  const handlePermanentDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to permanently delete this record? This action cannot be undone.')) {
      return;
    }
    try {
      await recordsService.permanentDeleteRecord(id);
      setMessage('Record permanently deleted.');
      fetchTrash();
      onRefreshParent();
      setTimeout(() => setMessage(null), 2500);
    } catch (err) {
      console.error('Failed to delete permanently:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-3xl border border-[#D9E1EA] w-full max-w-xl shadow-[0_20px_50px_rgba(16,42,86,0.15)] overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-5 border-b border-[#E7EDF4] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#FFF5F5] text-[#D64545] flex items-center justify-center shadow-2xs">
              <Trash2 className="w-4 h-4 text-[#D64545]" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-[#102A56]">Recently Deleted Records</h3>
              <p className="text-[11px] text-[#5F6F86]">Restore or permanently remove items</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-[#8A98AA] hover:text-[#102A56] hover:bg-[#F4F8FC] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-3 custom-scrollbar flex-1">
          {message && (
            <div className="p-3 rounded-xl bg-[#E6F7F7] border border-[#B2EBEB] text-[#0FA3A3] text-xs flex items-center gap-2 font-semibold">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{message}</span>
            </div>
          )}

          {loading ? (
            <div className="py-8 text-center text-xs text-[#8A98AA]">Loading deleted items...</div>
          ) : deletedList.length === 0 ? (
            <div className="py-10 text-center space-y-2">
              <div className="w-10 h-10 rounded-2xl bg-[#F7FAFF] text-[#8A98AA] flex items-center justify-center mx-auto">
                <Trash2 className="w-5 h-5" />
              </div>
              <p className="text-xs font-bold text-[#102A56]">Recycle bin is empty</p>
              <p className="text-[11px] text-[#8A98AA]">No soft-deleted medical records found.</p>
            </div>
          ) : (
            deletedList.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-[#F7FAFF] border border-[#E7EDF4]"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-[#FFF5F5] border border-[#FED7D7] text-[#E53E3E] flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-[#102A56] truncate max-w-[200px] sm:max-w-[260px]">
                      {item.title}
                    </h4>
                    <p className="text-[10px] text-[#8A98AA]">
                      {item.category} • Deleted on{' '}
                      {item.deleted_at ? new Date(item.deleted_at).toLocaleDateString() : 'Recent'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleRestore(item.id)}
                    className="p-1.5 px-2.5 rounded-xl bg-white hover:bg-[#EEF5FF] border border-[#D9E1EA] text-[#0FA3A3] text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Restore</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePermanentDelete(item.id)}
                    className="p-1.5 rounded-xl bg-white hover:bg-red-50 border border-[#FED7D7] text-[#D64545] transition-colors cursor-pointer"
                    title="Delete Permanently"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#E7EDF4] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#0FA3A3] hover:bg-[#0D8E8E] text-white text-xs font-bold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
