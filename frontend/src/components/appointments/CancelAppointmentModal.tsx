import React, { useState } from 'react';
import { X, AlertTriangle, Loader2 } from 'lucide-react';
import { appointmentsService } from '../../services/appointmentsService';
import type { AppointmentItem } from '../../types/appointments';

interface CancelAppointmentModalProps {
  appointment: AppointmentItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CancelAppointmentModal: React.FC<CancelAppointmentModalProps> = ({
  appointment,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [reason, setReason] = useState<string>('Change of plans');
  const [customReason, setCustomReason] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !appointment) return null;

  const reasons = [
    'Change of plans',
    'Feeling better / Symptoms resolved',
    'Scheduling conflict',
    'Consulted another doctor',
    'Other reason',
  ];

  const handleCancel = async () => {
    try {
      setSubmitting(true);
      setError(null);
      const finalReason =
        reason === 'Other reason' && customReason ? customReason : reason;

      await appointmentsService.cancelAppointment(appointment.id, {
        cancellation_reason: finalReason,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(
        err?.response?.data?.message || 'Failed to cancel appointment. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-3xl border border-[#D9E1EA] shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-[#F4F8FC] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-50 text-[#D64545] flex items-center justify-center shadow-2xs">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#102A56]">
                Cancel Appointment?
              </h3>
              <p className="text-xs text-[#5F6F86]">
                Confirm cancellation request
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-[#8A98AA] hover:text-[#102A56] hover:bg-[#F4F8FC] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
              {error}
            </div>
          )}

          <div className="bg-[#F7FAFF] rounded-2xl p-4 border border-[#D9E1EA] space-y-1.5 text-xs">
            <p className="font-bold text-[#102A56] text-sm">
              {appointment.appointment_type}
            </p>
            <p className="text-[#5F6F86] font-medium">{appointment.doctor_name}</p>
            <p className="text-[#8A98AA]">
              {appointment.appointment_date} at {appointment.appointment_time} • {appointment.hospital}
            </p>
          </div>

          <p className="text-xs text-[#5F6F86] leading-relaxed">
            Are you sure you want to cancel this appointment? This action cannot be undone, but you can always book a new slot later.
          </p>

          <div>
            <label className="block text-xs font-bold text-[#102A56] mb-1.5">
              Reason for Cancellation
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 bg-[#F4F8FC] border border-[#D9E1EA] rounded-xl text-xs text-[#102A56] focus:bg-white focus:outline-none cursor-pointer"
            >
              {reasons.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {reason === 'Other reason' && (
            <div>
              <input
                type="text"
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Please specify reason..."
                className="w-full px-3.5 py-2 bg-[#F4F8FC] border border-transparent rounded-xl text-xs text-[#102A56] focus:bg-white focus:border-[#0FA3A3] focus:outline-none"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-[#F4F8FC] flex items-center justify-end gap-3 bg-white">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-[#D9E1EA] text-xs font-semibold text-[#102A56] hover:bg-[#F4F8FC] transition-colors cursor-pointer"
          >
            Keep Appointment
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={handleCancel}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#D64545] hover:bg-[#B91C1C] text-white text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>Cancel Appointment</span>
          </button>
        </div>
      </div>
    </div>
  );
};
