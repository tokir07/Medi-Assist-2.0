import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { doctorService } from '../../services/doctorService';
import {
  Calendar as CalendarIcon,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Search,
  Plus,
  Video,
  UserCheck,
  Ban,
  Settings,
  CalendarOff,
  MessageSquare,
  X,
  Loader2,
  Check,
  UserX,
  Lock,
  CalendarDays,
} from 'lucide-react';

export const DoctorAppointmentsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const activeTabParam = searchParams.get('tab') || 'Today';

  const [activeTab, setActiveTab] = useState<string>(activeTabParam);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals state
  const [rejectingAppId, setRejectingAppId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('Schedule conflict');
  const [rejectMessage, setRejectMessage] = useState<string>('Please select another available time.');

  const [cancellingAppId, setCancellingAppId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState<string>('Urgent personal reason');
  const [cancelPatientNote, setCancelPatientNote] = useState<string>(
    'Unfortunately, I need to cancel today\'s appointment. Please select another available slot.'
  );

  const [showDayOffModal, setShowDayOffModal] = useState<boolean>(false);
  const [dayOffDate, setDayOffDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [dayOffReason, setDayOffReason] = useState<string>('Personal Leave');
  const [dayOffCollisionCount, setDayOffCollisionCount] = useState<number | null>(null);

  // Block Slot Modal State
  const [showBlockSlotModal, setShowBlockSlotModal] = useState<boolean>(false);
  const [blockDate, setBlockDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [blockTime, setBlockTime] = useState<string>('10:00 AM');
  const [blockReason, setBlockReason] = useState<string>('Personal Work');
  const [blockedSlotsList, setBlockedSlotsList] = useState<Array<{ date: string; time: string; reason: string }>>([
    { date: new Date().toISOString().split('T')[0], time: '10:00 AM', reason: 'Personal Work' },
  ]);

  // Working Hours Config State
  const [workingDays, setWorkingDays] = useState<string[]>([
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ]);
  const [morningStart, setMorningStart] = useState<string>('09:00 AM');
  const [morningEnd, setMorningEnd] = useState<string>('01:00 PM');
  const [eveningStart, setEveningStart] = useState<string>('04:00 PM');
  const [eveningEnd, setEveningEnd] = useState<string>('07:00 PM');

  useEffect(() => {
    fetchAppointments();
  }, [activeTab]);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      if (activeTab === 'Schedule') {
        const cfg = await doctorService.getScheduleConfig();
        if (cfg) {
          setWorkingDays(cfg.working_days || workingDays);
          setMorningStart(cfg.morning_start || morningStart);
          setMorningEnd(cfg.morning_end || morningEnd);
          setEveningStart(cfg.evening_start || eveningStart);
          setEveningEnd(cfg.evening_end || eveningEnd);
        }
      } else {
        const res = await doctorService.getAppointments(activeTab, searchTerm);
        setAppointments(res || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tabName: string) => {
    setActiveTab(tabName);
    setSearchParams({ tab: tabName });
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleAccept = async (appId: string) => {
    try {
      await doctorService.acceptAppointment(appId);
      showToast('Appointment request accepted!');
      fetchAppointments();
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkNoShow = async (appId: string) => {
    try {
      await doctorService.markNoShow(appId);
      showToast('Appointment marked as NO-SHOW.');
      fetchAppointments();
    } catch (err) {
      console.error(err);
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectingAppId) return;
    try {
      await doctorService.rejectAppointment(rejectingAppId, {
        reason: rejectReason,
        message: rejectMessage,
      });
      showToast('Appointment rejected and patient notified.');
      setRejectingAppId(null);
      fetchAppointments();
    } catch (err) {
      console.error(err);
    }
  };

  const handleConfirmEmergencyCancel = async () => {
    if (!cancellingAppId) return;
    try {
      await doctorService.emergencyCancel(cancellingAppId, {
        reason: cancelReason,
        message_to_patient: cancelPatientNote,
      });
      showToast('Emergency cancellation sent to patient.');
      setCancellingAppId(null);
      fetchAppointments();
    } catch (err) {
      console.error(err);
    }
  };

  const handleConfirmBlockSlot = async () => {
    try {
      await doctorService.blockSlot({
        date: blockDate,
        slot_time: blockTime,
        reason: blockReason,
      });
      setBlockedSlotsList([...blockedSlotsList, { date: blockDate, time: blockTime, reason: blockReason }]);
      showToast(`Slot ${blockTime} on ${blockDate} is now BLOCKED.`);
      setShowBlockSlotModal(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleConfirmDayOff = async (confirmCancel: boolean = false) => {
    try {
      const res = await doctorService.setDayOff({
        date: dayOffDate,
        reason: dayOffReason,
        confirm_cancel_existing: confirmCancel,
      });

      if (res.existing_appointments_count > 0 && !confirmCancel && res.cancelled_count === 0) {
        setDayOffCollisionCount(res.existing_appointments_count);
        return;
      }

      showToast(res.message || `Day off set for ${dayOffDate}`);
      setShowDayOffModal(false);
      setDayOffCollisionCount(null);
      fetchAppointments();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveScheduleConfig = async () => {
    try {
      await doctorService.updateScheduleConfig({
        working_days: workingDays,
        morning_start: morningStart,
        morning_end: morningEnd,
        evening_start: eveningStart,
        evening_end: eveningEnd,
        slot_duration_minutes: 30,
      });
      showToast('Schedule settings saved successfully!');
    } catch (err) {
      console.error(err);
    }
  };

  const toggleDay = (day: string) => {
    if (workingDays.includes(day)) {
      setWorkingDays(workingDays.filter((d) => d !== day));
    } else {
      setWorkingDays([...workingDays, day]);
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <CalendarIcon className="w-6 h-6 text-teal-600" />
            <span>Appointment & Schedule Management</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage patient appointment requests, slot blocking, days-off, and consultation schedules.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowBlockSlotModal(true)}
            className="px-4 py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer shrink-0"
          >
            <Lock className="w-4 h-4 text-amber-600" />
            <span>Block Time Slot</span>
          </button>

          <button
            type="button"
            onClick={() => setShowDayOffModal(true)}
            className="px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer shrink-0"
          >
            <CalendarOff className="w-4 h-4 text-rose-600" />
            <span>Set Day Off</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-1 custom-scrollbar">
        {['Today', 'Upcoming', 'Pending Requests', 'Schedule', 'Completed', 'Cancelled'].map((tab) => {
          const isActive = activeTab.toLowerCase() === tab.toLowerCase() || (activeTab === 'Pending' && tab === 'Pending Requests');
          return (
            <button
              key={tab}
              type="button"
              onClick={() => handleTabChange(tab === 'Pending Requests' ? 'Pending' : tab)}
              className={`px-4 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-teal-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              {tab}
            </button>
          );
        })}
      </div>

      {/* Search Input */}
      {activeTab !== 'Schedule' && (
        <div className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
          <Search className="w-4 h-4 text-slate-400 pl-1" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchAppointments()}
            placeholder="Search by patient name, complaint, or status..."
            className="flex-1 bg-transparent text-xs sm:text-sm text-slate-900 font-medium placeholder:text-slate-400 focus:outline-none"
          />
        </div>
      )}

      {/* Main Tab Content */}
      {loading ? (
        <div className="min-h-[40vh] flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
          <span className="text-xs font-medium text-slate-500">Updating schedule...</span>
        </div>
      ) : activeTab === 'Schedule' ? (
        /* Doctor Visual Schedule & Working Hours Grid */
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
            <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <CalendarDays className="w-5 h-5 text-teal-600" />
                  <span>Interactive Doctor Calendar & Slot Matrix</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Visual daily matrix displaying confirmed appointments, blocked slots, breaks, and leave.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowBlockSlotModal(true)}
                className="px-3.5 py-1.5 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>+ Block Time Slot</span>
              </button>
            </div>

            {/* Daily Slots Grid Preview */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {[
                { time: '09:00 AM', status: 'BOOKED', patient: 'Rahul Sharma (Video)' },
                { time: '09:30 AM', status: 'BOOKED', patient: 'Priya Singh (In-Person)' },
                { time: '10:00 AM', status: 'BLOCKED', patient: 'Blocked: Personal Work' },
                { time: '10:30 AM', status: 'AVAILABLE', patient: 'Available' },
                { time: '11:00 AM', status: 'BOOKED', patient: 'Amit Kumar (Video)' },
                { time: '11:30 AM', status: 'AVAILABLE', patient: 'Available' },
                { time: '01:00 PM', status: 'BREAK', patient: 'Lunch Break (1PM - 2PM)' },
                { time: '02:00 PM', status: 'AVAILABLE', patient: 'Available' },
                { time: '02:30 PM', status: 'BOOKED', patient: 'Kavita Reddy (In-Person)' },
                { time: '03:00 PM', status: 'AVAILABLE', patient: 'Available' },
                { time: '04:00 PM', status: 'BOOKED', patient: 'Neha Gupta (Video)' },
                { time: '04:30 PM', status: 'AVAILABLE', patient: 'Available' },
              ].map((slot, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-xl border text-xs space-y-1 transition-all ${
                    slot.status === 'BOOKED'
                      ? 'bg-teal-50 border-teal-200 text-teal-900'
                      : slot.status === 'BLOCKED'
                      ? 'bg-amber-50 border-amber-200 text-amber-900'
                      : slot.status === 'BREAK'
                      ? 'bg-slate-100 border-slate-200 text-slate-500'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-teal-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[11px]">{slot.time}</span>
                    <span
                      className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded ${
                        slot.status === 'BOOKED'
                          ? 'bg-teal-600 text-white'
                          : slot.status === 'BLOCKED'
                          ? 'bg-amber-600 text-white'
                          : slot.status === 'BREAK'
                          ? 'bg-slate-300 text-slate-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {slot.status}
                    </span>
                  </div>
                  <p className="text-[11px] font-medium truncate">{slot.patient}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Working Days & Hours Editor */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Settings className="w-5 h-5 text-teal-600" />
                <span>Weekly Working Hours Configuration</span>
              </h2>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Working Days</label>
              <div className="flex flex-wrap gap-2.5">
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => {
                  const selected = workingDays.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(day)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-2 ${
                        selected
                          ? 'bg-teal-50 border-teal-500 text-teal-800 shadow-2xs'
                          : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                      }`}
                    >
                      {selected ? <Check className="w-3.5 h-3.5 text-teal-600" /> : <span className="w-3.5 h-3.5" />}
                      <span>{day}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <span className="text-xs font-bold text-slate-800 block">Morning Shift</span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-500 block mb-1">Start Time</label>
                    <input
                      type="text"
                      value={morningStart}
                      onChange={(e) => setMorningStart(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 focus:border-teal-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-500 block mb-1">End Time</label>
                    <input
                      type="text"
                      value={morningEnd}
                      onChange={(e) => setMorningEnd(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 focus:border-teal-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <span className="text-xs font-bold text-slate-800 block">Evening Shift</span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-500 block mb-1">Start Time</label>
                    <input
                      type="text"
                      value={eveningStart}
                      onChange={(e) => setEveningStart(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 focus:border-teal-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-500 block mb-1">End Time</label>
                    <input
                      type="text"
                      value={eveningEnd}
                      onChange={(e) => setEveningEnd(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 focus:border-teal-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={handleSaveScheduleConfig}
                className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-2xs transition-all cursor-pointer"
              >
                Save Schedule Settings
              </button>
            </div>
          </div>
        </div>
      ) : appointments.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
          <CalendarIcon className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No appointments found</h3>
          <p className="text-xs text-slate-500">There are no appointments matching tab "{activeTab}".</p>
        </div>
      ) : (
        /* Appointment Cards List */
        <div className="space-y-4">
          {appointments.map((app) => (
            <div
              key={app.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-slate-300 transition-all"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-slate-900">{app.patient_name}</span>
                  <span className="text-xs text-slate-500 font-medium">
                    ({app.patient_age} yrs • {app.patient_gender})
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                      app.status === 'Confirmed'
                        ? 'bg-teal-50 text-teal-700 border border-teal-200'
                        : app.status === 'Pending'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : app.status === 'Completed' || app.status === 'COMPLETED'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : app.status === 'NO_SHOW'
                        ? 'bg-slate-100 text-slate-700 border border-slate-300'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}
                  >
                    {app.status}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                  <span className="font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md">
                    {app.appointment_date} • {app.appointment_time}
                  </span>
                  <span>•</span>
                  <span className="font-medium text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md">
                    {app.mode}
                  </span>
                  <span>•</span>
                  <span className="text-slate-500">{app.appointment_type}</span>
                </div>

                {app.reason && (
                  <p className="text-xs text-slate-600 italic bg-slate-50 p-2 rounded-lg border border-slate-100">
                    "Reason: {app.reason}"
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                {app.status === 'Pending' && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleAccept(app.id)}
                      className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Accept</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRejectingAppId(app.id)}
                      className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Reject</span>
                    </button>
                  </>
                )}

                {app.status === 'Confirmed' && (
                  <>
                    <button
                      type="button"
                      onClick={() => navigate(`/doctor/consultation/${app.id}`)}
                      className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                    >
                      {app.mode?.includes('Video') ? <Video className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                      <span>Start Consultation</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleMarkNoShow(app.id)}
                      className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                    >
                      <UserX className="w-3.5 h-3.5 text-slate-500" />
                      <span>No-Show</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCancellingAppId(app.id)}
                      className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 text-xs font-semibold transition-all cursor-pointer"
                    >
                      <Ban className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}

                <button
                  type="button"
                  onClick={() => navigate(`/doctor/patients/${app.patient_id || 'pat-demo-1'}`)}
                  className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all cursor-pointer"
                >
                  View Patient
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Block Slot Modal */}
      {showBlockSlotModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <Lock className="w-5 h-5 text-amber-600" />
                <span>Block Individual Time Slot</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowBlockSlotModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Select Date</label>
                <input
                  type="date"
                  value={blockDate}
                  onChange={(e) => setBlockDate(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Select Time Slot to Block</label>
                <select
                  value={blockTime}
                  onChange={(e) => setBlockTime(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none"
                >
                  {['09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '02:00 PM', '02:30 PM', '03:00 PM', '04:00 PM'].map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Reason for Blocking</label>
                <input
                  type="text"
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  placeholder="Personal Work, Meeting, Procedure..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowBlockSlotModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmBlockSlot}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold cursor-pointer shadow-2xs"
              >
                Block Slot
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Appointment Modal */}
      {rejectingAppId && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900">Reject Appointment Request</h3>
              <button
                type="button"
                onClick={() => setRejectingAppId(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Rejection Reason</label>
                <select
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none"
                >
                  <option value="Schedule conflict">Schedule conflict</option>
                  <option value="Outside working hours">Outside working hours</option>
                  <option value="Emergency surgery">Emergency surgery</option>
                  <option value="Unsuitable condition for teleconsult">Unsuitable condition for teleconsult</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Message to Patient</label>
                <textarea
                  rows={3}
                  value={rejectMessage}
                  onChange={(e) => setRejectMessage(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectingAppId(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer shadow-2xs"
              >
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Emergency Cancellation Modal */}
      {cancellingAppId && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2 text-rose-600">
                <AlertTriangle className="w-5 h-5" />
                <span>Emergency Appointment Cancellation</span>
              </h3>
              <button
                type="button"
                onClick={() => setCancellingAppId(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Cancellation Reason</label>
                <input
                  type="text"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Message to Patient</label>
                <textarea
                  rows={3}
                  value={cancelPatientNote}
                  onChange={(e) => setCancelPatientNote(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCancellingAppId(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
              >
                Go Back
              </button>
              <button
                type="button"
                onClick={handleConfirmEmergencyCancel}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer shadow-2xs"
              >
                Cancel & Notify Patient
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Set Day Off Modal */}
      {showDayOffModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <CalendarOff className="w-5 h-5 text-rose-600" />
                <span>Declare Day Off</span>
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowDayOffModal(false);
                  setDayOffCollisionCount(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Select Date</label>
                <input
                  type="date"
                  value={dayOffDate}
                  onChange={(e) => {
                    setDayOffDate(e.target.value);
                    setDayOffCollisionCount(null);
                  }}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Reason for Leave</label>
                <input
                  type="text"
                  value={dayOffReason}
                  onChange={(e) => setDayOffReason(e.target.value)}
                  placeholder="Personal Leave, Medical Conference..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none"
                />
              </div>

              {dayOffCollisionCount !== null && (
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 space-y-2 text-xs">
                  <div className="flex items-center gap-2 font-bold">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Existing Appointments Warning</span>
                  </div>
                  <p>
                    You have <strong>{dayOffCollisionCount} appointment(s)</strong> scheduled on {dayOffDate}.
                  </p>
                  <div className="flex flex-col gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => handleConfirmDayOff(true)}
                      className="w-full py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-xs cursor-pointer shadow-2xs"
                    >
                      Cancel & Notify Patients
                    </button>
                    <button
                      type="button"
                      onClick={() => handleConfirmDayOff(false)}
                      className="w-full py-1.5 bg-white border border-amber-300 hover:bg-amber-100 text-amber-900 rounded-lg font-bold text-xs cursor-pointer"
                    >
                      Keep Appointments & Block Future Slots
                    </button>
                  </div>
                </div>
              )}
            </div>

            {dayOffCollisionCount === null && (
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDayOffModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleConfirmDayOff(false)}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer shadow-2xs"
                >
                  Confirm Day Off
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
