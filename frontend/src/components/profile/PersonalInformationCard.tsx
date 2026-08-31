import React from 'react';
import { UserCheck } from 'lucide-react';
import type { PatientProfile } from '../../types/profile';

interface PersonalInformationCardProps {
  profile: PatientProfile | null;
}

export const PersonalInformationCard: React.FC<PersonalInformationCardProps> = ({
  profile,
}) => {
  return (
    <div className="bg-white rounded-3xl border border-[#D9E1EA]/80 p-5 sm:p-6 shadow-[0_4px_20px_rgba(16,42,86,0.03)] space-y-5">
      {/* Card Header */}
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-[#E6F7F7] text-[#0FA3A3] flex items-center justify-center shrink-0 shadow-2xs">
          <UserCheck className="w-4 h-4" />
        </div>
        <h3 className="text-sm sm:text-base font-bold text-[#102A56]">
          Personal Information
        </h3>
      </div>

      {/* 2-Column Data Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8">
        {/* Full Name */}
        <div className="space-y-1">
          <span className="text-[11px] font-semibold text-[#8A98AA] block uppercase tracking-wider">
            Full Name
          </span>
          <span className="text-xs sm:text-sm font-bold text-[#102A56] block">
            {profile?.full_name || 'John Doe'}
          </span>
        </div>

        {/* Email Address */}
        <div className="space-y-1">
          <span className="text-[11px] font-semibold text-[#8A98AA] block uppercase tracking-wider">
            Email Address
          </span>
          <span className="text-xs sm:text-sm font-bold text-[#102A56] block truncate">
            {profile?.email || 'johndoe@email.com'}
          </span>
        </div>

        {/* Date of Birth */}
        <div className="space-y-1">
          <span className="text-[11px] font-semibold text-[#8A98AA] block uppercase tracking-wider">
            Date of Birth
          </span>
          <span className="text-xs sm:text-sm font-bold text-[#102A56] block">
            {profile?.date_of_birth || '12 March 1990'}
          </span>
        </div>

        {/* Phone Number */}
        <div className="space-y-1">
          <span className="text-[11px] font-semibold text-[#8A98AA] block uppercase tracking-wider">
            Phone Number
          </span>
          <span className="text-xs sm:text-sm font-bold text-[#102A56] block">
            {profile?.phone || '+91 98765 43210'}
          </span>
        </div>

        {/* Gender */}
        <div className="space-y-1">
          <span className="text-[11px] font-semibold text-[#8A98AA] block uppercase tracking-wider">
            Gender
          </span>
          <span className="text-xs sm:text-sm font-bold text-[#102A56] block">
            {profile?.gender || 'Male'}
          </span>
        </div>

        {/* Address */}
        <div className="space-y-1">
          <span className="text-[11px] font-semibold text-[#8A98AA] block uppercase tracking-wider">
            Address
          </span>
          <span className="text-xs sm:text-sm font-bold text-[#102A56] block leading-relaxed">
            {profile?.address || '123, Green Park, New Delhi, Delhi 110016, India'}
          </span>
        </div>

        {/* Blood Group */}
        <div className="space-y-1">
          <span className="text-[11px] font-semibold text-[#8A98AA] block uppercase tracking-wider">
            Blood Group
          </span>
          <span className="text-xs sm:text-sm font-bold text-[#102A56] block">
            {profile?.blood_group || 'O+'}
          </span>
        </div>

        {/* Marital Status */}
        <div className="space-y-1">
          <span className="text-[11px] font-semibold text-[#8A98AA] block uppercase tracking-wider">
            Marital Status
          </span>
          <span className="text-xs sm:text-sm font-bold text-[#102A56] block">
            {profile?.marital_status || 'Married'}
          </span>
        </div>
      </div>
    </div>
  );
};
