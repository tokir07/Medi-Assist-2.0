import React, { useState } from 'react';
import { X, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { prescriptionsService } from '../../services/prescriptionsService';

interface RequestPrescriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const RequestPrescriptionModal: React.FC<RequestPrescriptionModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [doctorName, setDoctorName] = useState('Dr. Priya Sharma');
  const [hospital, setHospital] = useState('City Care Hospital');
  const [medication, setMedication] = useState('');
  const [reason, setReason] = useState('');
  const [urgency, setUrgency] = useState<'NORMAL' | 'URGENT'>('NORMAL');

  const [submitting, setSubmitting] = useState(false);
  const [successResult, setSuccessResult] = useState<{ id: string; message: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!medication.trim() || !reason.trim()) {
      setError('Please provide medication name and reason for request.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      const res = await prescriptionsService.requestNewPrescription({
        doctor_name: doctorName.trim(),
        hospital: hospital.trim(),
        medication_requested: medication.trim(),
        reason: reason.trim(),
        urgency,
      });

      setSuccessResult({
        id: res.request_id,
        message: res.message,
      });

      setTimeout(() => {
        setSubmitting(false);
        onSuccess();
      }, 500);
    } catch (err: any) {
      console.error('Failed to submit prescription request:', err);
      setError(err?.response?.data?.message || 'Failed to submit prescription request.');
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-3xl border border-[#D9E1EA] w-full max-w-md shadow-[0_20px_50px_rgba(16,42,86,0.15)] overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-[#E7EDF4] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#E8F8F0] text-[#1FA774] flex items-center justify-center shadow-2xs">
              <FileText className="w-4 h-4 text-[#1FA774]" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-[#102A56]">Request Prescription</h3>
              <p className="text-[11px] text-[#5F6F86]">Request a new prescription from your physician</p>
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
              <h4 className="text-base font-bold text-[#102A56]">Request Sent Successfully</h4>
              <p className="text-xs text-[#5F6F86] mt-1 max-w-xs mx-auto">
                {successResult.message}
              </p>
              <div className="mt-3 p-3 rounded-2xl bg-[#F7FAFF] border border-[#E7EDF4] inline-block">
                <span className="text-[10px] text-[#8A98AA] font-semibold uppercase">Tracking ID</span>
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
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#102A56]">Doctor & Hospital</label>
                <select
                  value={`${doctorName}|${hospital}`}
                  onChange={(e) => {
                    const [d, h] = e.target.value.split('|');
                    setDoctorName(d);
                    setHospital(h);
                  }}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#F7FAFF] border border-[#D9E1EA] text-xs sm:text-sm text-[#102A56] focus:bg-white focus:border-[#0FA3A3] focus:outline-none transition-all cursor-pointer"
                >
                  <option value="Dr. Priya Sharma|City Care Hospital">
                    Dr. Priya Sharma (City Care Hospital)
                  </option>
                  <option value="Dr. Arjun Mehta|HealthPlus Clinic">
                    Dr. Arjun Mehta (HealthPlus Clinic)
                  </option>
                  <option value="Dr. Neha Verma|City Care Hospital">
                    Dr. Neha Verma (City Care Hospital)
                  </option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#102A56]">
                  Medication Needed <span className="text-[#D64545]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={medication}
                  onChange={(e) => setMedication(e.target.value)}
                  placeholder="e.g. Metformin 500mg or Anti-allergy medication"
                  className="w-full px-3.5 py-2 rounded-xl bg-[#F7FAFF] border border-[#D9E1EA] text-xs sm:text-sm text-[#102A56] focus:bg-white focus:border-[#0FA3A3] focus:outline-none transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#102A56]">Reason for Request</label>
                <textarea
                  rows={2}
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Previous prescription expired; managing ongoing condition..."
                  className="w-full px-3.5 py-2 rounded-xl bg-[#F7FAFF] border border-[#D9E1EA] text-xs sm:text-sm text-[#102A56] focus:bg-white focus:border-[#0FA3A3] focus:outline-none transition-all resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#102A56]">Urgency</label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1.5 text-xs text-[#5F6F86] cursor-pointer">
                    <input
                      type="radio"
                      name="urgency"
                      checked={urgency === 'NORMAL'}
                      onChange={() => setUrgency('NORMAL')}
                      className="text-[#0FA3A3] focus:ring-[#0FA3A3]"
                    />
                    <span>Normal (1-2 days)</span>
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-[#D64545] font-semibold cursor-pointer">
                    <input
                      type="radio"
                      name="urgency"
                      checked={urgency === 'URGENT'}
                      onChange={() => setUrgency('URGENT')}
                      className="text-[#D64545] focus:ring-[#D64545]"
                    />
                    <span>Urgent (Today)</span>
                  </label>
                </div>
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
                {submitting ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
