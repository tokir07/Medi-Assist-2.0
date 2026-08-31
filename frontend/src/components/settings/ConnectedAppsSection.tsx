import React, { useState } from 'react';
import { Activity, Hospital, ShoppingBag, ShieldCheck, CheckCircle2, X } from 'lucide-react';

export const ConnectedAppsSection: React.FC = () => {
  const [connected, setConnected] = useState<{ [key: string]: boolean }>({
    labs: true,
    pharmacy: true,
    hospitals: false,
  });

  const toggleConnect = (key: string) => {
    setConnected((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl border border-[#D9E1EA]/80 p-5 sm:p-6 shadow-[0_4px_20px_rgba(16,42,86,0.03)] space-y-5">
        <div>
          <h3 className="text-sm sm:text-base font-bold text-[#102A56]">
            Connected Health Services
          </h3>
          <p className="text-[11px] sm:text-xs text-[#5F6F86] mt-0.5">
            Manage linked healthcare providers and authorized diagnostic networks.
          </p>
        </div>

        <div className="space-y-4">
          {/* Diagnostic Network */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-[#F7FAFF] border border-[#E7EDF4]">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-[#E6F7F7] text-[#0FA3A3] flex items-center justify-center shrink-0 border border-[#B2F5EA]/60 shadow-2xs">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-[#102A56]">
                  Diagnostic Lab Network
                </h4>
                <p className="text-[11px] text-[#5F6F86]">
                  Automatic synchronization of lab test reports and blood work results.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => toggleConnect('labs')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                connected.labs
                  ? 'bg-white border border-[#D9E1EA] text-[#E53E3E] hover:bg-[#FFF5F5]'
                  : 'bg-[#0FA3A3] text-white hover:bg-[#0D8E8E]'
              }`}
            >
              {connected.labs ? 'Disconnect' : 'Connect'}
            </button>
          </div>

          {/* E-Pharmacy Partner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-[#F7FAFF] border border-[#E7EDF4]">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-[#F4F0FF] text-[#8B5CF6] flex items-center justify-center shrink-0 border border-[#E9D8FD]/60 shadow-2xs">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-[#102A56]">
                  MediAssist Pharmacy Link
                </h4>
                <p className="text-[11px] text-[#5F6F86]">
                  Direct prescription fulfillment and automated refill scheduling.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => toggleConnect('pharmacy')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                connected.pharmacy
                  ? 'bg-white border border-[#D9E1EA] text-[#E53E3E] hover:bg-[#FFF5F5]'
                  : 'bg-[#0FA3A3] text-white hover:bg-[#0D8E8E]'
              }`}
            >
              {connected.pharmacy ? 'Disconnect' : 'Connect'}
            </button>
          </div>

          {/* Regional Hospital Registry */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-[#F7FAFF] border border-[#E7EDF4]">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-[#EEF5FF] text-[#2F80ED] flex items-center justify-center shrink-0 border border-[#C3DAFE]/60 shadow-2xs">
                <Hospital className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-[#102A56]">
                  National Health System Registry
                </h4>
                <p className="text-[11px] text-[#5F6F86]">
                  Secure ABHA-linked health records exchange with certified hospitals.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => toggleConnect('hospitals')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                connected.hospitals
                  ? 'bg-white border border-[#D9E1EA] text-[#E53E3E] hover:bg-[#FFF5F5]'
                  : 'bg-[#0FA3A3] text-white hover:bg-[#0D8E8E]'
              }`}
            >
              {connected.hospitals ? 'Disconnect' : 'Connect'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
