import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  ClipboardList,
  Calendar,
  FileText,
  Pill,
  User as UserIcon,
  Users,
  Stethoscope,
  Activity,
  Settings,
  History
} from 'lucide-react';
import type { UserRole } from '../../types/auth';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

export const Navigation: React.FC = () => {
  const { role } = useAuth();

  const getNavItems = (currentRole: UserRole | null): NavItem[] => {
    switch (currentRole) {
      case 'PATIENT':
        return [
          { label: 'Dashboard', path: '/patient', icon: <LayoutDashboard className="w-4 h-4" /> },
          { label: 'Pre-Consultation', path: '/patient/pre-consultation', icon: <ClipboardList className="w-4 h-4" /> },
          { label: 'Appointments', path: '/patient/appointments', icon: <Calendar className="w-4 h-4" /> },
          { label: 'Medical Records', path: '/patient/records', icon: <FileText className="w-4 h-4" /> },
          { label: 'Prescriptions', path: '/patient/prescriptions', icon: <Pill className="w-4 h-4" /> },
          { label: 'Profile', path: '/patient/profile', icon: <UserIcon className="w-4 h-4" /> }
        ];

      case 'DOCTOR':
        return [
          { label: 'Dashboard', path: '/doctor', icon: <LayoutDashboard className="w-4 h-4" /> },
          { label: 'Patient Queue', path: '/doctor/queue', icon: <Activity className="w-4 h-4" /> },
          { label: 'Pre-Consultations', path: '/doctor/pre-consultations', icon: <ClipboardList className="w-4 h-4" /> },
          { label: 'Appointments', path: '/doctor/appointments', icon: <Calendar className="w-4 h-4" /> },
          { label: 'Patients', path: '/doctor/patients', icon: <Users className="w-4 h-4" /> },
          { label: 'Medical Records', path: '/doctor/records', icon: <FileText className="w-4 h-4" /> }
        ];

      case 'ADMIN':
        return [
          { label: 'Dashboard', path: '/admin', icon: <LayoutDashboard className="w-4 h-4" /> },
          { label: 'Users', path: '/admin/users', icon: <Users className="w-4 h-4" /> },
          { label: 'Doctors', path: '/admin/doctors', icon: <Stethoscope className="w-4 h-4" /> },
          { label: 'Patients', path: '/admin/patients', icon: <UserIcon className="w-4 h-4" /> },
          { label: 'Audit Logs', path: '/admin/audit', icon: <History className="w-4 h-4" /> },
          { label: 'Settings', path: '/admin/settings', icon: <Settings className="w-4 h-4" /> }
        ];

      default:
        return [];
    }
  };

  const navItems = getNavItems(role);

  return (
    <nav className="flex items-center gap-1 overflow-x-auto py-1">
      {navItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          end={item.path === '/patient' || item.path === '/doctor' || item.path === '/admin'}
          className={({ isActive }) =>
            `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              isActive
                ? 'bg-teal-50 text-teal-800 font-semibold border border-teal-200/80 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
            }`
          }
        >
          {item.icon}
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
};
