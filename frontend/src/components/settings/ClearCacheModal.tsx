import React, { useState } from 'react';
import { Trash2, Loader2, CheckCircle2 } from 'lucide-react';
import { settingsService } from '../../services/settingsService';

interface ClearCacheModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ClearCacheModal: React.FC<ClearCacheModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleClear = async () => {
    try {
      setLoading(true);
      await settingsService.clearCache();
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1200);
    } catch (err) {
      console.error('Failed to clear cache:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#102A56]/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-3xl border border-[#D9E1EA] shadow-2xl p-6 space-y-4 my-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#FFFDF5] border border-[#FEF3C7] text-[#D97706] flex items-center justify-center shrink-0 shadow-2xs">
            <Trash2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#102A56]">Clear Application Cache?</h3>
            <p className="text-xs text-[#5F6F86]">
              This will remove temporary offline data and refresh local copies.
            </p>
          </div>
        </div>

        {success ? (
          <div className="p-3.5 rounded-2xl bg-[#E8F8F5] border border-[#B2F5EA] text-xs font-bold text-[#1FA774] flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Cache cleared successfully!</span>
          </div>
        ) : (
          <p className="text-xs text-[#5F6F86] leading-relaxed">
            Your saved medical records, prescriptions, and profile information will not be deleted.
          </p>
        )}

        <div className="pt-2 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-[#5F6F86] hover:bg-[#F4F8FC] transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleClear}
            disabled={loading || success}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#D97706] hover:bg-[#B45309] text-white text-xs font-bold shadow-xs transition-all cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Clearing...</span>
              </>
            ) : (
              <span>Clear Cache</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
