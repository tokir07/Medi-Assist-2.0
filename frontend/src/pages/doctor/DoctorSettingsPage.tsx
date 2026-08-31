import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Settings, Bell, Shield, Lock, CheckCircle2, LogOut } from 'lucide-react';

export const DoctorSettingsPage: React.FC = () => {
  const { logout } = useAuth();

  const [reqNotif, setReqNotif] = useState<boolean>(true);
  const [remNotif, setRemNotif] = useState<boolean>(true);
  const [msgNotif, setMsgNotif] = useState<boolean>(true);
  const [reportNotif, setReportNotif] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
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
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
          <Settings className="w-6 h-6 text-teal-600" />
          <span>Doctor Portal Settings</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Manage clinical notifications, account security, and portal session preferences.
        </p>
      </div>

      {/* Notification Preferences */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="border-b border-slate-100 pb-3 flex items-center gap-2">
          <Bell className="w-5 h-5 text-teal-600" />
          <h2 className="text-base font-bold text-slate-900">Notification Preferences</h2>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
            <div>
              <span className="text-xs font-bold text-slate-900 block">Appointment Request Alerts</span>
              <span className="text-[11px] text-slate-500">Notify instantly when a patient requests an appointment slot.</span>
            </div>
            <input
              type="checkbox"
              checked={reqNotif}
              onChange={(e) => {
                setReqNotif(e.target.checked);
                showToast('Notification settings updated');
              }}
              className="w-4 h-4 text-teal-600 accent-teal-600 rounded cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
            <div>
              <span className="text-xs font-bold text-slate-900 block">Patient Message Notifications</span>
              <span className="text-[11px] text-slate-500">Get notified when patients send messages in chat.</span>
            </div>
            <input
              type="checkbox"
              checked={msgNotif}
              onChange={(e) => {
                setMsgNotif(e.target.checked);
                showToast('Notification settings updated');
              }}
              className="w-4 h-4 text-teal-600 accent-teal-600 rounded cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
            <div>
              <span className="text-xs font-bold text-slate-900 block">Lab Report Upload Notifications</span>
              <span className="text-[11px] text-slate-500">Notify when patients upload new diagnostic reports.</span>
            </div>
            <input
              type="checkbox"
              checked={reportNotif}
              onChange={(e) => {
                setReportNotif(e.target.checked);
                showToast('Notification settings updated');
              }}
              className="w-4 h-4 text-teal-600 accent-teal-600 rounded cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Security & Logout */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="border-b border-slate-100 pb-3 flex items-center gap-2">
          <Shield className="w-5 h-5 text-teal-600" />
          <h2 className="text-base font-bold text-slate-900">Security & Session</h2>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
          <div>
            <span className="text-xs font-bold text-slate-900 block">Sign Out of Doctor Session</span>
            <span className="text-[11px] text-slate-500">End your current session on this device.</span>
          </div>

          <button
            type="button"
            onClick={logout}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-2xs shrink-0"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
};
