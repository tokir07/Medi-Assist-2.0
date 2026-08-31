import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Menu,
  Bell,
  ChevronDown,
  User as UserIcon,
  Settings,
  LogOut,
  Sparkles,
  Search,
} from 'lucide-react';
import { NotificationsModal } from '../notifications/NotificationsModal';

interface TopHeaderProps {
  onToggleSidebar?: () => void;
}

const PAGE_TITLES: Record<string, { title: string; subtitle: string }> = {
  // Patient Portal
  '/patient': { title: 'Patient Dashboard', subtitle: 'Overview of your personal health metrics & activities' },
  '/patient/': { title: 'Patient Dashboard', subtitle: 'Overview of your personal health metrics & activities' },
  '/patient/consultation': { title: 'AI Health Assistant', subtitle: 'Interactive clinical guidance and symptom triage' },
  '/patient/ai': { title: 'AI Health Assistant', subtitle: 'Interactive clinical guidance and symptom triage' },
  '/patient/voice': { title: 'Voice Health Assistant', subtitle: 'Hands-free voice consultation and voice commands' },
  '/patient/records': { title: 'Medical Records', subtitle: 'Encrypted document vault, lab results & clinical reports' },
  '/patient/prescriptions': { title: 'Prescriptions', subtitle: 'Active medication schedules, dosages & refill tracking' },
  '/patient/appointments': { title: 'Appointments', subtitle: 'Clinical visits, schedules & physician consultations' },
  '/patient/tips': { title: 'Health Tips', subtitle: 'Evidence-based preventive health & wellness education' },
  '/patient/health-tips': { title: 'Health Tips', subtitle: 'Evidence-based preventive health & wellness education' },
  '/patient/reminders': { title: 'Health Reminders', subtitle: 'Daily medication schedules, appointment alerts & wellness tasks' },
  '/patient/profile': { title: 'Patient Profile', subtitle: 'Personal medical profile, emergency contacts & demographics' },
  '/patient/settings': { title: 'Settings', subtitle: 'Account preferences, security and notification settings' },

  // Doctor Portal
  '/doctor': { title: 'Doctor Dashboard', subtitle: 'Physician command center, daily schedules & patient requests' },
  '/doctor/appointments': { title: 'Appointment & Schedule Management', subtitle: 'Manage consultation requests, working hours & days off' },
  '/doctor/patients': { title: 'Patient Directory', subtitle: 'Clinical directory of assigned patients & medical profiles' },
  '/doctor/records': { title: 'Patient Medical Records', subtitle: 'Encrypted patient clinical files & diagnostic lab reports' },
  '/doctor/consultation': { title: 'Consultation Workspace', subtitle: 'Clinical notes, diagnosis records & active visit workspace' },
  '/doctor/prescriptions': { title: 'Prescriptions & Templates', subtitle: 'Digital prescription builder, templates & upload manager' },
  '/doctor/messages': { title: 'Patient Messages & Reminders', subtitle: 'Secure physician-patient messaging & reminder dispatch' },
  '/doctor/notifications': { title: 'Clinical Notifications', subtitle: 'Real-time medical alerts, schedule changes & patient updates' },
  '/doctor/profile': { title: 'Doctor Profile', subtitle: 'Professional credentials, registration & specialization' },
  '/doctor/settings': { title: 'Doctor Settings', subtitle: 'Practice preferences, working hours & notification controls' },

  // Admin Portal
  '/admin': { title: 'Admin Dashboard', subtitle: 'Manage and monitor MediAssist platform activity' },
  '/admin/doctors': { title: 'Doctors Management', subtitle: 'Manage MediAssist doctor accounts & onboarding' },
  '/admin/patients': { title: 'Patients Management', subtitle: 'Manage registered patient accounts & account statuses' },
  '/admin/notifications': { title: 'Notifications Center', subtitle: 'Send platform notifications to patients & doctors' },
  '/admin/appointments': { title: 'Appointments Monitoring', subtitle: 'Monitor platform-wide consultations & appointment statuses' },
  '/admin/security': { title: 'Security & Activity', subtitle: 'System audit trails, admin activity & security monitoring' },
  '/admin/audit-logs': { title: 'Security & Activity', subtitle: 'System audit trails, admin activity & security monitoring' },
  '/admin/settings': { title: 'Admin Settings', subtitle: 'Platform settings & administrator preferences' },
};

export const TopHeader: React.FC<TopHeaderProps> = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login', { state: { message: 'You have been securely signed out.' } });
  };

  const displayName = user?.name || 'Administrator';
  const displayRole = user?.role === 'ADMIN' ? 'Super Admin' : user?.role ? user.role.charAt(0) + user.role.slice(1).toLowerCase() : 'Patient';
  const initial = displayName.charAt(0).toUpperCase();

  // Determine current page title
  const currentPath = location.pathname;
  const pageMeta =
    Object.entries(PAGE_TITLES).find(([path]) =>
      path === '/patient' || path === '/doctor' || path === '/admin'
        ? currentPath === path || currentPath === `${path}/`
        : currentPath.startsWith(path)
    )?.[1] || { title: 'MediAssist Portal', subtitle: 'Connected healthcare platform' };

  const isAdminRoute = currentPath.startsWith('/admin');
  const isDoctorRoute = currentPath.startsWith('/doctor');

  return (
    <>
      <header className="sticky top-0 z-30 h-16 bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Left: Mobile Toggle & Page Context Title */}
        <div className="flex items-center gap-3 min-w-0">
          {onToggleSidebar && (
            <button
              type="button"
              onClick={onToggleSidebar}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition cursor-pointer shrink-0"
              aria-label="Toggle Navigation"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <div className="min-w-0">
            <h1 className="text-sm sm:text-base font-bold text-slate-900 leading-tight truncate">
              {pageMeta.title}
            </h1>
            <p className="text-[11px] text-slate-500 truncate hidden md:block">
              {pageMeta.subtitle}
            </p>
          </div>
        </div>

        {/* Right: Notifications & User Profile */}
        <div className="flex items-center gap-3">
          {/* Notifications Button */}
          <button
            type="button"
            onClick={() => setNotificationsOpen(true)}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer relative"
            aria-label="View notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-teal-600" />
          </button>

          {/* User Profile Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-50 border border-slate-200 transition cursor-pointer"
            >
              <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-700 font-bold flex items-center justify-center text-xs">
                {initial}
              </div>

              <div className="hidden sm:flex flex-col text-left">
                <span className="text-xs font-bold text-slate-900 leading-tight truncate max-w-[120px]">
                  {displayName}
                </span>
                <span className="text-[10px] text-slate-400 font-medium">{displayRole}</span>
              </div>

              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-2xl shadow-xl py-1.5 z-50 animate-fadeIn text-xs">
                <div className="px-3.5 py-2 border-b border-slate-100 sm:hidden">
                  <p className="font-bold text-slate-900">{displayName}</p>
                  <p className="text-[10px] text-slate-500">{user?.email}</p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setDropdownOpen(false);
                    navigate(isAdminRoute ? '/admin/settings' : isDoctorRoute ? '/doctor/profile' : '/patient/profile');
                  }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-slate-700 hover:bg-slate-50 transition cursor-pointer text-left font-medium"
                >
                  <UserIcon className="w-4 h-4 text-slate-400" />
                  <span>My Profile</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setDropdownOpen(false);
                    navigate(isAdminRoute ? '/admin/settings' : isDoctorRoute ? '/doctor/settings' : '/patient/settings');
                  }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-slate-700 hover:bg-slate-50 transition cursor-pointer text-left font-medium"
                >
                  <Settings className="w-4 h-4 text-slate-400" />
                  <span>Settings</span>
                </button>

                <div className="my-1 border-t border-slate-100" />

                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-rose-600 hover:bg-rose-50 transition cursor-pointer text-left font-medium"
                >
                  <LogOut className="w-4 h-4 text-rose-600" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Notifications Modal */}
      <NotificationsModal
        isOpen={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
      />
    </>
  );
};
