import React from 'react';
import { X, ShieldCheck, Lock, KeyRound, FileCheck2, UserCheck } from 'lucide-react';

interface SecurityInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SecurityInfoModal: React.FC<SecurityInfoModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const features = [
    {
      icon: <Lock className="w-5 h-5 text-[#0FA3A3]" />,
      title: 'End-to-End Patient Data Isolation',
      description:
        'All medical records, prescriptions, and lab diagnostics are strictly isolated by cryptographic JWT authentication and patient-scoped database queries.',
    },
    {
      icon: <UserCheck className="w-5 h-5 text-[#2F80ED]" />,
      title: 'Role-Based Access Control (RBAC)',
      description:
        'Only you and authorized physicians whom you explicitly permit can access your reports. You can revoke doctor access at any time.',
    },
    {
      icon: <KeyRound className="w-5 h-5 text-[#D99500]" />,
      title: 'Encrypted Storage & Transmission',
      description:
        'Documents are stored in secure repositories with AES-256 server-side encryption and served exclusively over TLS 1.3 encrypted tunnels.',
    },
    {
      icon: <FileCheck2 className="w-5 h-5 text-[#1FA774]" />,
      title: 'Audit Logging & Provenance Tracking',
      description:
        'Every view, download, and share operation is logged in immutable audit trails, ensuring complete compliance with clinical healthcare standards.',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-3xl border border-[#D9E1EA] w-full max-w-lg shadow-[0_20px_50px_rgba(16,42,86,0.15)] overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-5 border-b border-[#E7EDF4] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#E6F7F7] text-[#0FA3A3] flex items-center justify-center shadow-2xs">
              <ShieldCheck className="w-4 h-4 text-[#0FA3A3]" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-[#102A56]">
                Data Security & Privacy
              </h3>
              <p className="text-[11px] text-[#5F6F86]">MediAssist Healthcare Protection Policy</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-[#8A98AA] hover:text-[#102A56] hover:bg-[#F4F8FC] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 custom-scrollbar">
          {features.map((item, idx) => (
            <div
              key={idx}
              className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-[#F7FAFF] border border-[#E7EDF4]"
            >
              <div className="w-9 h-9 rounded-xl bg-white border border-[#D9E1EA] flex items-center justify-center shrink-0 shadow-2xs">
                {item.icon}
              </div>
              <div className="space-y-1">
                <h4 className="text-xs sm:text-sm font-bold text-[#102A56]">{item.title}</h4>
                <p className="text-[11px] text-[#5F6F86] leading-relaxed">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-[#E7EDF4] flex justify-end bg-white">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#0FA3A3] hover:bg-[#0D8E8E] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
};
