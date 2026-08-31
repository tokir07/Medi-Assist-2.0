import React, { useEffect, useState } from 'react';
import { doctorService } from '../../services/doctorService';
import type { PrescriptionTemplate } from '../../services/doctorService';
import {
  Pill,
  Plus,
  Trash2,
  Upload,
  CheckCircle2,
  FileText,
  Eye,
  X,
  Search,
  Download,
  Sparkles,
  Zap,
} from 'lucide-react';

export const DoctorPrescriptionsPage: React.FC = () => {
  const [activeMode, setActiveMode] = useState<'Digital' | 'Upload'>('Digital');
  const [patientId, setPatientId] = useState<string>('pat-demo-1');
  const [diagnosis, setDiagnosis] = useState<string>('Viral Fever');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [templates, setTemplates] = useState<PrescriptionTemplate[]>([]);

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
    {
      medicine_name: 'Cetirizine',
      dosage: '10 mg',
      frequency: 'Once Daily',
      duration: '5 Days',
      instructions: 'At bedtime',
    },
  ]);

  const [uploadedUrl, setUploadedUrl] = useState<string>(
    'https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&q=80&w=800'
  );

  const [history] = useState([
    {
      id: 'rx-hist-1',
      patient_name: 'Rahul Sharma',
      date: '31 Aug 2026',
      diagnosis: 'Viral Fever',
      type: 'Digital',
      medicines_summary: 'Paracetamol 500mg, Cetirizine 10mg',
    },
    {
      id: 'rx-hist-2',
      patient_name: 'Priya Singh',
      date: '25 Aug 2026',
      diagnosis: 'Seasonal Allergy',
      type: 'Uploaded Document',
      medicines_summary: 'Scanned Prescription PDF',
    },
    {
      id: 'rx-hist-3',
      patient_name: 'Amit Kumar',
      date: '21 Aug 2026',
      diagnosis: 'Type 2 Diabetes',
      type: 'Digital',
      medicines_summary: 'Metformin 500mg, Glimepiride 1mg',
    },
  ]);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const res = await doctorService.getPrescriptionTemplates();
      setTemplates(res || []);
    } catch (err) {
      console.error(err);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleApplyTemplate = (tmpl: PrescriptionTemplate) => {
    setDiagnosis(tmpl.diagnosis);
    setMedicines(
      tmpl.medicines.map((m) => ({
        medicine_name: m.medicine_name,
        dosage: m.dosage,
        frequency: m.frequency,
        duration: m.duration,
        instructions: m.instructions || 'After meals',
      }))
    );
    showToast(`Applied prescription template: ${tmpl.title}`);
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

  const handleSavePrescription = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (activeMode === 'Digital') {
        await doctorService.createDigitalPrescription({
          patient_id: patientId,
          diagnosis: diagnosis,
          medicines: medicines.filter((m) => m.medicine_name.trim()),
        });
      } else {
        await doctorService.createImagePrescription({
          patient_id: patientId,
          diagnosis: diagnosis,
          image_url: uploadedUrl,
          file_name: 'Prescription_Handwritten.pdf',
        });
      }
      showToast('Prescription saved and patient notified!');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-teal-800 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 text-sm font-semibold animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-5 h-5 text-teal-300 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Pill className="w-6 h-6 text-purple-600" />
            <span>Prescription Builder & Templates</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Create itemized digital prescriptions, apply pre-built clinical templates, or upload prescription PDFs.
          </p>
        </div>

        {/* Mode Switcher Buttons */}
        <div className="flex bg-slate-100 p-1 rounded-xl shrink-0">
          <button
            type="button"
            onClick={() => setActiveMode('Digital')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeMode === 'Digital' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
            }`}
          >
            Digital Prescription
          </button>
          <button
            type="button"
            onClick={() => setActiveMode('Upload')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeMode === 'Upload' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
            }`}
          >
            Upload Prescription Image/PDF
          </button>
        </div>
      </div>

      {/* Clinical Templates Bar */}
      {activeMode === 'Digital' && templates.length > 0 && (
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">Quick Clinical Templates</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {templates.map((tmpl) => (
              <button
                key={tmpl.id}
                type="button"
                onClick={() => handleApplyTemplate(tmpl)}
                className="px-3.5 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-800 text-xs font-bold transition-all cursor-pointer shadow-2xs flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                <span>{tmpl.title}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Prescription Form */}
      <form onSubmit={handleSavePrescription} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Select Patient</label>
            <select
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none"
            >
              <option value="pat-demo-1">Rahul Sharma (24 yrs, Male)</option>
              <option value="pat-demo-2">Priya Singh (31 yrs, Female)</option>
              <option value="pat-demo-3">Amit Kumar (42 yrs, Male)</option>
              <option value="pat-demo-4">Neha Gupta (29 yrs, Female)</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Diagnosis</label>
            <input
              type="text"
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none"
            />
          </div>
        </div>

        {activeMode === 'Digital' ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-xs font-bold text-slate-900">Medications List</span>
              <button
                type="button"
                onClick={handleAddMedicine}
                className="text-xs font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add Medicine</span>
              </button>
            </div>

            {medicines.map((med, idx) => (
              <div key={idx} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">Medicine #{idx + 1}</span>
                  {medicines.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveMedicine(idx)}
                      className="text-rose-600 hover:text-rose-700 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
                  <input
                    type="text"
                    placeholder="Medicine Name"
                    value={med.medicine_name}
                    onChange={(e) => handleUpdateMed(idx, 'medicine_name', e.target.value)}
                    className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Dosage (500mg)"
                    value={med.dosage}
                    onChange={(e) => handleUpdateMed(idx, 'dosage', e.target.value)}
                    className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Frequency"
                    value={med.frequency}
                    onChange={(e) => handleUpdateMed(idx, 'frequency', e.target.value)}
                    className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Duration"
                    value={med.duration}
                    onChange={(e) => handleUpdateMed(idx, 'duration', e.target.value)}
                    className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Instructions"
                    value={med.instructions}
                    onChange={(e) => handleUpdateMed(idx, 'instructions', e.target.value)}
                    className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none"
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl text-center space-y-3">
            <Upload className="w-8 h-8 text-slate-400 mx-auto" />
            <h3 className="text-sm font-bold text-slate-800">Upload Handwritten or Scanned Prescription</h3>
            <p className="text-xs text-slate-500">Supported Formats: JPG, PNG, PDF</p>
            <input
              type="text"
              value={uploadedUrl}
              onChange={(e) => setUploadedUrl(e.target.value)}
              placeholder="Document URL..."
              className="max-w-md w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900"
            />
          </div>
        )}

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-2xs transition-all cursor-pointer"
          >
            Save & Dispatch Prescription
          </button>
        </div>
      </form>

      {/* Prescription History Table */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-slate-900">Recent Prescriptions History</h2>
        <div className="divide-y divide-slate-100">
          {history.map((h) => (
            <div key={h.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-bold text-slate-900">{h.patient_name}</h4>
                <p className="text-xs text-slate-500">
                  {h.date} • {h.diagnosis} ({h.type})
                </p>
                <p className="text-xs text-slate-700 font-medium mt-0.5">{h.medicines_summary}</p>
              </div>

              <button
                type="button"
                onClick={() => alert(`Viewing prescription ${h.id}`)}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer shrink-0 self-end sm:self-center"
              >
                View Details
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
