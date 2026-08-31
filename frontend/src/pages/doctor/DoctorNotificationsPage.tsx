import React, { useState } from 'react';
import {
  Bell,
  Calendar,
  FileText,
  MessageSquare,
  AlertCircle,
  CheckCircle2,
  Clock,
  ShieldCheck,
} from 'lucide-react';

export const DoctorNotificationsPage: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<string>('All');

  const [notifications] = useState([
    {
      id: 'notif-1',
      category: 'Appointments',
      title: 'New Appointment Request',
      message: 'Rahul Sharma requested a Video Consultation slot for 2 Sep, 10:00 AM.',
      timestamp: '10 min ago',
      unread: true,
      icon: Calendar,
      color: 'text-amber-600 bg-amber-50 border-amber-200',
    },
    {
      id: 'notif-2',
      category: 'Patients',
      title: 'New Medical Report Uploaded',
      message: 'Priya Singh uploaded a CBC Blood Count Report.',
      timestamp: '1 hour ago',
      unread: true,
      icon: FileText,
      color: 'text-teal-600 bg-teal-50 border-teal-200',
    },
    {
      id: 'notif-3',
      category: 'Messages',
      title: 'New Patient Message',
      message: 'Amit Kumar sent a message regarding fasting blood sugar test results.',
      timestamp: '2 hours ago',
      unread: false,
      icon: MessageSquare,
      color: 'text-purple-600 bg-purple-50 border-purple-200',
    },
    {
      id: 'notif-4',
      category: 'Appointments',
      title: 'Upcoming Consultation Reminder',
      message: 'Consultation with Neha Gupta starts in 30 minutes.',
      timestamp: '3 hours ago',
      unread: false,
      icon: Clock,
      color: 'text-blue-600 bg-blue-50 border-blue-200',
    },
    {
      id: 'notif-5',
      category: 'System',
      title: 'MediAssist Clinical Policy Update',
      message: 'Updated HIPAA data protection rules have taken effect for digital prescriptions.',
      timestamp: '1 day ago',
      unread: false,
      icon: ShieldCheck,
      color: 'text-slate-600 bg-slate-100 border-slate-200',
    },
  ]);

  const filtered =
    activeCategory === 'All'
      ? notifications
      : notifications.filter((n) => n.category.toLowerCase() === activeCategory.toLowerCase());

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
          <Bell className="w-6 h-6 text-teal-600" />
          <span>Notifications Feed</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Stay updated on appointment requests, patient reports, messages, and clinical reminders.
        </p>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-1 custom-scrollbar">
        {['All', 'Appointments', 'Patients', 'Messages', 'System'].map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
              activeCategory === cat
                ? 'bg-teal-600 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filtered.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.id}
              className={`bg-white rounded-2xl border p-4 shadow-xs flex items-start gap-4 transition-all ${
                item.unread ? 'border-teal-200 bg-teal-50/20' : 'border-slate-200'
              }`}
            >
              <div className={`p-2.5 rounded-xl border shrink-0 ${item.color}`}>
                <Icon className="w-5 h-5" />
              </div>

              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900">{item.title}</h3>
                  <span className="text-[11px] text-slate-400 font-medium">{item.timestamp}</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{item.message}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
