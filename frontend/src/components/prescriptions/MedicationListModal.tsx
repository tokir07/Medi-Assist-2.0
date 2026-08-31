import React from 'react';
import { X, Pill, CheckCircle2, AlertCircle, Calendar } from 'lucide-react';
import type { PrescriptionItem } from '../../types/prescriptions';

interface MedicationListModalProps {
  isOpen: boolean;
  onClose: () => void;
  prescriptions: PrescriptionItem[];
  onSelectPrescription: (p: PrescriptionItem) => void;
}

export const MedicationListModal: React.FC<MedicationListModalProps> = ({
  isOpen,
  onClose,
  prescriptions,
  onSelectPrescription,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-3xl border border-[#D9E1EA] w-full max-w-xl shadow-[0_20px_50px_rgba(16,42,86,0.15)] overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-5 border-b border-[#E7EDF4] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#E6F7F7] text-[#0FA3A3] flex items-center justify-center shadow-2xs">
              <Pill className="w-4 h-4 text-[#0FA3A3]" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-[#102A56]">Complete Medication List</h3>
              <p className="text-[11px] text-[#5F6F86]">Active and historical prescribed medicines</p>
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
        <div className="p-5 sm:p-6 overflow-y-auto space-y-3 custom-scrollbar">
          {prescriptions.map((p) => {
            const isActive = (p.status || '').toLowerCase() === 'active';
            return (
              <div
                key={p.id}
                onClick={() => {
                  onSelectPrescription(p);
                  onClose();
                }}
                className="p-3.5 rounded-2xl bg-[#F7FAFF] hover:bg-[#EEF5FF] border border-[#E7EDF4] transition-all flex items-center justify-between gap-3 cursor-pointer group"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-white border border-[#D9E1EA] flex items-center justify-center font-serif italic font-black text-xs text-[#0FA3A3] shrink-0 mt-0.5 shadow-2xs">
                    ℞
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs sm:text-sm font-bold text-[#102A56] group-hover:text-[#0FA3A3] transition-colors truncate">
                      {p.medication_name}
                    </h4>
                    <p className="text-[11px] text-[#5F6F86] truncate">
                      {p.dosage} • {p.frequency} • {p.doctor_name}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span
                    className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold ${
                      isActive
                        ? 'bg-[#E6F7F7] text-[#0FA3A3]'
                        : 'bg-[#FFE4E6] text-[#E11D48]'
                    }`}
                  >
                    {p.status}
                  </span>
                  <span className="text-[10px] text-[#8A98AA] block mt-0.5">
                    {p.prescribed_date.split(',')[0]}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#E7EDF4] flex justify-end bg-white">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#0FA3A3] hover:bg-[#0D8E8E] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
