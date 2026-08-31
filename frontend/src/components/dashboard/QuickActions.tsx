import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Mic, UploadCloud, Calendar, Pill, ArrowRight } from 'lucide-react';

interface QuickActionItem {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  path: string;
}

const actions: QuickActionItem[] = [
  {
    title: 'Chat with AI',
    subtitle: 'Instant symptom triage',
    icon: <MessageSquare className="w-4 h-4" />,
    iconBg: 'bg-teal-50 border-teal-200',
    iconColor: 'text-teal-700',
    path: '/patient/consultation',
  },
  {
    title: 'Voice Assistant',
    subtitle: 'Hands-free consult',
    icon: <Mic className="w-4 h-4" />,
    iconBg: 'bg-blue-50 border-blue-200',
    iconColor: 'text-blue-700',
    path: '/patient/voice',
  },
  {
    title: 'Upload Record',
    subtitle: 'Add medical reports',
    icon: <UploadCloud className="w-4 h-4" />,
    iconBg: 'bg-emerald-50 border-emerald-200',
    iconColor: 'text-emerald-700',
    path: '/patient/records',
  },
  {
    title: 'Book Appointment',
    subtitle: 'Schedule clinic visit',
    icon: <Calendar className="w-4 h-4" />,
    iconBg: 'bg-blue-50 border-blue-200',
    iconColor: 'text-blue-700',
    path: '/patient/appointments',
  },
  {
    title: 'Prescriptions',
    subtitle: 'Active medications',
    icon: <Pill className="w-4 h-4" />,
    iconBg: 'bg-purple-50 border-purple-200',
    iconColor: 'text-purple-700',
    path: '/patient/prescriptions',
  },
];

export const QuickActions: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm sm:text-base font-bold text-slate-900">Quick Clinical Actions</h2>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {actions.map((action) => (
          <button
            key={action.title}
            type="button"
            onClick={() => navigate(action.path)}
            className="flex flex-col items-start p-3.5 sm:p-4 bg-white hover:bg-slate-50 active:bg-slate-100 border border-slate-200 rounded-xl shadow-2xs hover:shadow-xs transition text-left cursor-pointer group"
          >
            <div
              className={`w-9 h-9 rounded-lg border ${action.iconBg} ${action.iconColor} flex items-center justify-center mb-2.5 transition shadow-2xs`}
            >
              {action.icon}
            </div>
            <span className="text-xs sm:text-sm font-bold text-slate-900 leading-snug group-hover:text-teal-700 transition">
              {action.title}
            </span>
            <span className="text-[11px] text-slate-500 mt-0.5 font-normal line-clamp-1">
              {action.subtitle}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};
