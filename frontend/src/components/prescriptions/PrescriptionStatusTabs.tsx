import React from 'react';
import { Upload, Plus } from 'lucide-react';
import type { PrescriptionTab } from '../../types/prescriptions';

const TABS: PrescriptionTab[] = [
  'All Prescriptions',
  'Active',
  'Completed',
  'Expired',
  'Refills',
];

interface PrescriptionStatusTabsProps {
  activeTab: PrescriptionTab;
  onSelectTab: (tab: PrescriptionTab) => void;
  onOpenUpload: () => void;
  onOpenAddManual?: () => void;
}

export const PrescriptionStatusTabs: React.FC<PrescriptionStatusTabsProps> = ({
  activeTab,
  onSelectTab,
  onOpenUpload,
  onOpenAddManual,
}) => {
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 overflow-x-auto pb-1 custom-scrollbar">
      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto py-1 no-scrollbar">
        {TABS.map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => onSelectTab(tab)}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-150 whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200'
              }`}
            >
              {tab}
            </button>
          );
        })}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 shrink-0">
        {onOpenAddManual && (
          <button
            type="button"
            onClick={onOpenAddManual}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs sm:text-sm transition shrink-0 shadow-2xs cursor-pointer"
          >
            <Plus className="w-4 h-4 text-teal-600 stroke-[2.5]" />
            <span>Add Prescription</span>
          </button>
        )}

        <button
          type="button"
          onClick={onOpenUpload}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs sm:text-sm transition shrink-0 shadow-xs cursor-pointer"
        >
          <Upload className="w-4 h-4 text-white stroke-[2.5]" />
          <span>Upload Document</span>
        </button>
      </div>
    </div>
  );
};
