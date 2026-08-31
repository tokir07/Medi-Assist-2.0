import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  UserCheck,
  Bell,
  Calendar,
  ShieldCheck,
  Settings,
  LogOut,
  ChevronDown,
  Shield,
  Activity,
} from 'lucide-react';

interface AdminSidebarProps {
  isOpen?: boolean;
  onCloseMobile?: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ isOpen, onCloseMobile }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const navItems = [
    { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/admin/doctors', label: 'Doctors', icon: Users },
    { to: '/admin/patients', label: 'Patients', icon: UserCheck },
    { to: '/admin/notifications', label: 'Notifications', icon: Bell },
    { to: '/admin/appointments', label: 'Appointments', icon: Calendar },
    { to: '/admin/security', label: 'Security & Activity', icon: ShieldCheck },
    { to: '/admin/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-full shrink-0 select-none">
      {/* Brand Header */}
      <div className="p-5 flex items-center gap-3 border-b border-slate-100/80">
        <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-200 text-teal-600 flex items-center justify-center font-black shadow-xs shrink-0">
          <Activity className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <h1 className="text-base font-extrabold text-slate-900 tracking-tight leading-tight">
            MediAssist
          </h1>
          <p className="text-[11px] text-slate-400 font-semibold tracking-wide">
            Admin Portal
          </p>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 p-3.5 space-y-1 overflow-y-auto custom-scrollbar">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={onCloseMobile}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-teal-50/90 text-teal-700 shadow-2xs font-extrabold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-semibold'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </div>

      {/* Promotional Vision Card */}
      <div className="p-3.5 pt-0">
        <div className="p-4 rounded-2xl bg-gradient-to-br from-teal-50/80 via-cyan-50/40 to-blue-50/60 border border-teal-100/70 text-slate-800 space-y-2 relative overflow-hidden shadow-2xs">
          <div className="space-y-0.5 relative z-10">
            <span className="text-[10px] font-bold text-teal-700 block">MediAssist</span>
            <p className="text-xs font-bold text-teal-900 leading-snug">
              Better Health.
              <br />
              <span className="text-cyan-700">Brighter Tomorrow.</span>
            </p>
            <p className="text-[10px] text-slate-500 leading-relaxed pt-1">
              We're here to support better healthcare every step of the way.
            </p>
          </div>

          <div className="pt-2 flex justify-end">
            <div className="w-10 h-10 rounded-xl bg-white/90 border border-teal-200/80 flex items-center justify-center text-teal-600 shadow-xs">
              <Shield className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* User Footer Profile Pill */}
      <div className="p-3.5 border-t border-slate-100 bg-slate-50/50">
        <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 text-slate-600 flex items-center justify-center font-bold text-xs shrink-0">
              {user?.name?.charAt(0) || 'A'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-900 truncate leading-snug">
                {user?.name || 'Admin User'}
              </p>
              <p className="text-[10px] text-slate-400 font-semibold truncate">
                Super Admin
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              logout();
              navigate('/login');
            }}
            title="Logout"
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
