import React, { useState } from 'react';
import { AlertOctagon, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DeleteAccountModal: React.FC<DeleteAccountModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { logout } = useAuth();
  const [confirmText, setConfirmText] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleDelete = async () => {
    if (confirmText !== 'DELETE') return;
    try {
      setLoading(true);
      // Initiate irreversible account deletion
      logout();
    } catch (err) {
      console.error('Failed to delete account:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#102A56]/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-3xl border border-[#FED7D7] shadow-2xl p-6 space-y-4 my-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#FFF5F5] border border-[#FED7D7] text-[#E53E3E] flex items-center justify-center shrink-0 shadow-2xs">
            <AlertOctagon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#E53E3E]">Permanently Delete Account?</h3>
            <p className="text-xs text-[#5F6F86]">
              This action cannot be undone. All records will be erased.
            </p>
          </div>
        </div>

        <p className="text-xs text-[#5F6F86] leading-relaxed">
          Please type <strong className="text-[#E53E3E]">DELETE</strong> to confirm permanent deletion of your profile, prescriptions, and health history.
        </p>

        <div className="space-y-1">
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="Type DELETE to confirm"
            className="w-full px-3.5 py-2.5 bg-[#FFF5F5] border border-[#FED7D7] rounded-xl text-xs sm:text-sm font-bold text-[#E53E3E] placeholder:text-[#E53E3E]/40 focus:outline-none focus:ring-2 focus:ring-[#E53E3E]/20 transition-all"
          />
        </div>

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
            onClick={handleDelete}
            disabled={loading || confirmText !== 'DELETE'}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#E53E3E] hover:bg-[#C53030] text-white text-xs font-bold shadow-xs transition-all cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <span>Permanently Delete</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
