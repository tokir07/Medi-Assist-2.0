import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import {
  Search,
  Bell,
  Menu,
  ChevronDown,
  User,
  LogOut,
  Shield,
  ArrowLeftRight,
} from 'lucide-react';

interface AdminTopHeaderProps {
  onToggleSidebar?: () => void;
  openCreateDoctor?: () => void;
}

export const AdminTopHeader: React.FC<AdminTopHeaderProps> = ({
  onToggleSidebar,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [profileOpen, setProfileOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Determine title and subtitle based on current route
  const getHeaderInfo = () => {
    const path = location.pathname;
    if (path.includes('/admin/doctors')) {
      return {
        title: 'Doctors',
        subtitle: 'Manage and verify MediAssist doctors',
      };
    }
    if (path.includes('/admin/patients')) {
      return {
        title: 'Patients',
        subtitle: 'Manage patient accounts and security states',
      };
    }
    if (path.includes('/admin/notifications')) {
      return {
        title: 'Notifications',
        subtitle: 'Send and track system-wide push broadcasts',
      };
    }
    if (path.includes('/admin/appointments')) {
      return {
        title: 'Appointments',
        subtitle: "Administrative oversight of today's and upcoming visits",
      };
    }
    if (path.includes('/admin/security') || path.includes('/admin/audit-logs')) {
      return {
        title: 'Security & Activity',
        subtitle: 'Immutable audit trail and access logs',
      };
    }
    if (path.includes('/admin/settings')) {
      return {
        title: 'Settings',
        subtitle: 'Configure platform parameters and security controls',
      };
    }
    return {
      title: 'Dashboard',
      subtitle: 'Overview of MediAssist platform',
    };
  };

  const { title, subtitle } = getHeaderInfo();

  return (
    <header className="h-20 bg-white border-b border-slate-200/80 px-4 sm:px-8 flex items-center justify-between gap-4 sticky top-0 z-30 select-none">
      {/* Left: Mobile trigger & Page Info */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition cursor-pointer"
          title="Open Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="min-w-0">
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-tight truncate">
            {title}
          </h2>
          <p className="text-xs text-slate-500 font-medium truncate">
            {subtitle}
          </p>
        </div>
      </div>

      {/* Right: Search, Notifications & Admin Profile */}
      <div className="flex items-center gap-3 sm:gap-4 shrink-0">
        {/* Global Search Input */}
        <div className="relative hidden md:block w-64 lg:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search patients, doctors, appointments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-14 py-2 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-hidden font-medium transition"
          />
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded bg-white border border-slate-200 text-[10px] font-mono text-slate-400 shadow-2xs">
            Ctrl + K
          </div>
        </div>

        {/* Notification Bell with Badge */}
        <button
          type="button"
          onClick={() => navigate('/admin/notifications')}
          className="p-2.5 rounded-xl border border-slate-200/80 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition relative cursor-pointer"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white font-bold text-[9px] flex items-center justify-center border-2 border-white shadow-xs">
            9
          </span>
        </button>

        {/* Profile Dropdown Pill */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2.5 p-1.5 pr-2.5 rounded-xl hover:bg-slate-50 transition border border-slate-200/80 cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs">
              {user?.name?.charAt(0) || 'A'}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-bold text-slate-900 leading-tight">
                {user?.name || 'Admin User'}
              </p>
              <p className="text-[10px] text-slate-400 font-semibold leading-tight">
                Super Admin
              </p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {/* Dropdown Menu */}
          {profileOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl border border-slate-200 shadow-xl py-2 z-50 animate-fadeIn text-xs">
              <div className="px-4 py-2 border-b border-slate-100">
                <p className="font-bold text-slate-900">{user?.name || 'System Administrator'}</p>
                <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
                <span className="mt-1 inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
                  SUPER ADMIN
                </span>
              </div>

              <div className="py-1">
                <button
                  type="button"
                  onClick={() => {
                    setProfileOpen(false);
                    navigate('/patient');
                  }}
                  className="w-full px-4 py-2 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2 font-medium cursor-pointer"
                >
                  <ArrowLeftRight className="w-3.5 h-3.5 text-teal-600" />
                  <span>Switch to Patient Portal</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setProfileOpen(false);
                    navigate('/admin/settings');
                  }}
                  className="w-full px-4 py-2 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2 font-medium cursor-pointer"
                >
                  <Shield className="w-3.5 h-3.5 text-slate-400" />
                  <span>Security & Settings</span>
                </button>
              </div>

              <div className="pt-1 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setProfileOpen(false);
                    logout();
                    navigate('/login');
                  }}
                  className="w-full px-4 py-2 text-left text-rose-600 hover:bg-rose-50 flex items-center gap-2 font-bold cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
