import React, { useState } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { settingsService } from '../../services/settingsService';
import { useAuth } from '../../context/AuthContext';

interface DeactivateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DeactivateModal: React.FC<DeactivateModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { logout } = useAuth();
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleDeactivate = async () => {
    try {
      setLoading(true);
      await settingsService.deactivateAccount();
      logout();
    } catch (err) {
      console.error('Failed to deactivate account:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#102A56]/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-3xl border border-[#FED7D7] shadow-2xl p-6 space-y-4 my-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#FFF5F5] border border-[#FED7D7] text-[#E53E3E] flex items-center justify-center shrink-0 shadow-2xs">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#102A56]">Deactivate Account?</h3>
            <p className="text-xs text-[#5F6F86]">
              Your account and notifications will be paused temporarily.
            </p>
          </div>
        </div>

        <p className="text-xs text-[#5F6F86] leading-relaxed">
          You can reactivate your account anytime simply by logging back in with your existing email and password.
        </p>

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
            onClick={handleDeactivate}
            disabled={loading}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#E53E3E] hover:bg-[#C53030] text-white text-xs font-bold shadow-xs transition-all cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Deactivating...</span>
              </>
            ) : (
              <span>Deactivate Account</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
