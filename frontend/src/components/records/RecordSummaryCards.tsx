import React from 'react';
import {
  FileText,
  FlaskConical,
  Scan,
  Pill,
  Users,
  FolderOpen,
} from 'lucide-react';
import type { RecordSummaryStats } from '../../types/records';

interface RecordSummaryCardsProps {
  summary: RecordSummaryStats | null;
  loading?: boolean;
}

export const RecordSummaryCards: React.FC<RecordSummaryCardsProps> = ({
  summary,
  loading = false,
}) => {
  const cards = [
    {
      title: 'Total Records',
      count: summary?.total_records ?? 0,
      label: 'All time',
      icon: <FileText className="w-4 h-4 text-[#2F80ED]" />,
      iconBg: 'bg-[#EEF5FF]',
    },
    {
      title: 'Lab Reports',
      count: summary?.lab_reports ?? 0,
      label: 'Reports',
      icon: <FlaskConical className="w-4 h-4 text-[#0FA3A3]" />,
      iconBg: 'bg-[#E6F7F7]',
    },
    {
      title: 'Radiology',
      count: summary?.radiology ?? 0,
      label: 'Reports',
      icon: <Scan className="w-4 h-4 text-[#8B5CF6]" />,
      iconBg: 'bg-[#F3E8FF]',
    },
    {
      title: 'Prescriptions',
      count: summary?.prescriptions ?? 0,
      label: 'Records',
      icon: <Pill className="w-4 h-4 text-[#D99500]" />,
      iconBg: 'bg-[#FEF3C7]',
    },
    {
      title: 'Consultations',
      count: summary?.consultations ?? 0,
      label: 'Records',
      icon: <Users className="w-4 h-4 text-[#E11D48]" />,
      iconBg: 'bg-[#FFE4E6]',
    },
    {
      title: 'Others',
      count: summary?.others ?? 0,
      label: 'Records',
      icon: <FolderOpen className="w-4 h-4 text-[#5F6F86]" />,
      iconBg: 'bg-[#F1F5F9]',
    },
  ];

  return (
    <div className="space-y-2.5">
      <h3 className="text-xs font-bold uppercase tracking-wider text-[#8A98AA]">Summary</h3>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-3.5">
        {cards.map((card) => (
          <div
            key={card.title}
            className="bg-white rounded-2xl border border-[#D9E1EA]/80 p-3.5 sm:p-4 shadow-[0_2px_12px_rgba(16,42,86,0.03)] flex flex-col justify-between hover:border-[#0FA3A3]/40 transition-all group"
          >
            {/* Top row: Icon & Title */}
            <div className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-xl ${card.iconBg} flex items-center justify-center shrink-0 shadow-2xs`}
              >
                {card.icon}
              </div>
              <span className="text-[11px] font-bold text-[#5F6F86] truncate">
                {card.title}
              </span>
            </div>

            {/* Count & Label */}
            <div className="mt-3">
              {loading ? (
                <div className="h-7 w-12 bg-slate-100 animate-pulse rounded-md" />
              ) : (
                <span className="text-xl sm:text-2xl font-black text-[#102A56] tracking-tight group-hover:text-[#0FA3A3] transition-colors">
                  {card.count}
                </span>
              )}
              <p className="text-[10px] text-[#8A98AA] font-medium mt-0.5">{card.label}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
