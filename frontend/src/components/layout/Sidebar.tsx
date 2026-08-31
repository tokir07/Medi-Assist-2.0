import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  MessageSquare,
  Mic,
  FileText,
  Pill,
  Calendar,
  Lightbulb,
  Bell,
  User as UserIcon,
  Settings,
  ShieldCheck,
  Users,
  Stethoscope,
  ShieldAlert,
} from 'lucide-react';
import logoImg from '../../assets/logo.png';

interface NavItem {
  name: string;
  path: string;
  icon: React.FC<{ className?: string }>;
}

const patientNavItems: NavItem[] = [
  { name: 'Dashboard', path: '/patient', icon: LayoutDashboard },
  { name: 'AI Assistant', path: '/patient/consultation', icon: MessageSquare },
  { name: 'Voice Assistant', path: '/patient/voice', icon: Mic },
  { name: 'My Records', path: '/patient/records', icon: FileText },
  { name: 'Prescriptions', path: '/patient/prescriptions', icon: Pill },
  { name: 'Appointments', path: '/patient/appointments', icon: Calendar },
  { name: 'Health Tips', path: '/patient/tips', icon: Lightbulb },
  { name: 'Reminders', path: '/patient/reminders', icon: Bell },
  { name: 'Profile', path: '/patient/profile', icon: UserIcon },
  { name: 'Settings', path: '/patient/settings', icon: Settings },
];

const doctorNavItems: NavItem[] = [
  { name: 'Dashboard', path: '/doctor', icon: LayoutDashboard },
  { name: 'Appointments', path: '/doctor/appointments', icon: Calendar },
  { name: 'Patients', path: '/doctor/patients', icon: Users },
  { name: 'Medical Records', path: '/doctor/records', icon: FileText },
  { name: 'Prescriptions', path: '/doctor/prescriptions', icon: Pill },
  { name: 'Messages', path: '/doctor/messages', icon: MessageSquare },
  { name: 'Notifications', path: '/doctor/notifications', icon: Bell },
  { name: 'Profile', path: '/doctor/profile', icon: UserIcon },
  { name: 'Settings', path: '/doctor/settings', icon: Settings },
];

const adminNavItems: NavItem[] = [
  { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
  { name: 'Doctors', path: '/admin/doctors', icon: Stethoscope },
  { name: 'Patients', path: '/admin/patients', icon: Users },
  { name: 'Notifications', path: '/admin/notifications', icon: Bell },
  { name: 'Appointments', path: '/admin/appointments', icon: Calendar },
  { name: 'Security & Activity', path: '/admin/security', icon: ShieldAlert },
  { name: 'Settings', path: '/admin/settings', icon: Settings },
];

export const Sidebar: React.FC<{ isOpen?: boolean; onClose?: () => void }> = ({
  isOpen = true,
  onClose,
}) => {
  const location = useLocation();
  const { role } = useAuth();

  const isAdminRoute = location.pathname.startsWith('/admin') || role === 'ADMIN';
  const isDoctorRoute = location.pathname.startsWith('/doctor') || role === 'DOCTOR';

  const activeNavItems = isAdminRoute
    ? adminNavItems
    : isDoctorRoute
    ? doctorNavItems
    : patientNavItems;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 z-40 lg:hidden backdrop-blur-xs"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 left-0 bottom-0 z-50 w-[240px] bg-white border-r border-slate-200 flex flex-col justify-between transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top Logo */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src={logoImg} alt="MediAssist Logo" className="h-8 w-auto object-contain" />
            <span className="font-bold text-lg tracking-tight text-slate-900">
              Medi<span className="text-teal-600">Assist</span>
            </span>
          </div>
        </div>

        {/* Middle Navigation Menu */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1 custom-scrollbar">
          {activeNavItems.map((item) => {
            const Icon = item.icon;
            const isBase = item.path === '/patient' || item.path === '/doctor' || item.path === '/admin';
            const isActive = isBase
              ? location.pathname === item.path || location.pathname === `${item.path}/`
              : location.pathname.startsWith(item.path);

            return (
              <NavLink
                key={item.name}
                to={item.path}
                onClick={() => {
                  if (onClose && window.innerWidth < 1024) {
                    onClose();
                  }
                }}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-teal-50 text-teal-700 font-semibold border-l-3 border-teal-600 shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 transition-colors ${
                    isActive ? 'text-teal-600' : 'text-slate-400 group-hover:text-slate-700'
                  }`}
                />
                <span className="truncate">{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom Role Identification Footer */}
        <div className="p-3.5 m-3 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-500 space-y-1">
          <div className="flex items-center gap-1.5 text-slate-700 font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-600 shrink-0" />
            <span>
              {isAdminRoute
                ? 'Super Admin Portal'
                : isDoctorRoute
                ? 'Secure Doctor Portal'
                : 'Secure Patient Portal'}
            </span>
          </div>
          <p className="text-[10px] text-slate-400 leading-tight">
            HIPAA & clinical privacy compliant data encryption.
          </p>
        </div>
      </aside>
    </>
  );
};
