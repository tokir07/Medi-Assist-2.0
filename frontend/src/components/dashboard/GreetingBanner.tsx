import React from 'react';
import { ShieldCheck, Heart } from 'lucide-react';

interface GreetingBannerProps {
  patientName: string;
}

export const GreetingBanner: React.FC<GreetingBannerProps> = ({ patientName }) => {
  const getGreetingTime = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const greetingTime = getGreetingTime();
  const firstName = patientName.split(' ')[0] || 'Patient';

  return (
    <div className="relative w-full rounded-2xl bg-gradient-to-r from-teal-50/70 via-white to-slate-50 border border-slate-200 p-5 sm:p-6 shadow-2xs overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Left: Greeting & Description */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md bg-teal-50 text-teal-700 border border-teal-200 text-[11px] font-bold">
              PATIENT CARE PORTAL
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            {greetingTime}, {firstName}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-normal leading-relaxed">
            Welcome to your personalized healthcare dashboard. Review your clinical records, active prescriptions, and upcoming appointments.
          </p>
        </div>

        {/* Right: Health Security Badge */}
        <div className="flex items-center gap-3 bg-white border border-slate-200 p-3 sm:p-3.5 rounded-xl shadow-2xs shrink-0 sm:max-w-xs">
          <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center text-teal-700 shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-900 leading-tight">
              Encrypted Medical Vault
            </p>
            <p className="text-[10px] text-slate-400">
              Zero unauthorized data access
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
