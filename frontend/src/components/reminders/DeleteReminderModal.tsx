import React, { useState } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import type { ReminderItem } from '../../types/reminders';

interface DeleteReminderModalProps {
  reminder: ReminderItem | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmDelete: (reminderId: string) => Promise<void>;
}

export const DeleteReminderModal: React.FC<DeleteReminderModalProps> = ({
  reminder,
  isOpen,
  onClose,
  onConfirmDelete,
}) => {
  const [loading, setLoading] = useState(false);

  if (!isOpen || !reminder) return null;

  const handleDelete = async () => {
    try {
      setLoading(true);
      await onConfirmDelete(reminder.id);
      onClose();
    } catch (err) {
      console.error('Failed to delete reminder:', err);
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
            <h3 className="text-base font-bold text-[#102A56]">Delete Reminder?</h3>
            <p className="text-xs text-[#5F6F86]">
              Are you sure you want to permanently remove this reminder?
            </p>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#F7FAFF] border border-[#E7EDF4] space-y-1">
          <span className="text-xs font-bold text-[#102A56] block">
            {reminder.title}
          </span>
          <span className="text-[11px] text-[#5F6F86] block">
            {reminder.reminder_type} • {reminder.time_str}
          </span>
        </div>

        <div className="pt-2 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-[#5F6F86] hover:bg-[#F4F8FC] transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={loading}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#E53E3E] hover:bg-[#C53030] active:bg-[#9B2C2C] text-white text-xs font-bold shadow-xs transition-all cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <span>Delete</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
