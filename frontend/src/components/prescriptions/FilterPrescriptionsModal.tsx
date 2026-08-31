import React, { useState } from 'react';
import { X, Filter, RotateCcw } from 'lucide-react';
import type { PrescriptionTab } from '../../types/prescriptions';

interface FilterPrescriptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTab: PrescriptionTab;
  onSelectTab: (tab: PrescriptionTab) => void;
  selectedDoctor: string;
  onSelectDoctor: (doctor: string) => void;
  onReset: () => void;
}

export const FilterPrescriptionsModal: React.FC<FilterPrescriptionsModalProps> = ({
  isOpen,
  onClose,
  selectedTab,
  onSelectTab,
  selectedDoctor,
  onSelectDoctor,
  onReset,
}) => {
  const [tab, setTab] = useState<PrescriptionTab>(selectedTab);
  const [doctor, setDoctor] = useState<string>(selectedDoctor);

  if (!isOpen) return null;

  const handleApply = () => {
    onSelectTab(tab);
    onSelectDoctor(doctor);
    onClose();
  };

  const handleReset = () => {
    setTab('All Prescriptions');
    setDoctor('All');
    onReset();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-3xl border border-[#D9E1EA] w-full max-w-md shadow-[0_20px_50px_rgba(16,42,86,0.15)] overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-[#E7EDF4] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#EEF5FF] text-[#0FA3A3] flex items-center justify-center shadow-2xs">
              <Filter className="w-4 h-4 text-[#0FA3A3]" />
            </div>
            <h3 className="text-sm sm:text-base font-bold text-[#102A56]">Filter Prescriptions</h3>
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
        <div className="p-5 sm:p-6 space-y-4">
          {/* Status Tab */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#102A56]">Prescription Status</label>
            <div className="grid grid-cols-2 gap-2">
              {(['All Prescriptions', 'Active', 'Past', 'Drafts', 'Refills'] as PrescriptionTab[]).map(
                (t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTab(t)}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer text-left ${
                      tab === t
                        ? 'bg-[#0FA3A3] text-white shadow-2xs'
                        : 'bg-[#F7FAFF] hover:bg-[#EEF5FF] text-[#5F6F86] border border-[#E7EDF4]'
                    }`}
                  >
                    {t}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Doctor Filter */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#102A56]">Doctor</label>
            <select
              value={doctor}
              onChange={(e) => setDoctor(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-[#F7FAFF] border border-[#D9E1EA] text-xs sm:text-sm text-[#102A56] focus:bg-white focus:border-[#0FA3A3] focus:outline-none transition-all cursor-pointer"
            >
              <option value="All">All Doctors</option>
              <option value="Dr. Priya Sharma">Dr. Priya Sharma</option>
              <option value="Dr. Arjun Mehta">Dr. Arjun Mehta</option>
              <option value="Dr. Neha Verma">Dr. Neha Verma</option>
            </select>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-[#E7EDF4] flex items-center justify-between bg-white">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 text-xs font-bold text-[#5F6F86] hover:text-[#102A56] cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Filters</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-[#D9E1EA] text-xs font-bold text-[#5F6F86] hover:bg-[#F4F8FC] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="px-5 py-2 rounded-xl bg-[#0FA3A3] hover:bg-[#0D8E8E] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
