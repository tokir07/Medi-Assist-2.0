import React, { useState } from 'react';
import { X, Share2, ShieldCheck, CheckCircle2, AlertCircle, User } from 'lucide-react';
import type { MedicalRecordItem } from '../../types/records';
import { recordsService } from '../../services/recordsService';

interface ShareRecordModalProps {
  record: MedicalRecordItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ShareRecordModal: React.FC<ShareRecordModalProps> = ({
  record,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [doctorName, setDoctorName] = useState('Dr. Sarah Jenkins');
  const [doctorEmail, setDoctorEmail] = useState('doctor@example.com');
  const [permission, setPermission] = useState<'VIEW' | 'FULL'>('VIEW');
  const [expiresInDays, setExpiresInDays] = useState(30);
  const [notes, setNotes] = useState('');

  const [sharing, setSharing] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !record) return null;

  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!doctorName.trim()) {
      setError('Please provide a physician or recipient name.');
      return;
    }

    try {
      setSharing(true);
      setError(null);
      await recordsService.shareRecord(record.id, {
        doctor_name: doctorName.trim(),
        doctor_email: doctorEmail.trim() || undefined,
        permission,
        expires_in_days: expiresInDays,
        notes: notes.trim() || undefined,
      });

      setSuccessMsg(`Record securely shared with ${doctorName}. Access active for ${expiresInDays} days.`);
      setTimeout(() => {
        setSharing(false);
        setSuccessMsg(null);
        onSuccess();
        onClose();
      }, 1200);
    } catch (err: any) {
      console.error('Failed to share record:', err);
      setError(err?.response?.data?.message || 'Failed to share medical record.');
      setSharing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-3xl border border-[#D9E1EA] w-full max-w-lg shadow-[0_20px_50px_rgba(16,42,86,0.15)] overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-[#E7EDF4] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#EEF5FF] text-[#2F80ED] flex items-center justify-center shadow-2xs">
              <Share2 className="w-4 h-4 text-[#2F80ED]" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-[#102A56]">Share Medical Record</h3>
              <p className="text-[11px] text-[#5F6F86] truncate max-w-[280px]">
                {record.title}
              </p>
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

        {/* Form Body */}
        <form onSubmit={handleShare} className="p-5 sm:p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-[#FFF5F5] border border-[#FED7D7] text-[#D64545] text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-[#E6F7F7] border border-[#B2EBEB] text-[#0FA3A3] text-xs flex items-center gap-2 font-semibold">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Doctor Info */}
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-[#102A56]">Doctor / Recipient Name</label>
              <input
                type="text"
                required
                value={doctorName}
                onChange={(e) => setDoctorName(e.target.value)}
                placeholder="e.g. Dr. Sarah Jenkins"
                className="w-full px-3.5 py-2 rounded-xl bg-[#F7FAFF] border border-[#D9E1EA] text-xs sm:text-sm text-[#102A56] focus:bg-white focus:border-[#0FA3A3] focus:outline-none transition-all"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-[#102A56]">Doctor's Email or Doctor ID</label>
              <input
                type="text"
                value={doctorEmail}
                onChange={(e) => setDoctorEmail(e.target.value)}
                placeholder="e.g. doctor@example.com or DR-JH-1024"
                className="w-full px-3.5 py-2 rounded-xl bg-[#F7FAFF] border border-[#D9E1EA] text-xs sm:text-sm text-[#102A56] focus:bg-white focus:border-[#0FA3A3] focus:outline-none transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#102A56]">Permission</label>
                <select
                  value={permission}
                  onChange={(e) => setPermission(e.target.value as any)}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#F7FAFF] border border-[#D9E1EA] text-xs sm:text-sm text-[#102A56] focus:bg-white focus:border-[#0FA3A3] focus:outline-none transition-all cursor-pointer"
                >
                  <option value="VIEW">View Only</option>
                  <option value="FULL">Full Access (Download allowed)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#102A56]">Access Expiry</label>
                <select
                  value={expiresInDays}
                  onChange={(e) => setExpiresInDays(Number(e.target.value))}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#F7FAFF] border border-[#D9E1EA] text-xs sm:text-sm text-[#102A56] focus:bg-white focus:border-[#0FA3A3] focus:outline-none transition-all cursor-pointer"
                >
                  <option value={7}>7 Days</option>
                  <option value={30}>30 Days</option>
                  <option value={90}>90 Days</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-[#102A56]">Message / Note to Doctor</label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional consultation reason or instructions..."
                className="w-full px-3.5 py-2 rounded-xl bg-[#F7FAFF] border border-[#D9E1EA] text-xs sm:text-sm text-[#102A56] focus:bg-white focus:border-[#0FA3A3] focus:outline-none transition-all resize-none"
              />
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-[#EEF5FF] border border-[#D9E1EA]/60 flex items-start gap-2.5 text-[11px] text-[#5F6F86]">
            <ShieldCheck className="w-4 h-4 text-[#0FA3A3] shrink-0 mt-0.5" />
            <span>
              Shared records are authorized through cryptographic tokens and access logs are recorded for compliance.
            </span>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={sharing}
              className="px-4 py-2 rounded-xl border border-[#D9E1EA] text-xs font-bold text-[#5F6F86] hover:bg-[#F4F8FC] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={sharing}
              className="px-5 py-2 rounded-xl bg-[#0FA3A3] hover:bg-[#0D8E8E] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {sharing ? 'Sharing...' : 'Confirm Share'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
