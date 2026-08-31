import React from 'react';
import { FileText, Pill, Clock, Calendar } from 'lucide-react';
import type { PrescriptionSummaryStats } from '../../types/prescriptions';

interface PrescriptionSummaryCardsProps {
  summary: PrescriptionSummaryStats | null;
  loading?: boolean;
}

export const PrescriptionSummaryCards: React.FC<PrescriptionSummaryCardsProps> = ({
  summary,
  loading = false,
}) => {
  const cards = [
    {
      title: 'Total Prescriptions',
      count: summary?.total_prescriptions ?? 32,
      label: 'All time',
      icon: <FileText className="w-4 h-4 text-[#2F80ED]" />,
      iconBg: 'bg-[#EEF5FF]',
    },
    {
      title: 'Active Prescriptions',
      count: summary?.active_prescriptions ?? 8,
      label: 'Currently on medication',
      icon: <Pill className="w-4 h-4 text-[#0FA3A3]" />,
      iconBg: 'bg-[#E6F7F7]',
    },
    {
      title: 'Need Refills',
      count: summary?.need_refills ?? 3,
      label: 'Refill recommended',
      icon: <Clock className="w-4 h-4 text-[#D99500]" />,
      iconBg: 'bg-[#FEF3C7]',
    },
    {
      title: 'This Month',
      count: summary?.this_month ?? 5,
      label: 'New prescriptions',
      icon: <Calendar className="w-4 h-4 text-[#E11D48]" />,
      iconBg: 'bg-[#FFE4E6]',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
      {cards.map((card) => (
        <div
          key={card.title}
          className="bg-white rounded-2xl border border-[#D9E1EA]/80 p-4 shadow-[0_2px_12px_rgba(16,42,86,0.03)] flex flex-col justify-between hover:border-[#0FA3A3]/40 transition-all group"
        >
          {/* Top row: Icon & Title */}
          <div className="flex items-center gap-2.5">
            <div
              className={`w-8 h-8 rounded-xl ${card.iconBg} flex items-center justify-center shrink-0 shadow-2xs`}
            >
              {card.icon}
            </div>
            <span className="text-xs font-bold text-[#5F6F86] truncate">
              {card.title}
            </span>
          </div>

          {/* Count & Label */}
          <div className="mt-3.5">
            {loading ? (
              <div className="h-7 w-12 bg-slate-100 animate-pulse rounded-md" />
            ) : (
              <span className="text-2xl font-black text-[#102A56] tracking-tight group-hover:text-[#0FA3A3] transition-colors">
                {card.count}
              </span>
            )}
            <p className="text-[11px] text-[#8A98AA] font-medium mt-0.5">{card.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
};
