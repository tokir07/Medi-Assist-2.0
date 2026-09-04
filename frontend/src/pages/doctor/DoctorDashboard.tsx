import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { doctorService } from '../../services/doctorService';
import type { DoctorDashboardData } from '../../services/doctorService';
import {
  Calendar,
  Clock,
  Users,
  MessageSquare,
  Video,
  UserCheck,
  CheckCircle2,
  XCircle,
  ArrowRight,
  ShieldCheck,
  Activity,
  PlusCircle,
  FileText,
  Pill,
  Bell,
  Sparkles,
  AlertCircle,
} from 'lucide-react';

export const DoctorDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [data, setData] = useState<DoctorDashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isAvailable, setIsAvailable] = useState<boolean>(true);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await doctorService.getDashboard();
      setData(res);
      setIsAvailable(res.stats.is_available);
    } catch (err) {
      console.error('Failed to load doctor dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAvailability = async () => {
    const nextState = !isAvailable;
    setIsAvailable(nextState);
    try {
      await doctorService.setAvailability(nextState);
      showToast(`Status updated to ${nextState ? 'Available' : 'Away'}`);
    } catch (err) {
      setIsAvailable(!nextState);
    }
  };

  const handleAcceptRequest = async (appId: string) => {
    try {
      await doctorService.acceptAppointment(appId);
      showToast('Appointment request accepted!');
      fetchDashboard();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRejectRequest = async (appId: string) => {
    try {
      await doctorService.rejectAppointment(appId, { reason: 'Schedule conflict' });
      showToast('Appointment request rejected');
      fetchDashboard();
    } catch (err) {
      console.error(err);
    }
  };

  const showToast = (msg: string) => {
    setActionMessage(msg);
    setTimeout(() => setActionMessage(null), 3000);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-medium text-slate-500">Loading Doctor Dashboard...</p>
      </div>
    );
  }

  const stats = data?.stats || {
    todays_appointments_count: 0,
    pending_requests_count: 0,
    total_patients_count: 0,
    unread_messages_count: 0,
    is_available: true,
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Alert Banner */}
      {actionMessage && (
        <div className="fixed top-20 right-6 z-50 bg-teal-800 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 text-sm font-semibold animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-5 h-5 text-teal-300 shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Top Banner & Welcome Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              {getGreeting()}, Dr. {user?.name || 'Priya Sharma'} 👋
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            Here's what's happening with your practice today.
          </p>
        </div>

        {/* Availability Toggle */}
        <div className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-200 shrink-0">
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isAvailable ? 'bg-teal-500 animate-pulse shadow-[0_0_8px_rgba(20,184,166,0.6)]' : 'bg-slate-400'
              }`}
            />
            <span className="text-xs font-semibold text-slate-700">
              {isAvailable ? 'Available for Appointments' : 'Currently Away'}
            </span>
          </div>
          <button
            type="button"
            onClick={handleToggleAvailability}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              isAvailable
                ? 'bg-teal-600 hover:bg-teal-700 text-white shadow-2xs'
                : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
            }`}
          >
            {isAvailable ? 'Set Away' : 'Set Available'}
          </button>
        </div>
      </div>

      {/* 4 Core Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div
          onClick={() => navigate('/doctor/appointments')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Today's Appointments</span>
            <div className="p-2.5 rounded-xl bg-teal-50 text-teal-600 group-hover:scale-105 transition-transform">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900">{stats.todays_appointments_count}</span>
            <span className="text-[11px] font-semibold text-teal-600 flex items-center gap-1">
              <span>View Schedule</span>
              <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* Card 2 */}
        <div
          onClick={() => navigate('/doctor/appointments?tab=Pending')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Pending Requests</span>
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 group-hover:scale-105 transition-transform">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900">{stats.pending_requests_count}</span>
            <span className="text-[11px] font-semibold text-amber-600 flex items-center gap-1">
              <span>Action Needed</span>
              <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* Card 3 */}
        <div
          onClick={() => navigate('/doctor/patients')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">My Patients</span>
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 group-hover:scale-105 transition-transform">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900">{stats.total_patients_count}</span>
            <span className="text-[11px] font-semibold text-blue-600 flex items-center gap-1">
              <span>Patient Directory</span>
              <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* Card 4 */}
        <div
          onClick={() => navigate('/doctor/messages')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Unread Messages</span>
            <div className="p-2.5 rounded-xl bg-teal-50 text-teal-600 group-hover:scale-105 transition-transform">
              <MessageSquare className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900">{stats.unread_messages_count}</span>
            <span className="text-[11px] font-semibold text-teal-600 flex items-center gap-1">
              <span>Open Chat</span>
              <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Schedule vs Right Side Request Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Today's Schedule Timeline */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-teal-600" />
                <h2 className="font-bold text-base text-slate-900 tracking-tight">Today's Schedule</h2>
              </div>
              <button
                type="button"
                onClick={() => navigate('/doctor/appointments')}
                className="text-xs font-bold text-teal-600 hover:text-teal-700 cursor-pointer"
              >
                View Full Calendar
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {(!data?.todays_schedule || data.todays_schedule.length === 0) ? (
                <div className="py-8 text-center text-xs text-slate-500 font-medium">
                  No appointments scheduled yet today.
                </div>
              ) : (
                data.todays_schedule.map((item) => (
                  <div
                    key={item.appointment_id}
                    className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 p-2.5 rounded-xl transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-14 text-center shrink-0">
                        <span className="text-xs font-bold text-slate-800 bg-slate-100 px-2 py-1 rounded-md block">
                          {item.appointment_time}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                          <span>{item.patient_name}</span>
                          <span className="text-[11px] font-normal text-slate-400">
                            ({item.patient_age} yrs • {item.patient_gender})
                          </span>
                        </h3>
                        <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                          <span className="font-medium text-slate-600">{item.mode}</span>
                          <span>•</span>
                          <span className="truncate max-w-[200px] sm:max-w-[300px]">{item.reason}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <button
                        type="button"
                        onClick={() => navigate(`/doctor/consultation/${item.appointment_id}`)}
                        className="px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        {item.mode.includes('Video') ? <Video className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                        <span>Start Consultation</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column (1 Col): Pending Requests & Quick Actions */}
        <div className="space-y-6">
          {/* Pending Appointment Requests Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600" />
                <h2 className="font-bold text-base text-slate-900 tracking-tight">Appointment Requests</h2>
              </div>
              <span className="text-xs font-bold bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200">
                {data?.pending_requests.length || 0} Pending
              </span>
            </div>

            <div className="space-y-3">
              {(!data?.pending_requests || data.pending_requests.length === 0) ? (
                <div className="py-6 text-center text-xs text-slate-500 font-medium">
                  No pending appointment requests.
                </div>
              ) : (
                data.pending_requests.map((req) => (
                <div
                  key={req.id}
                  className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2.5"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900">{req.patient_name}</h4>
                      <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                        {req.appointment_date} • {req.appointment_time} ({req.mode})
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 italic bg-white p-2 rounded-lg border border-slate-200/60">
                    "{req.reason}"
                  </p>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleAcceptRequest(req.id)}
                      className="flex-1 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center justify-center gap-1 shadow-2xs transition-colors cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Accept</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleRejectRequest(req.id)}
                      className="flex-1 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Reject</span>
                    </button>
                  </div>
                </div>
              ))
              )}
            </div>
          </div>

          {/* Quick Actions Panel */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
            <h2 className="font-bold text-sm text-slate-900 tracking-tight uppercase text-slate-400">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => navigate('/doctor/appointments')}
                className="p-3 rounded-xl bg-slate-50 hover:bg-teal-50 hover:border-teal-300 border border-slate-200/80 text-left transition-all cursor-pointer group"
              >
                <Calendar className="w-4 h-4 text-teal-600 mb-1" />
                <span className="block text-xs font-bold text-slate-800 group-hover:text-teal-700">Appointments</span>
              </button>

              <button
                type="button"
                onClick={() => navigate('/doctor/patients')}
                className="p-3 rounded-xl bg-slate-50 hover:bg-blue-50 hover:border-blue-300 border border-slate-200/80 text-left transition-all cursor-pointer group"
              >
                <Users className="w-4 h-4 text-blue-600 mb-1" />
                <span className="block text-xs font-bold text-slate-800 group-hover:text-blue-700">My Patients</span>
              </button>

              <button
                type="button"
                onClick={() => navigate('/doctor/prescriptions')}
                className="p-3 rounded-xl bg-slate-50 hover:bg-teal-50 hover:border-teal-300 border border-slate-200/80 text-left transition-all cursor-pointer group"
              >
                <Pill className="w-4 h-4 text-teal-600 mb-1" />
                <span className="block text-xs font-bold text-slate-800 group-hover:text-teal-700">New Prescription</span>
              </button>

              <button
                type="button"
                onClick={() => navigate('/doctor/messages')}
                className="p-3 rounded-xl bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 border border-slate-200/80 text-left transition-all cursor-pointer group"
              >
                <MessageSquare className="w-4 h-4 text-emerald-600 mb-1" />
                <span className="block text-xs font-bold text-slate-800 group-hover:text-emerald-700">Messages</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
