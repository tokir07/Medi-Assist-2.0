import React, { useState } from 'react';
import { X, Send, Stethoscope, AlertCircle, Building2, Sparkles, CheckCircle2 } from 'lucide-react';
import { appointmentsService } from '../../services/appointmentsService';
import type { DoctorHealthMessage } from '../../types/appointments';

interface SendDoctorMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newMsg: DoctorHealthMessage) => void;
  initialDoctorName?: string;
  appointmentId?: string;
}

export const SendDoctorMessageModal: React.FC<SendDoctorMessageModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialDoctorName,
  appointmentId,
}) => {
  const [doctorName, setDoctorName] = useState(initialDoctorName || 'Dr. Priya Sharma');
  const [doctorSpecialty, setDoctorSpecialty] = useState('General Physician');
  const [hospital, setHospital] = useState('MediAssist Medical Center');
  const [messageType, setMessageType] = useState('CLINICAL_ADVICE');
  const [title, setTitle] = useState('Post-Consultation Health Advice');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState<'NORMAL' | 'HIGH' | 'URGENT'>('NORMAL');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !title.trim()) {
      setError('Please provide message title and clinical notes/content.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await appointmentsService.sendDoctorMessage({
        appointment_id: appointmentId,
        doctor_name: doctorName.trim(),
        doctor_specialty: doctorSpecialty.trim(),
        hospital: hospital.trim(),
        message_type: messageType,
        title: title.trim(),
        content: content.trim(),
        priority,
      });

      onSuccess(res);
      onClose();
    } catch (err: any) {
      console.error('Failed to send doctor message:', err);
      setError(err?.response?.data?.message || 'Failed to send message.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl border border-slate-200 w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-100 shadow-2xs font-bold">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                Doctor Health Advice & Clinical Note
              </h3>
              <p className="text-[11px] text-slate-500">Record health instructions or post-visit advice</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 text-xs overflow-y-auto custom-scrollbar flex-1">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Doctor Name *
              </label>
              <input
                type="text"
                required
                value={doctorName}
                onChange={(e) => setDoctorName(e.target.value)}
                placeholder="Dr. Priya Sharma"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:border-teal-500 focus:outline-hidden transition"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Specialization
              </label>
              <input
                type="text"
                value={doctorSpecialty}
                onChange={(e) => setDoctorSpecialty(e.target.value)}
                placeholder="General Physician"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:border-teal-500 focus:outline-hidden transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Advice Type
              </label>
              <select
                value={messageType}
                onChange={(e) => setMessageType(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:border-teal-500 focus:outline-hidden transition"
              >
                <option value="CLINICAL_ADVICE">Clinical Advice</option>
                <option value="CARE_INSTRUCTION">Care & Diet Instructions</option>
                <option value="LAB_FOLLOWUP">Lab Report Follow-up</option>
                <option value="PRESCRIPTION_NOTE">Prescription Note</option>
                <option value="GENERAL">General Message</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:border-teal-500 focus:outline-hidden transition font-semibold"
              >
                <option value="NORMAL">Normal Priority</option>
                <option value="HIGH">High Priority</option>
                <option value="URGENT">Urgent Attention</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              Subject / Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Post-Consultation Care & Medication Advice"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:border-teal-500 focus:outline-hidden transition"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              Clinical Advice / Care Instructions *
            </label>
            <textarea
              rows={4}
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter detailed doctor notes, lifestyle recommendations, follow-up timelines, warnings, or dietary advice..."
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:border-teal-500 focus:outline-hidden transition"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold transition disabled:opacity-60 shadow-sm flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{loading ? 'Recording...' : 'Save & Send Advice'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
