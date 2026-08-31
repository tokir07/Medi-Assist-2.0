import React from 'react';
import { X, Bell, Calendar, Pill, CheckCircle2, ShieldCheck, Clock } from 'lucide-react';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const notifications = [
    {
      id: 'notif-1',
      title: 'Upcoming Appointment Reminder',
      description: 'Your clinical consultation is scheduled for tomorrow at 10:30 AM.',
      time: '10 mins ago',
      icon: <Calendar className="w-4 h-4 text-blue-600" />,
      bg: 'bg-blue-50 border-blue-200',
    },
    {
      id: 'notif-2',
      title: 'Medication Schedule Active',
      description: 'Remember to take your prescribed daily morning doses with water.',
      time: '1 hour ago',
      icon: <Pill className="w-4 h-4 text-purple-600" />,
      bg: 'bg-purple-50 border-purple-200',
    },
    {
      id: 'notif-3',
      title: 'Account Security Verified',
      description: 'Encrypted patient session active with multi-layer authorization.',
      time: 'Today',
      icon: <ShieldCheck className="w-4 h-4 text-teal-600" />,
      bg: 'bg-teal-50 border-teal-200',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white w-full max-w-md rounded-2xl border border-slate-200 shadow-2xl overflow-hidden text-xs">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center font-bold">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 leading-tight">
                Notifications & Alerts
              </h3>
              <p className="text-[10px] text-slate-400">Clinical alerts and schedule notices</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* List */}
        <div className="p-4 space-y-2.5 max-h-[60vh] overflow-y-auto custom-scrollbar">
          {notifications.map((n) => (
            <div
              key={n.id}
              className="p-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50/80 transition flex items-start gap-3"
            >
              <div className={`w-8 h-8 rounded-lg border ${n.bg} flex items-center justify-center shrink-0`}>
                {n.icon}
              </div>
              <div className="space-y-0.5 min-w-0 flex-1">
                <h4 className="text-xs font-bold text-slate-900 leading-tight">
                  {n.title}
                </h4>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  {n.description}
                </p>
                <span className="text-[10px] text-slate-400 flex items-center gap-1 pt-1">
                  <Clock className="w-3 h-3" />
                  {n.time}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-slate-100 bg-slate-50/70 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold text-xs transition cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
