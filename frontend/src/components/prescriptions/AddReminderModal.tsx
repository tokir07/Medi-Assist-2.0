import React, { useState, useEffect } from 'react';
import { X, Bell, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { prescriptionsService } from '../../services/prescriptionsService';
import type { PrescriptionItem } from '../../types/prescriptions';

interface AddReminderModalProps {
  initialPrescription?: PrescriptionItem | null;
  initialMedicationName?: string;
  initialDosage?: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AddReminderModal: React.FC<AddReminderModalProps> = ({
  initialPrescription,
  initialMedicationName,
  initialDosage,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [medicationName, setMedicationName] = useState('');
  const [dosageInstruction, setDosageInstruction] = useState('1 tablet after breakfast');
  const [timeStr, setTimeStr] = useState('08:00 AM');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialMedicationName) {
      setMedicationName(initialMedicationName);
    } else if (initialPrescription) {
      setMedicationName(initialPrescription.medication_name || '');
    }
    if (initialDosage) {
      setDosageInstruction(`${initialDosage} after meals`);
    } else if (initialPrescription) {
      setDosageInstruction(`${initialPrescription.dosage || '1 tablet'} after meals`);
    }
  }, [initialPrescription, initialMedicationName, initialDosage, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!medicationName.trim() || !dosageInstruction.trim()) {
      setError('Please provide medication name and dose instruction.');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      await prescriptionsService.createReminder({
        medication_name: medicationName.trim(),
        dosage_instruction: dosageInstruction.trim(),
        time_str: timeStr.trim(),
        prescription_id: initialPrescription?.id,
      });

      setSaving(false);
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Failed to create reminder:', err);
      setError(err?.response?.data?.message || 'Failed to create reminder.');
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl border border-slate-200 w-full max-w-md shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-100 shadow-2xs">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                Add Medication Reminder
              </h3>
              <p className="text-[11px] text-slate-500">Daily notification schedule for doses</p>
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Medication Name *
              </label>
              <input
                type="text"
                required
                value={medicationName}
                onChange={(e) => setMedicationName(e.target.value)}
                placeholder="e.g. Amoxicillin 500mg"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:border-teal-500 focus:outline-hidden transition"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Dosage & Instruction *
              </label>
              <input
                type="text"
                required
                value={dosageInstruction}
                onChange={(e) => setDosageInstruction(e.target.value)}
                placeholder="e.g. 1 tablet after breakfast with water"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:border-teal-500 focus:outline-hidden transition"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Reminder Time
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['08:00 AM', '02:00 PM', '08:00 PM'].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTimeStr(t)}
                    className={`py-2 px-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1 ${
                      timeStr === t
                        ? 'bg-teal-50 border-teal-500 text-teal-700'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Clock className="w-3 h-3" />
                    <span>{t}</span>
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={timeStr}
                onChange={(e) => setTimeStr(e.target.value)}
                placeholder="Or custom time e.g. 09:30 PM"
                className="w-full px-3 py-2 mt-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:border-teal-500 focus:outline-hidden transition text-xs"
              />
            </div>
          </div>

          {/* Action Buttons */}
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
              disabled={saving}
              className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold transition disabled:opacity-60 shadow-sm"
            >
              {saving ? 'Scheduling...' : 'Set Reminder'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
