import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, ArrowLeft, LayoutDashboard, Lock } from 'lucide-react';
import { Logo } from '../components/common/Logo';

export const AccessDenied: React.FC = () => {
  const { role, user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const getDashboardPath = () => {
    if (role === 'PATIENT') return '/patient';
    if (role === 'DOCTOR') return '/doctor';
    if (role === 'ADMIN') return '/admin';
    return '/login';
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-lg bg-white p-8 sm:p-10 rounded-2xl border border-slate-200 shadow-md text-center space-y-6 animate-fade-in">
        {/* Logo */}
        <div className="flex justify-center mb-2">
          <Logo size="md" />
        </div>

        {/* 403 Icon Header */}
        <div className="mx-auto w-16 h-16 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600 shadow-xs">
          <ShieldAlert className="w-9 h-9" />
        </div>

        {/* 403 Status Title */}
        <div>
          <span className="px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-widest bg-red-100 text-red-700 border border-red-200">
            403 — Forbidden
          </span>
          <h1 className="text-2xl font-bold text-slate-900 mt-3 tracking-tight">Access Denied</h1>
          <p className="text-sm text-slate-600 mt-1">
            You don't have permission to access this area.
          </p>
        </div>

        {/* Role Diagnostic Box */}
        {isAuthenticated && user && (
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-left space-y-2 text-slate-700">
            <div className="flex items-center justify-between font-medium">
              <span className="text-slate-500">Authenticated Identity:</span>
              <span className="font-semibold text-slate-800">{user.email}</span>
            </div>
            <div className="flex items-center justify-between font-medium">
              <span className="text-slate-500">Assigned Role:</span>
              <span className="px-2 py-0.5 rounded font-bold bg-slate-200 text-slate-800 uppercase">
                {role}
              </span>
            </div>
            <div className="pt-2 border-t border-slate-200/80 text-[11px] text-slate-500 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
              <span>Role-Based Access Control (RBAC) enforced by MediAssist security filters.</span>
            </div>
          </div>
        )}

        {/* Navigation Action */}
        <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => navigate(getDashboardPath())}
            className="w-full sm:w-auto py-2.5 px-6 bg-[#0D9488] hover:bg-[#0F766E] text-white font-semibold text-sm rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Return to Dashboard</span>
          </button>
          
          <button
            onClick={() => navigate(-1)}
            className="w-full sm:w-auto py-2.5 px-5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Go Back</span>
          </button>
        </div>
      </div>
    </div>
  );
};
