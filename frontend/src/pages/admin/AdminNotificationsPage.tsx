import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import type { PushNotificationItem } from '../../services/adminService';
import {
  Bell,
  Send,
  Users,
  Stethoscope,
  Search,
  CheckCircle2,
  AlertTriangle,
  X,
  Loader2,
  FileText,
  Clock,
} from 'lucide-react';

export const AdminNotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<PushNotificationItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState<string>('MediAssist Platform Update');
  const [message, setMessage] = useState<string>(
    'Scheduled maintenance has been completed. All health records and appointment scheduling services are operating smoothly.'
  );
  const [audience, setAudience] = useState<string>('ALL_PATIENTS');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await adminService.getNotifications();
      setNotifications(res.notifications || []);
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

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;
    setShowConfirmModal(true);
  };

  const handleConfirmSend = async () => {
    try {
      await adminService.sendNotification({
        title,
        message,
        target_audience: audience,
        recipient_user_ids: selectedUserIds,
      });
      showToast('Notification sent successfully!');
      setShowConfirmModal(false);
      setTitle('');
      setMessage('');
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const estimatedRecipients =
    audience === 'ALL_PATIENTS'
      ? 1248
      : audience === 'ALL_DOCTORS'
      ? 34
      : selectedUserIds.length || 1;

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-teal-800 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 text-sm font-semibold animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-5 h-5 text-teal-300 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Bell className="w-6 h-6 text-purple-600" />
            <span>Platform Notifications Center</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Dispatch platform notifications and broadcast health updates to patients and doctors.
          </p>
        </div>
      </div>

      {/* Send Notification Form Card */}
      <form onSubmit={handleFormSubmit} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
        <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
          <Send className="w-4 h-4 text-teal-600" />
          <span>Compose New Push Notification</span>
        </h2>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Notification Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Scheduled System Maintenance / Health Alert"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Message Content *</label>
            <textarea
              rows={3}
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write clear notification message..."
              className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-2">Target Audience Selection *</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { id: 'ALL_PATIENTS', title: 'All Patients', desc: '1,248 active patients', icon: Users },
                { id: 'ALL_DOCTORS', title: 'All Doctors', desc: '34 practicing physicians', icon: Stethoscope },
                { id: 'SELECTED_PATIENTS', title: 'Selected Patients', desc: 'Choose specific patients', icon: Users },
                { id: 'SELECTED_DOCTORS', title: 'Selected Doctors', desc: 'Choose specific doctors', icon: Stethoscope },
              ].map((item) => {
                const Icon = item.icon;
                const isSelected = audience === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setAudience(item.id)}
                    className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-teal-50 border-teal-500 shadow-2xs'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <Icon className={`w-4 h-4 ${isSelected ? 'text-teal-600' : 'text-slate-400'}`} />
                      <input type="radio" checked={isSelected} readOnly className="accent-teal-600" />
                    </div>
                    <div className="mt-2">
                      <div className="text-xs font-bold text-slate-900">{item.title}</div>
                      <div className="text-[10px] text-slate-500">{item.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-2xs transition-all cursor-pointer flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            <span>Send Notification</span>
          </button>
        </div>
      </form>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <Bell className="w-5 h-5 text-teal-600" />
                <span>Confirm Push Notification</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl space-y-2 text-xs">
              <div>
                <span className="text-slate-400 block font-medium">Title:</span>
                <span className="font-bold text-slate-900">{title}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Target Audience:</span>
                <span className="font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md">
                  {audience.replace('_', ' ')} (~{estimatedRecipients} recipients)
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSend}
                className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-2xs transition-all cursor-pointer"
              >
                Confirm & Send Notification
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notification History Table */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-slate-900">Notification Dispatch History</h2>

        {loading ? (
          <div className="py-8 text-center text-xs text-slate-500">Loading notification history...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/50 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-3 px-4">Title</th>
                  <th className="py-3 px-4">Audience</th>
                  <th className="py-3 px-4">Sent By</th>
                  <th className="py-3 px-4">Recipients</th>
                  <th className="py-3 px-4">Sent At</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {notifications.map((n) => (
                  <tr key={n.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{n.title}</td>
                    <td className="py-3.5 px-4 font-medium text-slate-600">{n.target_audience}</td>
                    <td className="py-3.5 px-4 text-slate-500">{n.sent_by}</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-teal-700">{n.recipients_count}</td>
                    <td className="py-3.5 px-4 text-slate-500">{n.sent_at}</td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
                        {n.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
