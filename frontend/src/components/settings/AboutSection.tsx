import React from 'react';
import { ShieldCheck, Heart, FileText, ExternalLink } from 'lucide-react';

export const AboutSection: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl border border-[#D9E1EA]/80 p-5 sm:p-7 shadow-[0_4px_20px_rgba(16,42,86,0.03)] space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#E6F7F7] text-[#0FA3A3] flex items-center justify-center shrink-0 border border-[#B2F5EA]/60 shadow-2xs font-extrabold text-xl">
            +
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-extrabold text-[#102A56]">
              MediAssist Web Application
            </h3>
            <span className="inline-block text-xs font-bold text-[#0FA3A3] bg-[#E6F7F7] px-2.5 py-0.5 rounded-full mt-0.5">
              Version 1.0.0 (Production Build)
            </span>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-[#5F6F86] leading-relaxed">
          MediAssist is an AI-augmented intelligent healthcare assistant designed to empower patients with seamless appointment booking, real-time prescription tracking, personalized health tips, smart reminders, and clinical voice consults.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="p-4 rounded-2xl bg-[#F7FAFF] border border-[#E7EDF4] space-y-1.5">
            <div className="flex items-center gap-2 text-[#0FA3A3]">
              <ShieldCheck className="w-4 h-4" />
              <span className="text-xs font-bold text-[#102A56]">Data Privacy & Security</span>
            </div>
            <p className="text-[11px] text-[#5F6F86]">
              End-to-end encrypted medical records, compliant with HIPAA and regional health data privacy standards.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#F7FAFF] border border-[#E7EDF4] space-y-1.5">
            <div className="flex items-center gap-2 text-[#2F80ED]">
              <Heart className="w-4 h-4" />
              <span className="text-xs font-bold text-[#102A56]">Clinical Disclaimer</span>
            </div>
            <p className="text-[11px] text-[#5F6F86]">
              AI recommendations and tips are for guidance only. Always follow the explicit instructions of your licensed physician.
            </p>
          </div>
        </div>

        <div className="pt-4 border-t border-[#F0F4F8] flex flex-wrap items-center justify-between gap-4 text-xs font-semibold text-[#5F6F86]">
          <span>© 2026 MediAssist Health Technologies Inc.</span>
          <div className="flex items-center gap-4">
            <a href="#terms" onClick={(e) => e.preventDefault()} className="hover:text-[#0FA3A3] hover:underline">
              Terms of Service
            </a>
            <a href="#privacy" onClick={(e) => e.preventDefault()} className="hover:text-[#0FA3A3] hover:underline">
              Privacy Policy
            </a>
            <a href="#support" onClick={(e) => e.preventDefault()} className="hover:text-[#0FA3A3] hover:underline">
              Support Center
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
