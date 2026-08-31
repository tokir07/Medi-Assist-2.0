import React, { useState, useEffect } from 'react';
import {
  X,
  CalendarClock,
  AlertCircle,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { appointmentsService } from '../../services/appointmentsService';
import type { AppointmentItem } from '../../types/appointments';

interface RescheduleAppointmentModalProps {
  appointment: AppointmentItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const RescheduleAppointmentModal: React.FC<RescheduleAppointmentModalProps> = ({
  appointment,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [newDate, setNewDate] = useState<string>('2026-09-15');
  const [newTime, setNewTime] = useState<string>('11:00 AM');
  const [reason, setReason] = useState<string>('Schedule adjustment');
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  useEffect(() => {
    if (appointment) {
      setNewDate(appointment.appointment_date);
      setNewTime(appointment.appointment_time);
    }
  }, [appointment]);

  useEffect(() => {
    if (appointment && newDate) {
      const fetchSlots = async () => {
        try {
          setLoadingSlots(true);
          const data = await appointmentsService.getAvailableSlots(
            appointment.doctor_name,
            newDate
          );
          setAvailableSlots(data.slots);
          if (data.slots.length > 0 && !data.slots.includes(newTime)) {
            setNewTime(data.slots[0]);
          }
        } catch {
          setAvailableSlots(['10:30 AM', '11:00 AM', '04:15 PM']);
        } finally {
          setLoadingSlots(false);
        }
      };
      fetchSlots();
    }
  }, [appointment, newDate]);

  if (!isOpen || !appointment) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDate || !newTime) {
      setError('Please select both a new date and time slot.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await appointmentsService.rescheduleAppointment(appointment.id, {
        new_date: newDate,
        new_time: newTime,
        reason: reason || undefined,
      });

      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        onSuccess();
        onClose();
      }, 1200);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          'Unable to reschedule appointment. Please try another slot.'
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
            <div className="w-10 h-10 rounded-2xl bg-[#E8F8F5] text-[#0FA3A3] flex items-center justify-center shadow-2xs">
              <CalendarClock className="w-5 h-5 text-[#0FA3A3]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#102A56]">
                Reschedule Appointment
              </h3>
              <p className="text-xs text-[#5F6F86] truncate max-w-[200px]">
                {appointment.doctor_name}
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
        {isSuccess ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-[#E8F8F5] text-[#1FA774] flex items-center justify-center mx-auto shadow-xs">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-[#102A56]">
              Appointment Rescheduled!
            </h3>
            <p className="text-xs text-[#5F6F86]">
              Updated to {newDate} at {newTime}.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-[#102A56] mb-1.5">
                Select New Date
              </label>
              <input
                type="date"
                min="2026-08-29"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#F4F8FC] border border-[#D9E1EA] rounded-xl text-xs sm:text-sm text-[#102A56] focus:bg-white focus:border-[#0FA3A3] focus:outline-none"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-[#102A56]">
                  Available Time Slots
                </label>
                {loadingSlots && (
                  <span className="text-[11px] text-[#0FA3A3] flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" /> Loading...
                  </span>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2">
                {availableSlots.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setNewTime(slot)}
                    className={`py-2 px-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      newTime === slot
                        ? 'bg-[#0FA3A3] text-white border-[#0FA3A3] shadow-xs'
                        : 'bg-white border-[#D9E1EA] text-[#102A56] hover:bg-[#F4F8FC]'
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#102A56] mb-1.5">
                Reason for Rescheduling
              </label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Work commitment, Travel"
                className="w-full px-3.5 py-2.5 bg-[#F4F8FC] border border-transparent rounded-xl text-xs text-[#102A56] focus:bg-white focus:border-[#0FA3A3] focus:outline-none"
              />
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#F4F8FC]">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-[#D9E1EA] text-xs font-semibold text-[#5F6F86] hover:bg-[#F4F8FC] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#0FA3A3] hover:bg-[#0D8E8E] text-white text-xs sm:text-sm font-bold transition-colors cursor-pointer disabled:opacity-50"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>Confirm Reschedule</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
