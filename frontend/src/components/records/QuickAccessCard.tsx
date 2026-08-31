import React from 'react';
import { Upload, Share2, FileText, Trash2 } from 'lucide-react';

interface QuickAccessCardProps {
  onUploadNew: () => void;
  onShareRecords: () => void;
  onRequestRecords: () => void;
  onViewDeleted: () => void;
}

export const QuickAccessCard: React.FC<QuickAccessCardProps> = ({
  onUploadNew,
  onShareRecords,
  onRequestRecords,
  onViewDeleted,
}) => {
  const items = [
    {
      title: 'Upload New Record',
      subtitle: 'Add your medical document',
      icon: <Upload className="w-4 h-4 text-[#0FA3A3]" />,
      iconBg: 'bg-[#E6F7F7]',
      onClick: onUploadNew,
    },
    {
      title: 'Share Records',
      subtitle: 'Share with your doctor',
      icon: <Share2 className="w-4 h-4 text-[#2F80ED]" />,
      iconBg: 'bg-[#EEF5FF]',
      onClick: onShareRecords,
    },
    {
      title: 'Request Records',
      subtitle: 'Request from hospital/lab',
      icon: <FileText className="w-4 h-4 text-[#D99500]" />,
      iconBg: 'bg-[#FEF3C7]',
      onClick: onRequestRecords,
    },
    {
      title: 'Deleted Records',
      subtitle: 'View recently deleted',
      icon: <Trash2 className="w-4 h-4 text-[#D64545]" />,
      iconBg: 'bg-[#FFF5F5]',
      onClick: onViewDeleted,
    },
  ];

  return (
    <div className="bg-white rounded-3xl border border-[#D9E1EA]/80 p-5 shadow-[0_4px_20px_rgba(16,42,86,0.04)] space-y-3.5">
      <h3 className="text-sm font-bold text-[#102A56]">Quick Access</h3>

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
