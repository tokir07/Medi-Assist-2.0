import React from 'react';
import { Upload, FileText, RotateCcw, Pill } from 'lucide-react';

interface PrescriptionQuickActionsCardProps {
  onUploadNew: () => void;
  onRequestPrescription: () => void;
  onRequestRefill: () => void;
  onViewMedicationList: () => void;
}

export const PrescriptionQuickActionsCard: React.FC<PrescriptionQuickActionsCardProps> = ({
  onUploadNew,
  onRequestPrescription,
  onRequestRefill,
  onViewMedicationList,
}) => {
  const items = [
    {
      title: 'Upload New Prescription',
      subtitle: 'Add prescription image or PDF',
      icon: <Upload className="w-4 h-4 text-[#0FA3A3]" />,
      iconBg: 'bg-[#E6F7F7]',
      onClick: onUploadNew,
    },
    {
      title: 'Request Prescription',
      subtitle: 'Request from your doctor',
      icon: <FileText className="w-4 h-4 text-[#1FA774]" />,
      iconBg: 'bg-[#E8F8F0]',
      onClick: onRequestPrescription,
    },
    {
      title: 'Refill Request',
      subtitle: 'Request refill for medicines',
      icon: <RotateCcw className="w-4 h-4 text-[#2F80ED]" />,
      iconBg: 'bg-[#EEF5FF]',
      onClick: onRequestRefill,
    },
    {
      title: 'View Medication List',
      subtitle: 'See all your medicines',
      icon: <Pill className="w-4 h-4 text-[#0FA3A3]" />,
      iconBg: 'bg-[#E6F7F7]',
      onClick: onViewMedicationList,
    },
  ];

  return (
    <div className="bg-white rounded-3xl border border-[#D9E1EA]/80 p-5 shadow-[0_4px_20px_rgba(16,42,86,0.04)] space-y-3.5">
      <h3 className="text-sm font-bold text-[#102A56]">Quick Actions</h3>

      <div className="space-y-2">
        {items.map((item) => (
          <div
            key={item.title}
            onClick={item.onClick}
            className="flex items-center gap-3 p-3 rounded-2xl bg-[#F7FAFF] hover:bg-[#EEF5FF] border border-[#E7EDF4] transition-all duration-150 cursor-pointer group"
          >
            <div
              className={`w-8 h-8 rounded-xl ${item.iconBg} flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform`}
            >
              {item.icon}
            </div>

            <div className="min-w-0 flex-1">
              <h4 className="text-xs font-bold text-[#102A56] group-hover:text-[#0FA3A3] transition-colors leading-tight">
                {item.title}
              </h4>
              <p className="text-[10px] text-[#8A98AA] font-medium truncate mt-0.5">
                {item.subtitle}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
