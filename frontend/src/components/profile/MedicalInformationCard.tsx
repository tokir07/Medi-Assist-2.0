import React from 'react';
import { ShieldAlert } from 'lucide-react';
import type { PatientProfile } from '../../types/profile';

interface MedicalInformationCardProps {
  profile: PatientProfile | null;
}

export const MedicalInformationCard: React.FC<MedicalInformationCardProps> = ({
  profile,
}) => {
  return (
    <div className="bg-white rounded-3xl border border-[#D9E1EA]/80 p-5 sm:p-6 shadow-[0_4px_20px_rgba(16,42,86,0.03)] space-y-5">
      {/* Card Header */}
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-[#E6F7F7] text-[#0FA3A3] flex items-center justify-center shrink-0 shadow-2xs">
          <ShieldAlert className="w-4 h-4" />
        </div>
        <h3 className="text-sm sm:text-base font-bold text-[#102A56]">
          Medical Information
        </h3>
      </div>

      {/* 2-Column Data Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8">
        {/* Allergies */}
        <div className="space-y-1">
          <span className="text-[11px] font-semibold text-[#8A98AA] block uppercase tracking-wider">
            Allergies
          </span>
          <span className="text-xs sm:text-sm font-bold text-[#102A56] block">
            {profile?.allergies || 'Pollen, Penicillin'}
          </span>
        </div>

        {/* Current Medications */}
        <div className="space-y-1">
          <span className="text-[11px] font-semibold text-[#8A98AA] block uppercase tracking-wider">
            Current Medications
          </span>
          <span className="text-xs sm:text-sm font-bold text-[#102A56] block">
            {profile?.current_medications || 'Atorvastatin 10mg (Daily)'}
          </span>
        </div>

        {/* Chronic Conditions */}
        <div className="space-y-1">
          <span className="text-[11px] font-semibold text-[#8A98AA] block uppercase tracking-wider">
            Chronic Conditions
          </span>
          <span className="text-xs sm:text-sm font-bold text-[#102A56] block">
            {profile?.chronic_conditions || 'None'}
          </span>
        </div>

        {/* Primary Physician */}
        <div className="space-y-1">
          <span className="text-[11px] font-semibold text-[#8A98AA] block uppercase tracking-wider">
            Primary Physician
          </span>
          <div className="space-y-0.5">
            <span className="text-xs sm:text-sm font-bold text-[#102A56] block">
              {profile?.primary_physician || 'Dr. Priya Sharma'}
            </span>
            <span className="text-[11px] text-[#5F6F86] block">
              {profile?.primary_physician_specialty || 'General Physician'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
