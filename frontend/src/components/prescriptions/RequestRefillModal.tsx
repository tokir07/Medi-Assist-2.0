import React, { useState } from 'react';
import { X, RotateCcw, CheckCircle2, AlertCircle, Building } from 'lucide-react';
import { prescriptionsService } from '../../services/prescriptionsService';
import type { PrescriptionItem } from '../../types/prescriptions';

interface RequestRefillModalProps {
  prescription: PrescriptionItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const RequestRefillModal: React.FC<RequestRefillModalProps> = ({
  prescription,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [pharmacy, setPharmacy] = useState('MediAssist Central Pharmacy');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successResult, setSuccessResult] = useState<{ id: string; message: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !prescription) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);
      const res = await prescriptionsService.requestRefill(prescription.id, {
        preferred_pharmacy: pharmacy,
        notes: notes.trim() || undefined,
      });

      setSuccessResult({
        id: res.refill_id,
        message: res.message,
      });

      setTimeout(() => {
        setSubmitting(false);
        onSuccess();
      }, 500);
    } catch (err: any) {
      console.error('Failed to request refill:', err);
      setError(err?.response?.data?.message || 'Failed to submit refill request.');
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-3xl border border-[#D9E1EA] w-full max-w-md shadow-[0_20px_50px_rgba(16,42,86,0.15)] overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-[#E7EDF4] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#EEF5FF] text-[#2F80ED] flex items-center justify-center shadow-2xs">
              <RotateCcw className="w-4 h-4 text-[#2F80ED]" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-[#102A56]">Request Medication Refill</h3>
              <p className="text-[11px] text-[#5F6F86] truncate max-w-[240px]">
                {prescription.medication_name}
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

        {/* Content */}
        {successResult ? (
          <div className="p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-[#E6F7F7] text-[#0FA3A3] flex items-center justify-center mx-auto shadow-2xs">
              <CheckCircle2 className="w-7 h-7 text-[#0FA3A3]" />
            </div>
            <div>
              <h4 className="text-base font-bold text-[#102A56]">Refill Request Submitted</h4>
              <p className="text-xs text-[#5F6F86] mt-1 max-w-xs mx-auto">
                {successResult.message}
              </p>
              <div className="mt-3 p-3 rounded-2xl bg-[#F7FAFF] border border-[#E7EDF4] inline-block">
                <span className="text-[10px] text-[#8A98AA] font-semibold uppercase">Refill Ref ID</span>
                <p className="text-xs font-bold text-[#102A56] tracking-wider">{successResult.id}</p>
              </div>
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 rounded-xl bg-[#0FA3A3] hover:bg-[#0D8E8E] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-[#FFF5F5] border border-[#FED7D7] text-[#D64545] text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-3">
              <div className="p-3 rounded-2xl bg-[#F7FAFF] border border-[#E7EDF4] space-y-1">
                <span className="text-[10px] uppercase font-bold text-[#8A98AA]">Prescribed By</span>
                <p className="text-xs font-bold text-[#102A56]">
                  {prescription.doctor_name} ({prescription.hospital})
                </p>
                <p className="text-[11px] text-[#5F6F86]">
                  Dosage: {prescription.dosage} • {prescription.frequency}
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#102A56]">Preferred Pharmacy</label>
                <input
                  type="text"
                  required
                  value={pharmacy}
                  onChange={(e) => setPharmacy(e.target.value)}
                  placeholder="e.g. MediAssist Central Pharmacy"
                  className="w-full px-3.5 py-2 rounded-xl bg-[#F7FAFF] border border-[#D9E1EA] text-xs sm:text-sm text-[#102A56] focus:bg-white focus:border-[#0FA3A3] focus:outline-none transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#102A56]">Notes to Doctor / Pharmacist</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Running low on medication, need 30-day supply..."
                  className="w-full px-3.5 py-2 rounded-xl bg-[#F7FAFF] border border-[#D9E1EA] text-xs sm:text-sm text-[#102A56] focus:bg-white focus:border-[#0FA3A3] focus:outline-none transition-all resize-none"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-[#D9E1EA] text-xs font-bold text-[#5F6F86] hover:bg-[#F4F8FC] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 rounded-xl bg-[#0FA3A3] hover:bg-[#0D8E8E] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Send Refill Request'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
