import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doctorService } from '../../services/doctorService';
import {
  UserCheck,
  ShieldAlert,
  Activity,
  FileText,
  Pill,
  CheckCircle2,
  ArrowLeft,
  Video,
  Plus,
  Trash2,
  X,
  Upload,
  Loader2,
} from 'lucide-react';

export const DoctorConsultationPage: React.FC = () => {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const navigate = useNavigate();

  const [patientName, setPatientName] = useState<string>('Rahul Sharma');
  const [patientAge, setPatientAge] = useState<number>(24);
  const [patientGender, setPatientGender] = useState<string>('Male');
  const [allergies, setAllergies] = useState<string>('Penicillin');
  const [conditions, setConditions] = useState<string>('Asthma');

  const [chiefComplaint, setChiefComplaint] = useState<string>('Fever and acute headache for 2 days');
  const [clinicalNotes, setClinicalNotes] = useState<string>(
    'Patient presents with low-grade fever (100.8°F), mild congestion, and headache. Vitals normal (BP 120/80, Pulse 76, SpO2 98%). Chest clear to auscultation.'
  );
  const [diagnosis, setDiagnosis] = useState<string>('Viral Fever & Upper Respiratory Tract Infection');
  const [advice, setAdvice] = useState<string>('Adequate rest, hydration (2-3L water daily), light warm meals.');
  const [followUpDays, setFollowUpDays] = useState<number>(7);

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Prescription Modal State inside consultation
  const [showRxModal, setShowRxModal] = useState<boolean>(false);
  const [rxMode, setRxMode] = useState<'Digital' | 'Upload'>('Digital');
  const [rxDiagnosis, setRxDiagnosis] = useState<string>('Viral Fever');
  const [medicines, setMedicines] = useState<
    Array<{ medicine_name: string; dosage: string; frequency: string; duration: string; instructions: string }>
  >([
    {
      medicine_name: 'Paracetamol',
      dosage: '500 mg',
      frequency: 'Twice Daily',
      duration: '3 Days',
      instructions: 'After meals',
    },
  ]);
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string>(
    'https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&q=80&w=800'
  );

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleAddMedicine = () => {
    setMedicines([
      ...medicines,
      {
        medicine_name: '',
        dosage: '500 mg',
        frequency: 'Twice Daily',
        duration: '5 Days',
        instructions: 'After meals',
      },
    ]);
  };

  const handleRemoveMedicine = (index: number) => {
    setMedicines(medicines.filter((_, i) => i !== index));
  };

  const handleUpdateMed = (index: number, key: string, val: string) => {
    const copy = [...medicines];
    (copy[index] as any)[key] = val;
    setMedicines(copy);
  };

  const handleSavePrescription = async () => {
    try {
      if (rxMode === 'Digital') {
        await doctorService.createDigitalPrescription({
          patient_id: 'pat-demo-1',
          appointment_id: appointmentId,
          diagnosis: rxDiagnosis || diagnosis,
          medicines: medicines.filter((m) => m.medicine_name.trim()),
          additional_notes: 'Created during active consultation session.',
        });
      } else {
        await doctorService.createImagePrescription({
          patient_id: 'pat-demo-1',
          appointment_id: appointmentId,
          diagnosis: rxDiagnosis || diagnosis,
          image_url: uploadedFileUrl,
          file_name: 'Prescription_Document.pdf',
        });
      }
      showToast('Prescription attached to consultation!');
      setShowRxModal(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCompleteConsultation = async () => {
    setSubmitting(true);
    try {
      await doctorService.submitConsultation({
        appointment_id: appointmentId || 'app-demo-1',
        patient_id: 'pat-demo-1',
        chief_complaint: chiefComplaint,
        clinical_notes: clinicalNotes,
        diagnosis: diagnosis,
        advice: advice,
        follow_up_days: followUpDays,
      });

      showToast('Consultation completed and saved!');
      setTimeout(() => navigate('/doctor/appointments'), 1500);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Banner */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-teal-800 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 text-sm font-semibold animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-5 h-5 text-teal-300 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/doctor/appointments')}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-teal-600" />
              <span>Consultation Workspace</span>
            </h1>
            <p className="text-xs text-slate-500">Active Visit Session • ID: {appointmentId || 'app-demo-1'}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowRxModal(true)}
            className="px-4 py-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
          >
            <Pill className="w-4 h-4 text-purple-600" />
            <span>+ Create Prescription</span>
          </button>

          <button
            type="button"
            onClick={handleCompleteConsultation}
            disabled={submitting}
            className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-2 shadow-2xs transition-all cursor-pointer disabled:opacity-50"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            <span>Complete Visit</span>
          </button>
        </div>
      </div>

      {/* Patient Summary Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-teal-50 text-teal-700 border border-teal-200 flex items-center justify-center font-bold text-lg">
            {patientName.split(' ').map((n) => n[0]).join('')}
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">{patientName}</h2>
            <p className="text-xs text-slate-500 font-medium">
              {patientAge} yrs • {patientGender} • Blood Group: <span className="font-bold text-slate-700">B+</span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs">
          <span className="p-2 rounded-xl bg-rose-50 text-rose-800 border border-rose-100 font-semibold flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
            <span>Allergies: {allergies}</span>
          </span>

          <span className="p-2 rounded-xl bg-slate-50 text-slate-800 border border-slate-200 font-semibold flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-teal-600" />
            <span>Condition: {conditions}</span>
          </span>
        </div>
      </div>

      {/* Main Workspace Form */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1">Chief Complaint</label>
          <input
            type="text"
            value={chiefComplaint}
            onChange={(e) => setChiefComplaint(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:border-teal-500"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1">Clinical Consultation Notes</label>
          <textarea
            rows={4}
            value={clinicalNotes}
            onChange={(e) => setClinicalNotes(e.target.value)}
            className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 leading-relaxed focus:outline-none focus:border-teal-500"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Diagnosis</label>
            <input
              type="text"
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:border-teal-500"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Follow-up Recommendation (Days)</label>
            <input
              type="number"
              value={followUpDays}
              onChange={(e) => setFollowUpDays(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:border-teal-500"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1">Clinical Advice & Patient Instructions</label>
          <textarea
            rows={3}
            value={advice}
            onChange={(e) => setAdvice(e.target.value)}
            className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 leading-relaxed focus:outline-none focus:border-teal-500"
          />
        </div>
      </div>

      {/* Prescription Modal inside Workspace */}
      {showRxModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 space-y-4 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <Pill className="w-5 h-5 text-purple-600" />
                <span>Create Prescription</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowRxModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mode Switcher */}
            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setRxMode('Digital')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  rxMode === 'Digital' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                }`}
              >
                Digital Prescription
              </button>
              <button
                type="button"
                onClick={() => setRxMode('Upload')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  rxMode === 'Upload' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                }`}
              >
                Upload Image / PDF
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Diagnosis</label>
                <input
                  type="text"
                  value={rxDiagnosis}
                  onChange={(e) => setRxDiagnosis(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none"
                />
              </div>

              {rxMode === 'Digital' ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">Medications List</span>
                    <button
                      type="button"
                      onClick={handleAddMedicine}
                      className="text-xs font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Medicine</span>
                    </button>
                  </div>

                  {medicines.map((med, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-500 uppercase">Medicine #{idx + 1}</span>
                        {medicines.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveMedicine(idx)}
                            className="text-rose-500 hover:text-rose-700 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="Medicine Name (e.g. Paracetamol)"
                          value={med.medicine_name}
                          onChange={(e) => handleUpdateMed(idx, 'medicine_name', e.target.value)}
                          className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none"
                        />
                        <input
                          type="text"
                          placeholder="Dosage (e.g. 500 mg)"
                          value={med.dosage}
                          onChange={(e) => handleUpdateMed(idx, 'dosage', e.target.value)}
                          className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none"
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <input
                          type="text"
                          placeholder="Frequency"
                          value={med.frequency}
                          onChange={(e) => handleUpdateMed(idx, 'frequency', e.target.value)}
                          className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none"
                        />
                        <input
                          type="text"
                          placeholder="Duration"
                          value={med.duration}
                          onChange={(e) => handleUpdateMed(idx, 'duration', e.target.value)}
                          className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none"
                        />
                        <input
                          type="text"
                          placeholder="Instructions"
                          value={med.instructions}
                          onChange={(e) => handleUpdateMed(idx, 'instructions', e.target.value)}
                          className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl text-center space-y-3">
                  <Upload className="w-8 h-8 text-slate-400 mx-auto" />
                  <span className="block text-xs font-bold text-slate-700">Drag & drop prescription file or choose URL</span>
                  <input
                    type="text"
                    value={uploadedFileUrl}
                    onChange={(e) => setUploadedFileUrl(e.target.value)}
                    placeholder="Document image URL..."
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowRxModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSavePrescription}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold cursor-pointer shadow-2xs"
              >
                Save Prescription
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
