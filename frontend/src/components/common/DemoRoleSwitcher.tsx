import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { UserCheck, ShieldAlert, Code2, ChevronUp, ChevronDown, LogOut } from 'lucide-react';
import type { UserRole } from '../../types/auth';

export const DemoRoleSwitcher: React.FC = () => {
  const { demoLogin, role, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [loadingRole, setLoadingRole] = useState<UserRole | null>(null);

  const handleRoleSwitch = async (targetRole: UserRole, email: string) => {
    setLoadingRole(targetRole);
    try {
      const activeRole = await demoLogin(email, 'Password123!');
      if (activeRole === 'PATIENT') navigate('/patient');
      else if (activeRole === 'DOCTOR') navigate('/doctor');
      else if (activeRole === 'ADMIN') navigate('/admin');
    } catch (err) {
      console.error('Demo login failed', err);
    } finally {
      setLoadingRole(null);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 shadow-xl rounded-xl border border-slate-300 bg-white text-slate-800 text-xs font-sans overflow-hidden transition-all duration-200">
      {/* Dev Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-3 px-3.5 py-2.5 bg-slate-900 text-white font-medium hover:bg-slate-800 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <Code2 className="w-4 h-4 text-teal-400" />
          <span className="font-semibold tracking-wide uppercase text-[11px] text-teal-300">RBAC Demo Switcher</span>
        </div>
        <div className="flex items-center gap-2">
          {isAuthenticated && role && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
              Active: {role}
            </span>
          )}
          {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </div>
      </button>

      {/* Expanded Demo Controls */}
      {isOpen && (
        <div className="p-3.5 bg-slate-50 space-y-3 border-t border-slate-200 w-72">
          <p className="text-[11px] text-slate-500 leading-snug">
            Prototype tool to quickly test authentication, role-based access control, and route guards.
          </p>

          <div className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Quick Login Demo Accounts:</span>

            <button
              onClick={() => handleRoleSwitch('PATIENT', 'patient@mediassist.test')}
              disabled={loadingRole !== null}
              className={`w-full flex items-center justify-between p-2 rounded-lg border transition-all cursor-pointer ${
                role === 'PATIENT'
                  ? 'bg-teal-50 border-teal-300 font-semibold text-teal-900'
                  : 'bg-white border-slate-200 hover:bg-slate-100 text-slate-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-teal-600" />
                <div className="text-left">
                  <div className="font-medium text-xs">Test Patient</div>
                  <div className="text-[10px] text-slate-400">patient@mediassist.test</div>
                </div>
              </div>
              {loadingRole === 'PATIENT' ? (
                <span className="text-[10px] text-teal-600 font-medium">Signing in...</span>
              ) : role === 'PATIENT' ? (
                <span className="text-[10px] bg-teal-600 text-white px-1.5 py-0.5 rounded">Active</span>
              ) : null}
            </button>

            <button
              onClick={() => handleRoleSwitch('DOCTOR', 'doctor@mediassist.test')}
              disabled={loadingRole !== null}
              className={`w-full flex items-center justify-between p-2 rounded-lg border transition-all cursor-pointer ${
                role === 'DOCTOR'
                  ? 'bg-blue-50 border-blue-300 font-semibold text-blue-900'
                  : 'bg-white border-slate-200 hover:bg-slate-100 text-slate-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-blue-600" />
                <div className="text-left">
                  <div className="font-medium text-xs">Test Doctor</div>
                  <div className="text-[10px] text-slate-400">doctor@mediassist.test</div>
                </div>
              </div>
              {loadingRole === 'DOCTOR' ? (
                <span className="text-[10px] text-blue-600 font-medium">Signing in...</span>
              ) : role === 'DOCTOR' ? (
                <span className="text-[10px] bg-blue-600 text-white px-1.5 py-0.5 rounded">Active</span>
              ) : null}
            </button>

            <button
              onClick={() => handleRoleSwitch('ADMIN', 'admin@mediassist')}
              disabled={loadingRole !== null}
              className={`w-full flex items-center justify-between p-2 rounded-lg border transition-all cursor-pointer ${
                role === 'ADMIN'
                  ? 'bg-purple-50 border-purple-300 font-semibold text-purple-900'
                  : 'bg-white border-slate-200 hover:bg-slate-100 text-slate-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-purple-600" />
                <div className="text-left">
                  <div className="font-medium text-xs">System Admin</div>
                  <div className="text-[10px] text-slate-400">admin@mediassist</div>
                </div>
              </div>
              {loadingRole === 'ADMIN' ? (
                <span className="text-[10px] text-purple-600 font-medium">Signing in...</span>
              ) : role === 'ADMIN' ? (
                <span className="text-[10px] bg-purple-600 text-white px-1.5 py-0.5 rounded">Active</span>
              ) : null}
            </button>
          </div>

          <div className="pt-2 border-t border-slate-200 space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Test Forbidden Routes (403):</span>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => navigate('/doctor')}
                className="px-2 py-1.5 bg-slate-200/80 hover:bg-slate-300 rounded text-slate-700 text-[11px] font-medium flex items-center justify-center gap-1 cursor-pointer"
              >
                <ShieldAlert className="w-3 h-3 text-amber-600" />
                Try /doctor
              </button>
              <button
                onClick={() => navigate('/admin')}
                className="px-2 py-1.5 bg-slate-200/80 hover:bg-slate-300 rounded text-slate-700 text-[11px] font-medium flex items-center justify-center gap-1 cursor-pointer"
              >
                <ShieldAlert className="w-3 h-3 text-red-600" />
                Try /admin
              </button>
            </div>
          </div>

          {isAuthenticated && (
            <div className="pt-2 border-t border-slate-200">
              <button
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
                className="w-full py-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded border border-red-200 font-medium flex items-center justify-center gap-1.5 text-xs transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out Current Session
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
