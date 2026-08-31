import React from 'react';
import {
  X,
  Calendar,
  Clock,
  MapPin,
  Video,
  ShieldCheck,
  CalendarClock,
  XCircle,
  FileText,
  Pill,
  MessageSquareHeart,
  ExternalLink,
  Plus,
  Send,
  Building2,
  Stethoscope,
} from 'lucide-react';
import type { AppointmentItem, LinkedRecordItem, LinkedPrescriptionItem } from '../../types/appointments';

interface AppointmentDetailsModalProps {
  appointment: AppointmentItem | null;
  isOpen: boolean;
  onClose: () => void;
  onReschedule: (apt: AppointmentItem) => void;
  onCancel: (apt: AppointmentItem) => void;
  onOpenRecord?: (recordId: string) => void;
  onOpenPrescription?: (prescriptionId: string) => void;
  onOpenSendMessage?: (doctorName: string, appointmentId: string) => void;
}

export const AppointmentDetailsModal: React.FC<AppointmentDetailsModalProps> = ({
  appointment,
  isOpen,
  onClose,
  onReschedule,
  onCancel,
  onOpenRecord,
  onOpenPrescription,
  onOpenSendMessage,
}) => {
  if (!isOpen || !appointment) return null;

  const isUpcoming = ['confirmed', 'pending', 'rescheduled'].includes(
    (appointment.status || '').toLowerCase()
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-700 border border-teal-100 flex items-center justify-center shadow-2xs font-bold">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                Appointment Details
              </h3>
              <p className="text-xs text-slate-500 font-mono">
                ID: {appointment.id.slice(0, 8).toUpperCase()}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 custom-scrollbar text-xs">
          {/* Doctor & Specialty Card */}
          <div className="bg-slate-50 rounded-2xl border border-slate-200/90 p-4 flex items-center gap-4">
            {appointment.doctor_image ? (
              <img
                src={appointment.doctor_image}
                alt={appointment.doctor_name}
                className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-2xs shrink-0"
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-teal-50 text-teal-700 font-bold text-lg flex items-center justify-center border-2 border-white shadow-2xs shrink-0">
                {appointment.doctor_name.replace('Dr.', '').trim().charAt(0) || 'D'}
              </div>
            )}

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-100">
                  {appointment.appointment_type}
                </span>
                <span className="text-[11px] font-semibold text-emerald-600">
                  • {appointment.status}
                </span>
              </div>
              <h4 className="text-sm sm:text-base font-bold text-slate-900 mt-1 truncate">
                {appointment.doctor_name}
              </h4>
              <p className="text-xs text-slate-500">{appointment.doctor_specialty}</p>
            </div>
          </div>

          {/* Schedule & Location Grid */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-1">
              <div className="flex items-center gap-1.5 text-slate-400">
                <Calendar className="w-3.5 h-3.5 text-teal-600" />
                <span className="text-[10px] font-semibold uppercase tracking-wider">Date</span>
              </div>
              <p className="font-bold text-slate-900">{appointment.appointment_date}</p>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-1">
              <div className="flex items-center gap-1.5 text-slate-400">
                <Clock className="w-3.5 h-3.5 text-teal-600" />
                <span className="text-[10px] font-semibold uppercase tracking-wider">Time</span>
              </div>
              <p className="font-bold text-slate-900">
                {appointment.appointment_time}{' '}
                <span className="text-slate-400 font-normal">({appointment.duration_minutes || 30}m)</span>
              </p>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-1 col-span-2">
              <div className="flex items-center gap-1.5 text-slate-400">
                <MapPin className="w-3.5 h-3.5 text-teal-600" />
                <span className="text-[10px] font-semibold uppercase tracking-wider">Hospital / Location</span>
              </div>
              <p className="font-bold text-slate-900">{appointment.hospital}</p>
              {appointment.hospital_address && (
                <p className="text-[11px] text-slate-500">{appointment.hospital_address}</p>
              )}
            </div>
          </div>

          {/* Reason for Visit */}
          {appointment.notes && (
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Reason for Visit / Patient Notes
              </span>
              <p className="text-slate-700 leading-relaxed">{appointment.notes}</p>
            </div>
          )}

          {/* Cancellation Info if cancelled */}
          {appointment.status === 'Cancelled' && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl space-y-1">
              <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider">
                Cancellation Reason
              </span>
              <p className="text-rose-900 leading-relaxed">
                {appointment.cancellation_reason || 'Cancelled by patient'}
              </p>
            </div>
          )}

          {/* Doctor Health Advice & Messages */}
          <div className="p-4 bg-white rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquareHeart className="w-4 h-4 text-teal-600" />
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Doctor's Clinical Advice & Notes
                </h4>
              </div>
              <button
                type="button"
                onClick={() =>
                  onOpenSendMessage &&
                  onOpenSendMessage(appointment.doctor_name, appointment.id)
                }
                className="text-[11px] font-bold text-teal-700 hover:text-teal-800 flex items-center gap-1 cursor-pointer"
              >
                <Send className="w-3 h-3" />
                <span>Message Doctor</span>
              </button>
            </div>

            {appointment.doctor_messages && appointment.doctor_messages.length > 0 ? (
              <div className="space-y-2">
                {appointment.doctor_messages.map((msg) => (
                  <div key={msg.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{msg.title}</span>
                      <span className="text-[10px] text-slate-400">{msg.created_at}</span>
                    </div>
                    <p className="text-slate-700 whitespace-pre-line">{msg.content}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-slate-500 italic">
                No clinical notes recorded yet for this appointment.
              </p>
            )}
          </div>

          {/* Related Medical Records */}
          {appointment.linked_records && appointment.linked_records.length > 0 && (
            <div className="p-4 bg-white rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-teal-600" />
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Related Medical Records
                </h4>
              </div>
              <div className="space-y-2">
                {appointment.linked_records.map((rec) => (
                  <div
                    key={rec.id}
                    className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between"
                  >
                    <div>
                      <h5 className="font-bold text-slate-900">{rec.title}</h5>
                      <p className="text-[11px] text-slate-500">{rec.category} • {rec.record_date || 'Recent'}</p>
                    </div>
                    {onOpenRecord && (
                      <button
                        type="button"
                        onClick={() => onOpenRecord(rec.id)}
                        className="px-2.5 py-1 bg-white hover:bg-teal-50 text-teal-700 border border-slate-200 hover:border-teal-200 rounded-lg font-bold text-[11px] transition shadow-2xs flex items-center gap-1 cursor-pointer"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>View Document</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Related Prescriptions */}
          {appointment.linked_prescriptions && appointment.linked_prescriptions.length > 0 && (
            <div className="p-4 bg-white rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center gap-2">
                <Pill className="w-4 h-4 text-teal-600" />
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Related Prescriptions
                </h4>
              </div>
              <div className="space-y-2">
                {appointment.linked_prescriptions.map((p) => (
                  <div
                    key={p.id}
                    className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between"
                  >
                    <div>
                      <h5 className="font-bold text-slate-900">{p.medication_name} ({p.dosage})</h5>
                      <p className="text-[11px] text-slate-500">{p.frequency} • Dr. {p.doctor_name}</p>
                    </div>
                    {onOpenPrescription && (
                      <button
                        type="button"
                        onClick={() => onOpenPrescription(p.id)}
                        className="px-2.5 py-1 bg-white hover:bg-teal-50 text-teal-700 border border-slate-200 hover:border-teal-200 rounded-lg font-bold text-[11px] transition shadow-2xs flex items-center gap-1 cursor-pointer"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>View Details</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl font-bold text-xs transition cursor-pointer"
          >
            Close
          </button>

          {isUpcoming && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onCancel(appointment);
                }}
                className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl font-bold text-xs transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
              >
                <XCircle className="w-4 h-4 text-rose-600" />
                <span>Cancel</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onReschedule(appointment);
                }}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold text-xs transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
              >
                <CalendarClock className="w-4 h-4" />
                <span>Reschedule</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
