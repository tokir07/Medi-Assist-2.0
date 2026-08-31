import React, { useState } from 'react';
import { X, Plus, Trash2, Pill, Stethoscope, Building2, Calendar, FileText, Sparkles, AlertCircle } from 'lucide-react';
import { prescriptionsService } from '../../services/prescriptionsService';
import type { PrescriptionItem, PrescriptionMedication } from '../../types/prescriptions';

interface AddPrescriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPrescriptionAdded: (newPrescription: PrescriptionItem) => void;
}

export const AddPrescriptionModal: React.FC<AddPrescriptionModalProps> = ({
  isOpen,
  onClose,
  onPrescriptionAdded,
}) => {
  const [doctorName, setDoctorName] = useState('Dr. Priya Sharma');
  const [doctorSpecialty, setDoctorSpecialty] = useState('General Physician');
  const [hospital, setHospital] = useState('MediAssist Medical Center');
  const [prescribedDate, setPrescribedDate] = useState(new Date().toISOString().split('T')[0]);
  const [sessionName, setSessionName] = useState('General Records');
  const [diagnosis, setDiagnosis] = useState('');
  const [notes, setNotes] = useState('');

  const [medications, setMedications] = useState<PrescriptionMedication[]>([
    {
      id: '1',
      medication_name: '',
      dosage: '500 mg',
      frequency: 'Twice daily after meals',
      duration: '5 days',
      route: 'Oral',
      instructions: 'Take with a glass of water after food.',
      refills: 0,
    },
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAddMedRow = () => {
    setMedications((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        medication_name: '',
        dosage: '1 tablet',
        frequency: 'Once daily',
        duration: '7 days',
        route: 'Oral',
        instructions: 'Take after food.',
        refills: 0,
      },
    ]);
  };

  const handleRemoveMedRow = (index: number) => {
    if (medications.length <= 1) return;
    setMedications((prev) => prev.filter((_, i) => i !== index));
  };

  const handleMedChange = (index: number, field: keyof PrescriptionMedication, value: any) => {
    setMedications((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate
    const validMeds = medications.filter((m) => m.medication_name.trim().length > 0);
    if (validMeds.length === 0) {
      setError('Please provide at least one medication name.');
      return;
    }

    try {
      setLoading(true);
      const res = await prescriptionsService.createManualPrescription({
        doctor_name: doctorName.trim(),
        doctor_specialty: doctorSpecialty.trim(),
        hospital: hospital.trim(),
        prescribed_date: prescribedDate,
        session_name: sessionName.trim(),
        diagnosis_or_indication: diagnosis.trim() || undefined,
        notes: notes.trim() || undefined,
        medications: validMeds,
      });

      onPrescriptionAdded(res);
      onClose();
    } catch (err: any) {
      console.error('Failed to create manual prescription:', err);
      setError(err?.response?.data?.message || 'Failed to save prescription. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-teal-50 text-teal-700 rounded-xl border border-teal-100">
              <Pill className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Add New Prescription</h2>
              <p className="text-xs text-slate-500">Record a prescription manually into your medical history</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Provider & Facility Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Prescribing Doctor
              </label>
              <div className="relative">
                <Stethoscope className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  value={doctorName}
                  onChange={(e) => setDoctorName(e.target.value)}
                  placeholder="e.g. Dr. Priya Sharma"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:border-teal-500 focus:outline-hidden transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Doctor Specialty
              </label>
              <input
                type="text"
                value={doctorSpecialty}
                onChange={(e) => setDoctorSpecialty(e.target.value)}
                placeholder="e.g. General Physician, Cardiologist"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:border-teal-500 focus:outline-hidden transition"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Clinic / Hospital / Facility
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={hospital}
                  onChange={(e) => setHospital(e.target.value)}
                  placeholder="e.g. MediAssist Medical Center"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:border-teal-500 focus:outline-hidden transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Prescription Date
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="date"
                  required
                  value={prescribedDate}
                  onChange={(e) => setPrescribedDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:border-teal-500 focus:outline-hidden transition"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Record Session / Category
              </label>
              <input
                type="text"
                value={sessionName}
                onChange={(e) => setSessionName(e.target.value)}
                placeholder="e.g. Annual Health Checkup, General Records"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:border-teal-500 focus:outline-hidden transition"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Diagnosis / Indication (Optional)
              </label>
              <input
                type="text"
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                placeholder="e.g. Hypertension, Seasonal Flu"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:border-teal-500 focus:outline-hidden transition"
              />
            </div>
          </div>

          {/* Medications Dynamic Builder */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Pill className="w-4 h-4 text-teal-600" />
                <span>Prescribed Medications ({medications.length})</span>
              </label>
              <button
                type="button"
                onClick={handleAddMedRow}
                className="px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 rounded-lg font-semibold text-xs transition flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Medicine</span>
              </button>
            </div>

            <div className="space-y-3">
              {medications.map((med, idx) => (
                <div
                  key={med.id || idx}
                  className="p-3.5 bg-slate-50/80 border border-slate-200 rounded-xl space-y-3 relative group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-teal-800 uppercase tracking-wider">
                      Medicine #{idx + 1}
                    </span>
                    {medications.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveMedRow(idx)}
                        className="text-slate-400 hover:text-rose-600 transition p-1"
                        title="Remove medicine"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">
                        Medicine Name & Strength *
                      </label>
                      <input
                        type="text"
                        required
                        value={med.medication_name}
                        onChange={(e) => handleMedChange(idx, 'medication_name', e.target.value)}
                        placeholder="e.g. Paracetamol 500mg, Amoxicillin 500mg"
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-800 text-xs focus:border-teal-500 focus:outline-hidden transition font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">
                        Dosage / Form
                      </label>
                      <input
                        type="text"
                        value={med.dosage}
                        onChange={(e) => handleMedChange(idx, 'dosage', e.target.value)}
                        placeholder="e.g. 1 tablet, 10 ml"
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-800 text-xs focus:border-teal-500 focus:outline-hidden transition"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">
                        Frequency
                      </label>
                      <input
                        type="text"
                        value={med.frequency}
                        onChange={(e) => handleMedChange(idx, 'frequency', e.target.value)}
                        placeholder="e.g. Twice daily, Once daily"
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-800 text-xs focus:border-teal-500 focus:outline-hidden transition"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">
                        Duration
                      </label>
                      <input
                        type="text"
                        value={med.duration}
                        onChange={(e) => handleMedChange(idx, 'duration', e.target.value)}
                        placeholder="e.g. 5 days, 1 month, Ongoing"
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-800 text-xs focus:border-teal-500 focus:outline-hidden transition"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">
                        Instructions
                      </label>
                      <input
                        type="text"
                        value={med.instructions || ''}
                        onChange={(e) => handleMedChange(idx, 'instructions', e.target.value)}
                        placeholder="e.g. After food with water"
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-800 text-xs focus:border-teal-500 focus:outline-hidden transition"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              Prescription Notes & Clinical Advice
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional doctor instructions, precautions, dietary restrictions..."
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:border-teal-500 focus:outline-hidden transition"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <span className="text-[11px] text-slate-400 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-teal-600" />
              <span>Will be marked as <strong>Manually Added</strong></span>
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl transition shadow-sm disabled:opacity-60 flex items-center gap-1.5"
              >
                {loading ? 'Saving Prescription...' : 'Save Prescription'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
