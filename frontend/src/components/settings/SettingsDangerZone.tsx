import React from 'react';
import { Clock, Trash2, ChevronRight } from 'lucide-react';

interface SettingsDangerZoneProps {
  onOpenDeactivateModal: () => void;
  onOpenDeleteAccountModal: () => void;
}

export const SettingsDangerZone: React.FC<SettingsDangerZoneProps> = ({
  onOpenDeactivateModal,
  onOpenDeleteAccountModal,
}) => {
  return (
    <div className="bg-white rounded-3xl border border-[#FED7D7] p-5 shadow-[0_4px_20px_rgba(229,62,62,0.03)] space-y-3">
      <h3 className="text-sm sm:text-base font-bold text-[#E53E3E]">
        Danger Zone
      </h3>

      <div className="space-y-2">
        {/* Deactivate Account */}
        <button
          type="button"
          onClick={onOpenDeactivateModal}
          className="w-full flex items-center justify-between p-2.5 rounded-2xl hover:bg-[#FFF5F5] border border-transparent hover:border-[#FED7D7] transition-all duration-150 cursor-pointer text-left group"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-[#FFF5F5] border border-[#FED7D7] text-[#E53E3E] flex items-center justify-center shrink-0 shadow-2xs">
              <Clock className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-xs sm:text-sm font-bold text-[#E53E3E] block truncate">
                Deactivate Account
              </span>
              <span className="text-[11px] text-[#8A98AA] block truncate">
                Temporarily deactivate your account
              </span>
            </div>
          </div>

          <ChevronRight className="w-4 h-4 text-[#E53E3E] shrink-0 transition-colors" />
        </button>

        {/* Delete Account */}
        <button
          type="button"
          onClick={onOpenDeleteAccountModal}
          className="w-full flex items-center justify-between p-2.5 rounded-2xl hover:bg-[#FFF5F5] border border-transparent hover:border-[#FED7D7] transition-all duration-150 cursor-pointer text-left group"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-[#FFF5F5] border border-[#FED7D7] text-[#E53E3E] flex items-center justify-center shrink-0 shadow-2xs">
              <Trash2 className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-xs sm:text-sm font-bold text-[#E53E3E] block truncate">
                Delete Account
              </span>
              <span className="text-[11px] text-[#8A98AA] block truncate">
                Permanently delete your account
              </span>
            </div>
          </div>

          <ChevronRight className="w-4 h-4 text-[#E53E3E] shrink-0 transition-colors" />
        </button>
      </div>
    </div>
  );
};
