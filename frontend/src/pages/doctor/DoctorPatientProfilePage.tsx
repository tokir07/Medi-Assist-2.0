import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doctorService } from '../../services/doctorService';
import type { DoctorPatientDetail } from '../../services/doctorService';
import {
  User,
  Activity,
  FileText,
  Pill,
  Calendar,
  MessageSquare,
  Bell,
  ShieldAlert,
  ArrowLeft,
  Eye,
  Download,
  X,
  CheckCircle2,
  Phone,
  Mail,
  Loader2,
  Clock,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';

export const DoctorPatientProfilePage: React.FC = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();

  const [detail, setDetail] = useState<DoctorPatientDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>('Overview');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Document Viewer Modal State
  const [selectedReport, setSelectedReport] = useState<any | null>(null);

  // Reminder Modal State
  const [showReminderModal, setShowReminderModal] = useState<boolean>(false);
  const [reminderType, setReminderType] = useState<string>('Report');
  const [reminderTitle, setReminderTitle] = useState<string>('Upload CBC Report');
  const [reminderNote, setReminderNote] = useState<string>(
    'Please remember to upload your latest blood report before your next consultation.'
  );

  useEffect(() => {
    fetchPatientDetail();
  }, [patientId]);

  const fetchPatientDetail = async () => {
    setLoading(true);
    try {
      const res = await doctorService.getPatientDetail(patientId || 'pat-demo-1');
      setDetail(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSendReminderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!detail) return;
    try {
      await doctorService.sendPatientReminder({
        patient_id: detail.patient_info.id,
        reminder_type: reminderType,
        title: reminderTitle,
        message: reminderNote,
      });
      showToast('Reminder sent to patient portal feed!');
      setShowReminderModal(false);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
        <span className="text-xs font-medium text-slate-500">Loading patient medical profile...</span>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 space-y-3">
        <User className="w-10 h-10 text-slate-300 mx-auto" />
        <h3 className="text-base font-bold text-slate-800">Patient Profile Not Found</h3>
        <button
          type="button"
          onClick={() => navigate('/doctor/patients')}
          className="px-4 py-2 bg-teal-600 text-white rounded-xl font-bold text-xs cursor-pointer"
        >
          Return to Patients Directory
        </button>
      </div>
    );
  }

  const { patient_info, current_medications, medical_history, reports, prescriptions, appointments, emergency_contact, ai_health_summary } = detail;

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-teal-800 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 text-sm font-semibold animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-5 h-5 text-teal-300 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Back Button */}
      <button
        type="button"
        onClick={() => navigate('/doctor/patients')}
        className="flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Patients Directory</span>
      </button>

      {/* Patient Header Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-2xl bg-teal-600 text-white font-black text-2xl flex items-center justify-center shadow-md shrink-0">
            {patient_info.name.charAt(0)}
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-slate-900">{patient_info.name}</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-50 text-teal-700 border border-teal-200">
                Blood Group: {patient_info.blood_group || 'O+'}
              </span>
            </div>

            <p className="text-xs text-slate-500 font-medium">
              {patient_info.age} yrs • {patient_info.gender} • ID: {patient_info.id.slice(0, 8).toUpperCase()}
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-slate-600">
              {patient_info.phone && (
                <span className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  {patient_info.phone}
                </span>
              )}
              {patient_info.email && (
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  {patient_info.email}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions Bar */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => navigate(`/doctor/consultation/app-demo-${patient_info.id}`)}
            className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-2xs transition-all cursor-pointer"
          >
            Start Consultation
          </button>
          <button
            type="button"
            onClick={() => navigate('/doctor/prescriptions')}
            className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
          >
            + Prescription
          </button>
          <button
            type="button"
            onClick={() => setShowReminderModal(true)}
            className="px-3.5 py-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Bell className="w-3.5 h-3.5 text-purple-600" />
            <span>Send Reminder</span>
          </button>
        </div>
      </div>

      {/* Clinical Allergy & Risk Banner */}
      <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
          <div>
            <span className="font-bold text-amber-900">Clinical Alerts & Intolerances: </span>
            <span className="text-amber-800 font-semibold">Allergies: {patient_info.allergies || 'None'}</span>
            <span className="mx-2 text-amber-400">•</span>
            <span className="text-amber-800 font-semibold">Chronic Conditions: {patient_info.conditions || 'None'}</span>
          </div>
        </div>
      </div>

      {/* Profile Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-1 custom-scrollbar">
        {['Overview', 'Medical History', 'Reports', 'Prescriptions', 'AI Health Summary', 'Appointments'].map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeTab === tab
                ? 'bg-teal-600 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            {tab === 'AI Health Summary' && <Sparkles className="w-3.5 h-3.5 text-amber-300" />}
            <span>{tab}</span>
          </button>
        ))}
      </div>

      {/* Tab Contents */}
      {activeTab === 'Overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Active Medications Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-3">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Pill className="w-5 h-5 text-teal-600" />
                <span>Active Medication Schedule</span>
              </h2>

              {current_medications.length === 0 ? (
                <p className="text-xs text-slate-500 italic">No active prescriptions currently on record.</p>
              ) : (
                <div className="space-y-2">
                  {current_medications.map((med, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs font-semibold text-slate-800 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-teal-500 shrink-0" />
                      <span>{med}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* AI Health Summary Card preview */}
            {ai_health_summary && (
              <div className="bg-white rounded-2xl border border-amber-200 p-6 shadow-xs space-y-3 bg-gradient-to-br from-amber-50/40 to-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-500" />
                    <h2 className="text-base font-bold text-slate-900">{ai_health_summary.title}</h2>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                    AI-Generated Health Summary
                  </span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed font-medium">
                  {ai_health_summary.summary}
                </p>
                <p className="text-[10px] text-amber-700 italic border-t border-amber-200/60 pt-2">
                  ⚠️ {ai_health_summary.disclaimer}
                </p>
              </div>
            )}
          </div>

          {/* Sidebar Info */}
          <div className="space-y-6">
            {/* Emergency Contact */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-3">
              <h2 className="text-base font-bold text-slate-900">Emergency Contact</h2>
              {emergency_contact ? (
                <div className="space-y-1 text-xs">
                  <div className="font-bold text-slate-900">{emergency_contact.name}</div>
                  <div className="text-slate-500">Relationship: {emergency_contact.relationship}</div>
                  <div className="text-teal-700 font-semibold">{emergency_contact.phone}</div>
                </div>
              ) : (
                <p className="text-xs text-slate-500">No emergency contact provided.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* AI Health Summary Dedicated Tab */}
      {activeTab === 'AI Health Summary' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <span>AI-Generated Health Summary & Patient Guide</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Automated clinical synthesis generated from patient interactions and uploaded records.
              </p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
              Generated by MediAssist AI
            </span>
          </div>

          {ai_health_summary ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <h3 className="font-bold text-sm text-slate-900">{ai_health_summary.title}</h3>
                <p className="text-xs text-slate-700 leading-relaxed font-medium whitespace-pre-line">
                  {ai_health_summary.summary}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="leading-snug">
                  <strong>Clinical Notice:</strong> {ai_health_summary.disclaimer}
                </p>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-slate-500 space-y-2">
              <Sparkles className="w-8 h-8 text-slate-300 mx-auto" />
              <p>No AI health summary is currently available for this patient.</p>
            </div>
          )}
        </div>
      )}

      {/* Reports Tab */}
      {activeTab === 'Reports' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-slate-900">Uploaded Medical & Diagnostic Reports</h2>

          {reports.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">No medical reports are available for this patient.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reports.map((rep) => (
                <div key={rep.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900">{rep.title}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200">
                      {rep.category}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 line-clamp-2">{rep.summary}</p>
                  <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                    <span className="text-[10px] text-slate-400">{rep.date}</span>
                    <button
                      type="button"
                      onClick={() => setSelectedReport(rep)}
                      className="px-3 py-1 rounded-lg bg-teal-600 text-white text-xs font-bold hover:bg-teal-700 transition cursor-pointer flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View Document</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Prescriptions Tab */}
      {activeTab === 'Prescriptions' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-slate-900">Prescription History</h2>
          {prescriptions.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">No prescriptions have been created yet.</div>
          ) : (
            <div className="space-y-3">
              {prescriptions.map((rx) => (
                <div key={rx.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{rx.diagnosis}</span>
                    <span className="text-slate-400">{rx.date}</span>
                  </div>
                  <div className="text-slate-600">Issued by: {rx.doctor_name} ({rx.type})</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Appointments Tab */}
      {activeTab === 'Appointments' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-slate-900">Appointment History</h2>
          {appointments.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">No appointments scheduled yet.</div>
          ) : (
            <div className="space-y-3">
              {appointments.map((app) => (
                <div key={app.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{app.date} • {app.time}</span>
                    <span className="font-bold text-teal-700 px-2.5 py-0.5 rounded-full bg-teal-50 border border-teal-200">
                      {app.status}
                    </span>
                  </div>
                  <div className="text-slate-600">{app.type} — {app.reason}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Document Viewer Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150 overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-bold text-base text-slate-900">{selectedReport.title}</h3>
                <p className="text-xs text-slate-500">{selectedReport.category} • Uploaded {selectedReport.date}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReport(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 p-6 overflow-y-auto space-y-4">
              <img
                src={selectedReport.file_url}
                alt={selectedReport.title}
                className="w-full h-auto max-h-[50vh] object-contain rounded-2xl border border-slate-200 bg-slate-100"
              />
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <span className="font-bold text-slate-800 block mb-1">Clinical Interpretation Summary</span>
                <p className="text-slate-600 leading-relaxed">{selectedReport.summary}</p>
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedReport(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-bold text-xs cursor-pointer"
              >
                Close Viewer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Send Patient Reminder Modal */}
      {showReminderModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <Bell className="w-5 h-5 text-purple-600" />
                <span>Send Reminder to Patient</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowReminderModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSendReminderSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Reminder Category</label>
                <select
                  value={reminderType}
                  onChange={(e) => setReminderType(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none"
                >
                  <option value="Report">Report Upload Reminder</option>
                  <option value="Medicine">Medicine Intake Reminder</option>
                  <option value="Follow-up">Follow-Up Visit Reminder</option>
                  <option value="Appointment">Appointment Reminder</option>
                  <option value="Custom">Custom Reminder</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Reminder Title</label>
                <input
                  type="text"
                  required
                  value={reminderTitle}
                  onChange={(e) => setReminderTitle(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Message for Patient</label>
                <textarea
                  rows={3}
                  required
                  value={reminderNote}
                  onChange={(e) => setReminderNote(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowReminderModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold cursor-pointer shadow-2xs"
                >
                  Send Reminder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
