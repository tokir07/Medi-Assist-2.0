import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  Calendar,
  User,
  Building,
  Sparkles,
  Mic,
  Bell,
  Download,
  Share2,
  FileText,
  CheckCircle2,
  ShieldCheck,
  ExternalLink,
  Pill,
  Clock,
  Edit2,
  Check,
  Plus,
  Trash2,
  AlertCircle,
} from 'lucide-react';
import type { PrescriptionItem, PrescriptionMedication } from '../../types/prescriptions';
import { prescriptionsService } from '../../services/prescriptionsService';

interface PrescriptionDetailsDrawerProps {
  prescription: PrescriptionItem | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenRecord?: (recordId: string) => void;
  onDownload: (p: PrescriptionItem) => void;
  onShare: (p: PrescriptionItem) => void;
  onSetReminder: (p: PrescriptionItem, medName?: string, dosage?: string) => void;
  onRequestRefill: (p: PrescriptionItem) => void;
  onUpdated?: (updated: PrescriptionItem) => void;
}

export const PrescriptionDetailsDrawer: React.FC<PrescriptionDetailsDrawerProps> = ({
  prescription,
  isOpen,
  onClose,
  onOpenRecord,
  onDownload,
  onShare,
  onSetReminder,
  onRequestRefill,
  onUpdated,
}) => {
  const navigate = useNavigate();
  const [currentPrescription, setCurrentPrescription] = useState<PrescriptionItem | null>(prescription);
  const [isEditing, setIsEditing] = useState(false);
  const [editMeds, setEditMeds] = useState<PrescriptionMedication[]>([]);
  const [editNotes, setEditNotes] = useState('');
  const [editDiagnosis, setEditDiagnosis] = useState('');
  const [editDoctor, setEditDoctor] = useState('');
  const [editHospital, setEditHospital] = useState('');
  const [saving, setSaving] = useState(false);
  const [approving, setApproving] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync state when prescription changes
  React.useEffect(() => {
    setCurrentPrescription(prescription);
    if (prescription) {
      setEditMeds(
        prescription.medications && prescription.medications.length > 0
          ? prescription.medications
          : [
              {
                id: '1',
                medication_name: prescription.medication_name,
                dosage: prescription.dosage,
                frequency: prescription.frequency,
                duration: prescription.duration,
                instructions: prescription.instructions,
              },
            ]
      );
      setEditNotes(prescription.notes || '');
      setEditDiagnosis(prescription.diagnosis_or_indication || '');
      setEditDoctor(prescription.doctor_name || '');
      setEditHospital(prescription.hospital || '');
      setIsEditing(false);
    }
  }, [prescription]);

  if (!isOpen || !currentPrescription) return null;

  const handleAskAI = () => {
    const medNames = (currentPrescription.medications || [])
      .map((m) => m.medication_name)
      .join(', ') || currentPrescription.medication_name;
    navigate('/patient/consultation', {
      state: {
        initialPrompt: `Can you explain the usage, common interactions, and dietary precautions for my prescribed medications: ${medNames}?`,
      },
    });
  };

  const handleAskVoice = () => {
    navigate('/patient/voice');
  };

  const handleApprove = async () => {
    try {
      setApproving(true);
      setError(null);
      const res = await prescriptionsService.approvePrescription(currentPrescription.id);
      setCurrentPrescription(res);
      if (onUpdated) onUpdated(res);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to approve prescription.');
    } finally {
      setApproving(false);
    }
  };

  const handleMarkClinicianReviewed = async () => {
    try {
      setReviewing(true);
      setError(null);
      const res = await prescriptionsService.markClinicianReviewed(
        currentPrescription.id,
        'Verified in clinical consultation'
      );
      setCurrentPrescription(res);
      if (onUpdated) onUpdated(res);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to update clinician verification status.');
    } finally {
      setReviewing(false);
    }
  };

  const handleSaveEdit = async () => {
    try {
      setSaving(true);
      setError(null);
      const res = await prescriptionsService.editPrescription(currentPrescription.id, {
        medications: editMeds,
        notes: editNotes,
        diagnosis_or_indication: editDiagnosis,
        doctor_name: editDoctor,
        hospital: editHospital,
      });
      setCurrentPrescription(res);
      setIsEditing(false);
      if (onUpdated) onUpdated(res);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to save changes.');
    } finally {
      setSaving(false);
    }
  };

  const isApproved = currentPrescription.approval_status === 'APPROVED';
  const isClinicianReviewed = currentPrescription.clinician_review_status === 'CLINICIAN_REVIEWED';

  const meds = currentPrescription.medications && currentPrescription.medications.length > 0
    ? currentPrescription.medications
    : [
        {
          id: '1',
          medication_name: currentPrescription.medication_name,
          dosage: currentPrescription.dosage,
          frequency: currentPrescription.frequency,
          duration: currentPrescription.duration,
          instructions: currentPrescription.instructions,
        },
      ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/50 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl border border-slate-200 w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-teal-50 text-teal-700 border border-teal-200 flex items-center justify-center font-bold text-base shrink-0 shadow-2xs">
              <Pill className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 truncate">
                  {currentPrescription.title || `Prescription - ${currentPrescription.doctor_name}`}
                </h3>
                <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
                  {currentPrescription.status}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium truncate mt-0.5">
                {currentPrescription.doctor_name} ({currentPrescription.doctor_specialty || 'Physician'}) •{' '}
                {currentPrescription.hospital}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => onDownload(currentPrescription)}
              className="p-2 rounded-xl text-slate-400 hover:text-teal-700 hover:bg-slate-100 transition"
              title="Download Document"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onShare(currentPrescription)}
              className="p-2 rounded-xl text-slate-400 hover:text-teal-700 hover:bg-slate-100 transition"
              title="Share Prescription"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1 custom-scrollbar text-xs">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Verification Badges & Provenance */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80">
            {/* Patient Approval */}
            <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200/60 shadow-2xs">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Patient Approval</p>
                <p className="font-bold text-slate-800 text-xs mt-0.5">
                  {isApproved ? 'Approved' : 'Review Required'}
                </p>
              </div>
              {!isApproved ? (
                <button
                  type="button"
                  onClick={handleApprove}
                  disabled={approving}
                  className="px-2.5 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-bold text-[10px] transition disabled:opacity-60"
                >
                  {approving ? '...' : 'Approve'}
                </button>
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              )}
            </div>

            {/* Clinician Review */}
            <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200/60 shadow-2xs">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Clinician Verification</p>
                <p className="font-bold text-slate-800 text-xs mt-0.5">
                  {isClinicianReviewed ? 'Clinician Verified' : 'Not Reviewed'}
                </p>
              </div>
              {!isClinicianReviewed ? (
                <button
                  type="button"
                  onClick={handleMarkClinicianReviewed}
                  disabled={reviewing}
                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-[10px] transition disabled:opacity-60"
                >
                  {reviewing ? '...' : 'Mark Verified'}
                </button>
              ) : (
                <ShieldCheck className="w-4 h-4 text-teal-600" />
              )}
            </div>

            {/* Provenance */}
            <div className="p-2.5 bg-white rounded-xl border border-slate-200/60 shadow-2xs">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Provenance</p>
              <p className="font-bold text-slate-800 text-xs mt-0.5 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-teal-600" />
                <span>{currentPrescription.provenance || 'AI_EXTRACTED'}</span>
              </p>
            </div>
          </div>

          {/* Source Traceability: Linked Document & Linked Appointment */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Source Record */}
            <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  <span>Source Medical Record</span>
                </span>
              </div>
              {currentPrescription.record_id ? (
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-bold text-slate-800 text-xs truncate">
                      {currentPrescription.source_record_title || 'Prescription PDF'}
                    </p>
                    <p className="text-[11px] text-slate-400 truncate">
                      Session: {currentPrescription.session_name || 'General Records'}
                    </p>
                  </div>
                  {onOpenRecord && (
                    <button
                      type="button"
                      onClick={() => onOpenRecord(currentPrescription.record_id!)}
                      className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold text-xs transition flex items-center gap-1 shadow-2xs shrink-0"
                    >
                      <span>Open Record</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ) : (
                <p className="text-slate-400 text-xs italic">Manually added directly (No linked document)</p>
              )}
            </div>

            {/* Linked Appointment */}
            <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Consultation Link</span>
              </span>
              {currentPrescription.appointment_title ? (
                <div>
                  <p className="font-bold text-slate-800 text-xs truncate">
                    {currentPrescription.appointment_title}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {currentPrescription.appointment_date || currentPrescription.prescribed_date}
                  </p>
                </div>
              ) : (
                <p className="text-slate-400 text-xs italic">Direct prescription entry</p>
              )}
            </div>
          </div>

          {/* Prescribed Medications Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Pill className="w-4 h-4 text-teal-600" />
                <span>Prescribed Medications ({meds.length})</span>
              </h4>

              <button
                type="button"
                onClick={() => setIsEditing(!isEditing)}
                className="px-2.5 py-1 text-slate-600 hover:text-teal-700 hover:bg-slate-100 rounded-lg font-semibold text-xs transition flex items-center gap-1"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>{isEditing ? 'Cancel Edit' : 'Edit Medications'}</span>
              </button>
            </div>

            {/* List of Medications */}
            <div className="space-y-3">
              {meds.map((med, idx) => (
                <div
                  key={med.id || idx}
                  className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:border-teal-400/60 transition space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-teal-50 text-teal-700 font-bold text-[11px] flex items-center justify-center border border-teal-100">
                          {idx + 1}
                        </span>
                        <h5 className="font-bold text-slate-900 text-sm">{med.medication_name}</h5>
                      </div>
                      {med.generic_name && (
                        <p className="text-[11px] text-slate-500 italic mt-0.5 ml-7">
                          Generic: {med.generic_name}
                        </p>
                      )}
                    </div>

                    {/* 1-Click Create Reminder */}
                    <button
                      type="button"
                      onClick={() => onSetReminder(currentPrescription, med.medication_name, med.dosage)}
                      className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 rounded-xl font-bold text-xs transition flex items-center gap-1.5 shrink-0 shadow-2xs"
                      title="Schedule dose reminder"
                    >
                      <Bell className="w-3.5 h-3.5" />
                      <span>Create Reminder</span>
                    </button>
                  </div>

                  {/* Medication Specs Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                    <div className="p-2 bg-slate-50 rounded-xl border border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Dosage</p>
                      <p className="font-semibold text-slate-800 text-xs mt-0.5">
                        {med.dosage || '1 tablet'}
                      </p>
                    </div>

                    <div className="p-2 bg-slate-50 rounded-xl border border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Frequency</p>
                      <p className="font-semibold text-slate-800 text-xs mt-0.5">
                        {med.frequency || 'Twice daily'}
                      </p>
                    </div>

                    <div className="p-2 bg-slate-50 rounded-xl border border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Duration</p>
                      <p className="font-semibold text-slate-800 text-xs mt-0.5">
                        {med.duration || '7 days'}
                      </p>
                    </div>

                    <div className="p-2 bg-slate-50 rounded-xl border border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Route</p>
                      <p className="font-semibold text-slate-800 text-xs mt-0.5">
                        {med.route || 'Oral'}
                      </p>
                    </div>
                  </div>

                  {/* Instructions */}
                  {med.instructions && (
                    <div className="p-2.5 bg-teal-50/40 rounded-xl border border-teal-100/60 text-slate-700 text-xs">
                      <span className="font-bold text-teal-800 mr-1">Instructions:</span>
                      <span>{med.instructions}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Notes & Clinical Instructions */}
          {currentPrescription.notes && (
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1.5">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Clinical Notes & Doctor's Advice
              </span>
              <p className="text-slate-700 text-xs leading-relaxed whitespace-pre-line">
                {currentPrescription.notes}
              </p>
            </div>
          )}

          {/* AI Assistant Quick Actions Banner */}
          <div className="p-4 bg-teal-50 border border-teal-200/80 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-white text-teal-700 rounded-xl border border-teal-200 shadow-2xs">
                <Sparkles className="w-5 h-5 text-teal-600" />
              </div>
              <div>
                <h5 className="font-bold text-teal-950 text-xs">Have questions about this medicine?</h5>
                <p className="text-[11px] text-teal-800">
                  Ask MediAssist AI about side effects, food interactions, or missed doses.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
              <button
                type="button"
                onClick={handleAskVoice}
                className="flex-1 sm:flex-none px-3 py-1.5 bg-white hover:bg-slate-50 text-teal-800 border border-teal-200 rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-2xs"
              >
                <Mic className="w-3.5 h-3.5 text-teal-600" />
                <span>Voice</span>
              </button>
              <button
                type="button"
                onClick={handleAskAI}
                className="flex-1 sm:flex-none px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-2xs"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Ask AI</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between text-xs shrink-0">
          <span className="text-slate-400">
            Prescribed on <strong>{currentPrescription.prescribed_date || 'Recent'}</strong>
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
