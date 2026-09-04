import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doctorService } from '../../services/doctorService';
import { chatService } from '../../services/chatService';
import type { DoctorPatientDetail } from '../../services/doctorService';
import { api } from '../../services/api';
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
  Mic,
  Bot,
  RotateCcw,
  FileSearch,
  Layers,
} from 'lucide-react';

export const DoctorPatientProfilePage: React.FC = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();

  const [detail, setDetail] = useState<DoctorPatientDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>('Overview');
  const [timelineFilter, setTimelineFilter] = useState<string>('All');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Document Viewer Modal State & Blob Preview
  const [selectedReport, setSelectedReport] = useState<any | null>(null);
  const [reportBlobUrl, setReportBlobUrl] = useState<string | null>(null);
  const [reportContentType, setReportContentType] = useState<string>('');
  const [reportTextContent, setReportTextContent] = useState<string | null>(null);
  const [loadingReportFile, setLoadingReportFile] = useState<boolean>(false);

  // AI Conversation Transcript Modal State
  const [selectedAIConvId, setSelectedAIConvId] = useState<string | null>(null);
  const [aiConvTranscript, setAIConvTranscript] = useState<any | null>(null);
  const [loadingAITranscript, setLoadingAITranscript] = useState<boolean>(false);

  // Voice Session Transcript Modal State
  const [selectedVoiceSessionId, setSelectedVoiceSessionId] = useState<string | null>(null);
  const [voiceSessionTranscript, setVoiceSessionTranscript] = useState<any | null>(null);
  const [loadingVoiceTranscript, setLoadingVoiceTranscript] = useState<boolean>(false);

  // Summary Refresh State
  const [generatingSummary, setGeneratingSummary] = useState<boolean>(false);

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

  useEffect(() => {
    if (!selectedReport) {
      setReportBlobUrl(null);
      setReportContentType('');
      setReportTextContent(null);
      return;
    }

    let active = true;
    let createdUrl: string | null = null;

    const fetchReportBlob = async () => {
      setLoadingReportFile(true);
      try {
        let endpoint = selectedReport.file_url || `/records/${selectedReport.id}/file`;
        if (endpoint.startsWith('/api')) {
          endpoint = endpoint.replace('/api', '');
        }

        const res = await api.get(endpoint, { responseType: 'blob' });
        if (active) {
          const rawType = (res.headers['content-type'] as string) || 'application/pdf';
          setReportContentType(rawType);

          if (rawType.includes('text/plain') || rawType.includes('text/html')) {
            const text = await res.data.text();
            setReportTextContent(text);
          } else {
            const blob = new Blob([res.data], { type: rawType });
            createdUrl = URL.createObjectURL(blob);
            setReportBlobUrl(createdUrl);
          }
        }
      } catch (err) {
        console.error('Failed to load report document blob:', err);
      } finally {
        if (active) setLoadingReportFile(false);
      }
    };

    fetchReportBlob();

    return () => {
      active = false;
      if (createdUrl) URL.revokeObjectURL(createdUrl);
    };
  }, [selectedReport]);

  useEffect(() => {
    if (!selectedAIConvId || !patientId) {
      setAIConvTranscript(null);
      return;
    }
    const fetchAITranscript = async () => {
      setLoadingAITranscript(true);
      try {
        const res = await doctorService.getAIConversationTranscript(patientId, selectedAIConvId);
        setAIConvTranscript(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingAITranscript(false);
      }
    };
    fetchAITranscript();
  }, [selectedAIConvId, patientId]);

  useEffect(() => {
    if (!selectedVoiceSessionId || !patientId) {
      setVoiceSessionTranscript(null);
      return;
    }
    const fetchVoiceTranscript = async () => {
      setLoadingVoiceTranscript(true);
      try {
        const res = await doctorService.getVoiceSessionTranscript(patientId, selectedVoiceSessionId);
        setVoiceSessionTranscript(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingVoiceTranscript(false);
      }
    };
    fetchVoiceTranscript();
  }, [selectedVoiceSessionId, patientId]);

  const handleGenerateConsolidatedSummary = async () => {
    if (!patientId) return;
    setGeneratingSummary(true);
    try {
      const res = await doctorService.generatePatientMedicalSummary(patientId);
      if (detail) {
        setDetail({
          ...detail,
          consolidated_summary: res,
        });
      }
      showToast('Consolidated Executive Summary updated successfully!');
    } catch (err) {
      console.error(err);
    } finally {
      setGeneratingSummary(false);
    }
  };

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

  const getAuthFileUrl = (url?: string) => {
    if (!url) return '';
    const token = localStorage.getItem('mediassist_token') || localStorage.getItem('token') || localStorage.getItem('auth_token');
    const separator = url.includes('?') ? '&' : '?';
    return token ? `${url}${separator}token=${token}` : url;
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
            onClick={async () => {
              try {
                await chatService.openConversation(undefined, patient_info.id);
                navigate('/doctor/messages');
              } catch (e) {
                navigate('/doctor/messages');
              }
            }}
            className="px-3.5 py-2.5 rounded-xl bg-teal-50 text-teal-800 border border-teal-200 text-xs font-bold transition-all cursor-pointer hover:bg-teal-100 flex items-center gap-1.5"
          >
            <MessageSquare className="w-3.5 h-3.5 text-teal-600" />
            <span>Message Patient</span>
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
            className="px-3.5 py-2.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Bell className="w-3.5 h-3.5 text-teal-600" />
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
        {[
          { name: 'Overview', icon: Activity },
          { name: 'Medical Timeline', icon: Layers },
          { name: 'AI Consultations', icon: Bot },
          { name: 'Voice Consultations', icon: Mic },
          { name: 'Reports', icon: FileSearch },
          { name: 'Prescriptions', icon: Pill },
          { name: 'Appointments', icon: Calendar },
        ].map((tabItem) => (
          <button
            key={tabItem.name}
            type="button"
            onClick={() => setActiveTab(tabItem.name)}
            className={`px-4 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeTab === tabItem.name
                ? 'bg-teal-600 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <tabItem.icon className="w-3.5 h-3.5" />
            <span>{tabItem.name}</span>
          </button>
        ))}
      </div>

      {/* Consolidated Executive Clinical Summary */}
      {detail.consolidated_summary && (activeTab === 'Overview' || activeTab === 'Medical Timeline') && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-teal-600" />
                <h2 className="text-base font-bold text-slate-900">{detail.consolidated_summary.title}</h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Synthesized pre-consultation summary generated across Reports, AI Chats, Voice Sessions & Prescriptions.
              </p>
            </div>

            <button
              type="button"
              onClick={handleGenerateConsolidatedSummary}
              disabled={generatingSummary}
              className="px-3.5 py-2 bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5 shrink-0 self-start sm:self-auto disabled:opacity-50"
            >
              {generatingSummary ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-600" />
              ) : (
                <RotateCcw className="w-3.5 h-3.5 text-teal-600" />
              )}
              <span>{generatingSummary ? 'Updating Summary...' : 'Generate Updated Summary'}</span>
            </button>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-800 leading-relaxed font-medium">
            <span className="font-bold text-slate-900 block mb-1 text-xs">Clinical Synthesis:</span>
            {detail.consolidated_summary.summary}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <span className="text-[11px] font-bold text-slate-800 flex items-center gap-1">
                <MessageSquare className="w-3.5 h-3.5 text-teal-600" /> Recent Reported Concerns
              </span>
              <p className="text-xs text-slate-700 font-medium">
                {detail.consolidated_summary.recent_concerns || 'No active complaints reported.'}
              </p>
            </div>

            <div className="p-3.5 bg-rose-50/60 rounded-xl border border-rose-100 space-y-1">
              <span className="text-[11px] font-bold text-rose-900 flex items-center gap-1">
                <FileSearch className="w-3.5 h-3.5 text-rose-600" /> Key Report Findings
              </span>
              <p className="text-xs text-rose-950 font-medium">
                {detail.consolidated_summary.key_report_findings || 'All parameters within reference ranges.'}
              </p>
            </div>

            <div className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-100 space-y-1">
              <span className="text-[11px] font-bold text-emerald-900 flex items-center gap-1">
                <Pill className="w-3.5 h-3.5 text-emerald-600" /> Active Medications
              </span>
              <p className="text-xs text-emerald-950 font-medium">
                {detail.consolidated_summary.active_medications || 'None recorded.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab Contents: Overview */}
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
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-teal-600" />
                    <h2 className="text-base font-bold text-slate-900">{ai_health_summary.title}</h2>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
                    Patient Medical Summary
                  </span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed font-medium">
                  {ai_health_summary.summary}
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
                  <div className="text-slate-500">Relationship: {emergency_contact.relationship || 'Contact'}</div>
                  <div className="text-teal-700 font-semibold">{emergency_contact.phone}</div>
                </div>
              ) : (
                <p className="text-xs text-slate-500">No emergency contact provided.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab Contents: Medical History Feed */}
      {(activeTab === 'Medical Timeline' || activeTab === 'Overview') && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-5 h-5 text-teal-600" />
                <span>Complete Medical History Timeline</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Unified chronological timeline combining AI conversations, voice intake sessions, uploaded reports, and prescriptions.
              </p>
            </div>

            {/* Category Filters */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
              {['All', 'Reports', 'AI', 'Voice', 'Prescription', 'Appointment'].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setTimelineFilter(cat)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    timelineFilter === cat
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Timeline Items */}
          {medical_history.filter(item => timelineFilter === 'All' || item.category === timelineFilter || item.event_type.includes(timelineFilter)).length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 italic">
              No events match the selected timeline filter.
            </div>
          ) : (
            <div className="space-y-3">
              {medical_history
                .filter(item => timelineFilter === 'All' || item.category === timelineFilter || item.event_type.includes(timelineFilter))
                .map((item) => (
                  <div key={item.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          item.event_type.includes('Report') ? 'bg-teal-100 text-teal-800 border border-teal-300' :
                          item.event_type.includes('AI') ? 'bg-teal-50 text-teal-800 border border-teal-200' :
                          item.event_type.includes('Voice') ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                          item.event_type.includes('Prescription') ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                          'bg-blue-100 text-blue-800 border border-blue-300'
                        }`}>
                          {item.event_type}
                        </span>
                        <span className="font-bold text-slate-900 text-sm">{item.title}</span>
                      </div>
                      <span className="text-slate-500 font-medium text-[11px]">{item.date}</span>
                    </div>

                    <p className="text-slate-600 leading-relaxed font-medium">{item.description}</p>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
                      <span className="text-[11px] text-slate-500">Source: {item.doctor_name || 'MediAssist System'}</span>

                      {item.event_type.includes('AI') && item.source_id && (
                        <button
                          type="button"
                          onClick={() => setSelectedAIConvId(item.source_id)}
                          className="px-3 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-bold text-xs transition cursor-pointer flex items-center gap-1"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>View Full Conversation</span>
                        </button>
                      )}

                      {item.event_type.includes('Voice') && item.source_id && (
                        <button
                          type="button"
                          onClick={() => setSelectedVoiceSessionId(item.source_id)}
                          className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-xs transition cursor-pointer flex items-center gap-1"
                        >
                          <Mic className="w-3.5 h-3.5" />
                          <span>View Full Transcript</span>
                        </button>
                      )}

                      {item.event_type.includes('Report') && (
                        <button
                          type="button"
                          onClick={() => setSelectedReport(reports.find(r => r.id === item.source_id) || { id: item.source_id, title: item.title, file_url: `/records/${item.source_id}/file` })}
                          className="px-3 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-bold text-xs transition cursor-pointer flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Document</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* Tab Contents: AI Consultations */}
      {activeTab === 'AI Consultations' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-teal-600" />
              <span>Patient AI Health Assistant Consultations</span>
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-50 text-teal-800 border border-teal-200">
              {detail.ai_conversations?.length || 0} Sessions Recorded
            </span>
          </div>

          {(!detail.ai_conversations || detail.ai_conversations.length === 0) ? (
            <div className="p-8 text-center text-xs text-slate-500 italic">No AI consultations recorded for this patient.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {detail.ai_conversations.map((conv) => (
                <div key={conv.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900">{conv.title}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200">
                      {conv.status || 'Active'}
                    </span>
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-slate-200/80 text-xs">
                    <span className="font-bold text-slate-700 block mb-0.5">Clinical AI Summary</span>
                    <p className="text-slate-600 leading-relaxed font-medium">{conv.summary}</p>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
                    <span className="text-[10px] text-slate-400">{conv.date}</span>
                    <button
                      type="button"
                      onClick={() => setSelectedAIConvId(conv.id)}
                      className="px-3 py-1 rounded-lg bg-teal-600 text-white text-xs font-bold hover:bg-teal-700 transition cursor-pointer flex items-center gap-1"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>View Full Conversation</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab Contents: Voice Consultations */}
      {activeTab === 'Voice Consultations' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Mic className="w-5 h-5 text-amber-600" />
              <span>Voice Intake & Consultation History</span>
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
              {detail.voice_sessions?.length || 0} Voice Sessions
            </span>
          </div>

          {(!detail.voice_sessions || detail.voice_sessions.length === 0) ? (
            <div className="p-8 text-center text-xs text-slate-500 italic">No voice intake sessions recorded for this patient.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {detail.voice_sessions.map((vs) => (
                <div key={vs.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900">{vs.mode}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                      {vs.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 line-clamp-3">{vs.summary}</p>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
                    <span className="text-[10px] text-slate-400">{vs.date}</span>
                    <button
                      type="button"
                      onClick={() => setSelectedVoiceSessionId(vs.id)}
                      className="px-3 py-1 rounded-lg bg-amber-600 text-white text-xs font-bold hover:bg-amber-700 transition cursor-pointer flex items-center gap-1"
                    >
                      <Mic className="w-3.5 h-3.5" />
                      <span>View Full Transcript</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab Contents: Reports & Dynamic Extracted Parameters */}
      {activeTab === 'Reports' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-slate-900">Uploaded Medical Reports & Extracted Findings</h2>

          {reports.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">No medical reports are available for this patient.</div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {reports.map((rep) => (
                <div key={rep.id} className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-teal-600" />
                      <span className="font-bold text-sm text-slate-900">{rep.title}</span>
                    </div>
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
                      {rep.category} • {rep.date}
                    </span>
                  </div>

                  {/* Dynamic Extracted Medical Parameters Grid */}
                  {rep.extracted_parameters && rep.extracted_parameters.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[11px] font-bold text-slate-700 block">Extracted Key Findings:</span>
                      <div className="flex flex-wrap gap-2">
                        {rep.extracted_parameters.map((param: any, pidx: number) => {
                          const isAbnormal = ['HIGH', 'ELEVATED', 'LOW', 'CRITICAL', 'ABNORMAL'].includes(param.status);
                          return (
                            <div
                              key={pidx}
                              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 ${
                                isAbnormal
                                  ? 'bg-rose-50 text-rose-800 border-rose-200'
                                  : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              }`}
                            >
                              <span>{param.display_name || param.name}:</span>
                              <span className="font-bold">{param.value} {param.unit || ''}</span>
                              {isAbnormal && <span className="text-[10px] font-black px-1.5 py-0.2 bg-rose-200 text-rose-900 rounded">{param.status}</span>}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="p-3 bg-white rounded-lg border border-slate-200/80 text-xs">
                    <span className="font-bold text-slate-700 block mb-0.5">AI Summary</span>
                    <p className="text-slate-600 leading-relaxed">{rep.summary}</p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
                    <span className="text-xs text-slate-400">{rep.file_name}</span>
                    <button
                      type="button"
                      onClick={() => setSelectedReport(rep)}
                      className="px-3.5 py-1.5 rounded-xl bg-teal-600 text-white text-xs font-bold hover:bg-teal-700 transition cursor-pointer flex items-center gap-1.5"
                    >
                      <Eye className="w-4 h-4" />
                      <span>View Original Document</span>
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

      {/* Full AI Conversation Modal */}
      {selectedAIConvId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150 overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <MessageSquare className="w-6 h-6 text-teal-600" />
                <div>
                  <h3 className="font-bold text-base text-slate-900">{aiConvTranscript?.title || 'Patient AI Consultation'}</h3>
                  <p className="text-xs text-slate-500">{aiConvTranscript?.created_at || 'Consultation Session'}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAIConvId(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-slate-50/50">
              {loadingAITranscript ? (
                <div className="py-16 text-center text-xs text-slate-500 flex flex-col items-center gap-2">
                  <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
                  <span>Loading full AI dialogue transcript...</span>
                </div>
              ) : aiConvTranscript ? (
                <div className="space-y-3">
                  {aiConvTranscript.clinical_summary && (
                    <div className="p-4 bg-teal-50 rounded-2xl border border-teal-200 text-xs">
                      <span className="font-bold text-teal-900 block mb-1">AI Clinical Summary</span>
                      <p className="text-teal-800 leading-relaxed font-medium">{aiConvTranscript.clinical_summary}</p>
                    </div>
                  )}

                  <div className="space-y-3 pt-2">
                    {aiConvTranscript.messages?.map((msg: any) => {
                      const isUser = msg.sender_role === 'user';
                      return (
                        <div
                          key={msg.id}
                          className={`flex flex-col ${isUser ? 'items-start' : 'items-end'}`}
                        >
                          <span className="text-[10px] font-bold text-slate-400 mb-1 px-1">
                            {isUser ? 'Patient' : 'MediAssist AI'} • {msg.created_at}
                          </span>
                          <div
                            className={`p-3.5 rounded-2xl text-xs max-w-[85%] leading-relaxed ${
                              isUser
                                ? 'bg-white text-slate-900 border border-slate-200 shadow-xs'
                                : 'bg-slate-800 text-white font-medium shadow-xs'
                            }`}
                          >
                            {msg.content}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-slate-500">Transcript unavailable.</div>
              )}
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setSelectedAIConvId(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-bold text-xs cursor-pointer"
              >
                Close Transcript
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full Voice Session Transcript Modal */}
      {selectedVoiceSessionId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150 overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <Mic className="w-6 h-6 text-amber-600" />
                <div>
                  <h3 className="font-bold text-base text-slate-900">{voiceSessionTranscript?.mode || 'Voice Intake Session'}</h3>
                  <p className="text-xs text-slate-500">{voiceSessionTranscript?.started_at || 'Voice Recording'}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedVoiceSessionId(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-slate-50/50">
              {loadingVoiceTranscript ? (
                <div className="py-16 text-center text-xs text-slate-500 flex flex-col items-center gap-2">
                  <Loader2 className="w-6 h-6 animate-spin text-amber-600" />
                  <span>Loading voice transcript...</span>
                </div>
              ) : voiceSessionTranscript ? (
                <div className="space-y-3">
                  {voiceSessionTranscript.summary && (
                    <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-xs">
                      <span className="font-bold text-amber-900 block mb-1">Voice Session Clinical Summary</span>
                      <p className="text-amber-800 leading-relaxed font-medium">{voiceSessionTranscript.summary}</p>
                    </div>
                  )}

                  {voiceSessionTranscript.transcript && (
                    <div className="p-4 bg-white rounded-2xl border border-slate-200 text-xs font-mono leading-relaxed text-slate-800 whitespace-pre-wrap">
                      <span className="font-bold font-sans text-slate-700 block mb-1">Complete Speech Transcript:</span>
                      {voiceSessionTranscript.transcript}
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-slate-500">Transcript unavailable.</div>
              )}
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setSelectedVoiceSessionId(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-bold text-xs cursor-pointer"
              >
                Close Transcript
              </button>
            </div>
          </div>
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
              {loadingReportFile ? (
                <div className="w-full h-[45vh] rounded-2xl border border-slate-200 bg-slate-50 flex flex-col items-center justify-center gap-2 text-slate-500 text-xs">
                  <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
                  <span>Loading document preview...</span>
                </div>
              ) : reportTextContent ? (
                <div className="w-full max-h-[45vh] overflow-y-auto p-4 bg-slate-900 text-slate-100 rounded-2xl font-mono text-xs leading-relaxed shadow-inner border border-slate-800 whitespace-pre-wrap">
                  {reportTextContent}
                </div>
              ) : (selectedReport.file_name?.match(/\.(jpg|jpeg|png|webp|gif)$/i) || reportContentType.includes('image')) && reportBlobUrl ? (
                <img
                  src={reportBlobUrl}
                  alt={selectedReport.title}
                  className="w-full h-auto max-h-[50vh] object-contain rounded-2xl border border-slate-200 bg-slate-100 shadow-inner"
                />
              ) : reportBlobUrl ? (
                <div className="w-full h-[45vh] rounded-2xl border border-slate-200 bg-slate-100 overflow-hidden shadow-xs relative">
                  <iframe
                    src={reportBlobUrl}
                    title={selectedReport.title}
                    className="w-full h-full border-0"
                  />
                </div>
              ) : (
                <div className="w-full h-[45vh] rounded-2xl border border-slate-200 bg-slate-50 flex flex-col items-center justify-center gap-2 text-slate-500 text-xs">
                  <FileText className="w-8 h-8 text-slate-400" />
                  <span>Preview not available for this record type. Click download to view.</span>
                </div>
              )}

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <span className="font-bold text-slate-800 block mb-1">Clinical Interpretation Summary</span>
                <p className="text-slate-600 leading-relaxed">{selectedReport.summary}</p>
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-2">
              <a
                href={getAuthFileUrl(selectedReport.file_url)}
                target="_blank"
                rel="noreferrer"
                download
                className="px-4 py-2 bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 rounded-xl font-bold text-xs transition cursor-pointer flex items-center gap-1.5"
              >
                <Download className="w-4 h-4" />
                <span>Download Report</span>
              </a>
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
                <Bell className="w-5 h-5 text-teal-600" />
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
                  className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold cursor-pointer shadow-2xs"
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
