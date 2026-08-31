import React from 'react';
import { Calendar, Clock, ShieldAlert, CheckCircle2 } from 'lucide-react';
import type { PatientProfile } from '../../types/profile';

interface AccountOverviewCardProps {
  profile: PatientProfile | null;
}

export const AccountOverviewCard: React.FC<AccountOverviewCardProps> = ({
  profile,
}) => {
  const memberSince = profile?.member_since || '15 January 2024';
  const lastLogin = profile?.last_login || '29 Aug 2026, 10:30 AM';
  const accountStatus = profile?.account_status || 'Active';
  const isKycVerified = profile?.kyc_verified ?? true;

  return (
    <div className="bg-white rounded-3xl border border-[#D9E1EA]/80 p-5 shadow-[0_4px_20px_rgba(16,42,86,0.03)] space-y-4">
      <h3 className="text-sm sm:text-base font-bold text-[#102A56]">
        Account Overview
      </h3>

      <div className="space-y-3.5 text-xs text-[#5F6F86]">
        {/* Member Since */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-[#8A98AA]" />
            <span>Member Since</span>
          </div>
          <span className="font-bold text-[#102A56]">{memberSince}</span>
        </div>

        {/* Last Login */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-[#8A98AA]" />
            <span>Last Login</span>
          </div>
          <span className="font-bold text-[#102A56]">{lastLogin}</span>
        </div>

        {/* Account Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-3.5 h-3.5 text-[#8A98AA]" />
            <span>Account Status</span>
          </div>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E8F8F5] text-[#1FA774] border border-[#B2F5EA]/60">
            {accountStatus}
          </span>
        </div>

        {/* KYC Verified */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#8A98AA]" />
            <span>KYC Verified</span>
          </div>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E8F8F5] text-[#1FA774] border border-[#B2F5EA]/60">
            {isKycVerified ? 'Verified' : 'Pending'}
          </span>
        </div>
      </div>
    </div>
  );
};
