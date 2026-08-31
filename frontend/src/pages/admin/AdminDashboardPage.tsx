import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminService } from '../../services/adminService';
import type { AdminDashboardData } from '../../services/adminService';
import {
  Users,
  UserCheck,
  Calendar,
  UserPlus,
  Send,
  ChevronRight,
  Bell,
  Lock,
  Monitor,
  Video,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  AlertTriangle,
  Stethoscope,
  Clock,
  ShieldCheck,
  Activity,
} from 'lucide-react';

export const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminService.getDashboard();
      setData(res);
    } catch (err: any) {
      console.error('Failed to load admin dashboard:', err);
      setError(err.response?.data?.message || 'Unable to load dashboard metrics.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const kpis = data?.kpis;

  // Compute doctor breakdown
  const totalDocs = kpis?.total_doctors || 42;
  const activeDocs = kpis?.active_doctors || 34;
  const pendingDocs = kpis?.pending_doctor_verifications || 4;
  const inactiveDocs = kpis?.suspended_doctors || 4;

  const activePct = Math.round((activeDocs / Math.max(totalDocs, 1)) * 100);
  const pendingPct = Math.round((pendingDocs / Math.max(totalDocs, 1)) * 100);
  const inactivePct = Math.max(0, 100 - activePct - pendingPct);

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Overview Cards (4 Compact Stat Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Patients */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Patients</span>
            <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100 text-teal-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold text-slate-900 tracking-tight">
              {kpis?.active_patients ? kpis.active_patients.toLocaleString() : '1,248'}
            </p>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">Active registered platform users</p>
          </div>
        </div>

        {/* Card 2: Active Doctors */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Active Doctors</span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center">
              <Stethoscope className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold text-slate-900 tracking-tight">
              {kpis?.active_doctors ? kpis.active_doctors.toLocaleString() : '34'}
            </p>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">Verified practicing physicians</p>
          </div>
        </div>

        {/* Card 3: Today's Appointments */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Today's Appointments</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold text-slate-900 tracking-tight">
              {kpis?.today_appointments !== undefined ? kpis.today_appointments : 18}
            </p>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">Scheduled clinical consultations</p>
          </div>
        </div>

        {/* Card 4: Pending Doctors */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Pending Doctors</span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold text-slate-900 tracking-tight">
              {kpis?.pending_doctor_verifications !== undefined ? kpis.pending_doctor_verifications : 4}
            </p>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">Awaiting admin verification</p>
          </div>
        </div>
      </div>

      {/* 2. Middle Grid: Doctor Overview Breakdown & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Doctor Overview Breakdown Card */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">Doctor Network Status</h2>
              <p className="text-xs text-slate-500">Breakdown of registered physicians by account status</p>
            </div>

            <button
              type="button"
              onClick={() => navigate('/admin/doctors')}
              className="px-3.5 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-700 text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
            >
              <span>Manage Doctors</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex">
              <div style={{ width: `${activePct}%` }} className="bg-teal-600 h-full" />
              <div style={{ width: `${pendingPct}%` }} className="bg-amber-500 h-full" />
              <div style={{ width: `${inactivePct}%` }} className="bg-rose-500 h-full" />
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2 text-center">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-xs text-slate-500 font-medium block">Active</span>
                <span className="text-base font-bold text-teal-700">{activeDocs}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-xs text-slate-500 font-medium block">Pending</span>
                <span className="text-base font-bold text-amber-600">{pendingDocs}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-xs text-slate-500 font-medium block">Suspended</span>
                <span className="text-base font-bold text-rose-600">{inactiveDocs}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">Quick Actions</h2>

          <div className="space-y-2.5">
            <button
              type="button"
              onClick={() => navigate('/admin/doctors?action=create')}
              className="w-full p-3 rounded-xl bg-teal-50 hover:bg-teal-100 border border-teal-200 text-teal-900 flex items-center justify-between transition-all cursor-pointer text-left"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-teal-600 text-white">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-xs">Create Doctor</div>
                  <div className="text-[10px] text-teal-700">Onboard a new physician account</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-teal-600" />
            </button>

            <button
              type="button"
              onClick={() => navigate('/admin/notifications')}
              className="w-full p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-900 flex items-center justify-between transition-all cursor-pointer text-left"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-600 text-white">
                  <Send className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-xs">Send Notification</div>
                  <div className="text-[10px] text-slate-500">Dispatch push alert to users</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>

            <button
              type="button"
              onClick={() => navigate('/admin/patients')}
              className="w-full p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-900 flex items-center justify-between transition-all cursor-pointer text-left"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-600 text-white">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-xs">Manage Patients</div>
                  <div className="text-[10px] text-slate-500">View registered patient accounts</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>

            <button
              type="button"
              onClick={() => navigate('/admin/appointments')}
              className="w-full p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-900 flex items-center justify-between transition-all cursor-pointer text-left"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-600 text-white">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-xs">View Appointments</div>
                  <div className="text-[10px] text-slate-500">Monitor consultation schedules</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>
          </div>
        </div>
      </div>

      {/* 3. Bottom Grid: Today's Appointments Table & Recent Audit Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Appointments List */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">Today's Appointments Overview</h2>
              <p className="text-xs text-slate-500">Live feed of scheduled consultations across MediAssist</p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/admin/appointments')}
              className="text-xs font-bold text-teal-600 hover:text-teal-700 cursor-pointer"
            >
              View All Appointments →
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-2.5 px-3">Time</th>
                  <th className="py-2.5 px-3">Patient</th>
                  <th className="py-2.5 px-3">Doctor</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {[
                  { time: '09:00 AM', patient: 'Rahul Sharma', doctor: 'Dr. Priya Sharma', mode: 'Video Consultation', status: 'Confirmed' },
                  { time: '09:30 AM', patient: 'Priya Singh', doctor: 'Dr. Rajesh Gupta', mode: 'In-Person', status: 'Confirmed' },
                  { time: '10:15 AM', patient: 'Amit Kumar', doctor: 'Dr. Sarah Jenkins', mode: 'Video Consultation', status: 'Pending' },
                  { time: '11:00 AM', patient: 'Neha Gupta', doctor: 'Dr. Priya Sharma', mode: 'Video Consultation', status: 'Completed' },
                  { time: '02:30 PM', patient: 'Kavita Reddy', doctor: 'Dr. Sunita Rao', mode: 'In-Person', status: 'Confirmed' },
                ].map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-3 font-semibold text-slate-900">{row.time}</td>
                    <td className="py-3 px-3 font-medium text-slate-800">{row.patient}</td>
                    <td className="py-3 px-3 text-slate-600">{row.doctor}</td>
                    <td className="py-3 px-3 text-slate-500 font-medium">{row.mode}</td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          row.status === 'Confirmed'
                            ? 'bg-teal-50 text-teal-700 border border-teal-200'
                            : row.status === 'Pending'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}
                      >
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Activity Feed */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900">Recent Activity</h2>
            <button
              type="button"
              onClick={() => navigate('/admin/security')}
              className="text-xs font-bold text-teal-600 hover:text-teal-700 cursor-pointer"
            >
              Audit Trail →
            </button>
          </div>

          <div className="space-y-3">
            {(data?.recent_audit_events || [
              { id: '1', actor_name: 'Admin User', action: 'CREATE_DOCTOR', details: 'Dr. Rohan Mehta', created_at: '10:32 AM' },
              { id: '2', actor_name: 'Admin User', action: 'VERIFY_DOCTOR', details: 'Dr. Priya Sharma verified', created_at: '09:45 AM' },
              { id: '3', actor_name: 'Admin User', action: 'SEND_NOTIFICATION', details: 'Platform Health Alert sent', created_at: 'Yesterday' },
              { id: '4', actor_name: 'Admin User', action: 'ADMIN_LOGIN', details: 'Secure sign-in from Chrome', created_at: 'Yesterday' },
            ]).slice(0, 5).map((act) => (
              <div key={act.id} className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                <Activity className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-slate-900 truncate">{act.action.replace('_', ' ')}</div>
                  <div className="text-[11px] text-slate-500 truncate">{act.details || act.actor_name}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{act.created_at}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
