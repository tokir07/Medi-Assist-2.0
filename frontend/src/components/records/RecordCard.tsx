import React from 'react';
import {
  FileText,
  Eye,
  Download,
  Share2,
  Trash2,
  Calendar,
  User,
  Building,
} from 'lucide-react';
import type { MedicalRecordItem } from '../../types/records';

interface RecordCardProps {
  record: MedicalRecordItem;
  onView: (record: MedicalRecordItem) => void;
  onDownload: (record: MedicalRecordItem) => void;
  onShare: (record: MedicalRecordItem) => void;
  onDelete: (record: MedicalRecordItem) => void;
}

export const RecordCard: React.FC<RecordCardProps> = ({
  record,
  onView,
  onDownload,
  onShare,
  onDelete,
}) => {
  const getCategoryBadgeClass = (category: string) => {
    const cat = category.toLowerCase();
    if (cat.includes('lab')) return 'bg-[#E6F7F7] text-[#0FA3A3] border-[#B2EBEB]';
    if (cat.includes('radio') || cat.includes('x-ray'))
      return 'bg-[#F3E8FF] text-[#8B5CF6] border-[#E9D5FF]';
    if (cat.includes('prescrip'))
      return 'bg-[#FEF3C7] text-[#D97706] border-[#FDE68A]';
    if (cat.includes('discharge'))
      return 'bg-[#DBEAFE] text-[#2563EB] border-[#BFDBFE]';
    if (cat.includes('consult'))
      return 'bg-[#FFE4E6] text-[#E11D48] border-[#FECDD3]';
    return 'bg-[#F1F5F9] text-[#5F6F86] border-[#E2E8F0]';
  };

  const primaryTag = record.tags && record.tags.length > 0 ? record.tags[0] : 'Routine';

  return (
    <div className="bg-white rounded-2xl border border-[#D9E1EA]/80 p-4 shadow-[0_2px_12px_rgba(16,42,86,0.03)] hover:border-[#0FA3A3]/50 transition-all flex flex-col justify-between group">
      {/* Top Header: Badge & Category */}
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5">
            {record.file_type.toUpperCase() === 'DICOM' ? (
              <div className="w-9 h-9 rounded-xl bg-[#243347] text-white flex items-center justify-center font-bold text-[10px] tracking-wider shrink-0 shadow-2xs">
                DICOM
              </div>
            ) : (
              <div className="w-9 h-9 rounded-xl bg-[#FFF5F5] border border-[#FED7D7] text-[#E53E3E] flex items-center justify-center shrink-0 shadow-2xs">
                <FileText className="w-4 h-4 text-[#E53E3E]" />
              </div>
            )}
            <div>
              <span
                className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold border ${getCategoryBadgeClass(
                  record.category
                )}`}
              >
                {record.category}
              </span>
              <p className="text-[10px] text-[#8A98AA] font-medium mt-0.5">
                {record.file_type} • {record.file_size_formatted}
              </p>
            </div>
          </div>

          <span className="px-2 py-0.5 rounded-md bg-[#F4F8FC] border border-[#D9E1EA] text-[#5F6F86] text-[10px] font-medium">
            {primaryTag}
          </span>
        </div>

        {/* Title */}
        <h4
          onClick={() => onView(record)}
          className="text-xs sm:text-sm font-bold text-[#102A56] group-hover:text-[#0FA3A3] transition-colors cursor-pointer line-clamp-2"
        >
          {record.title}
        </h4>

        {/* Details Meta */}
        <div className="space-y-1.5 pt-2 border-t border-[#F0F4F8] text-[11px] text-[#5F6F86]">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-[#8A98AA] shrink-0" />
            <span className="truncate">{record.record_date || 'Recent'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-[#8A98AA] shrink-0" />
            <span className="truncate">{record.doctor_name || 'Dr. Priya Sharma'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Building className="w-3.5 h-3.5 text-[#8A98AA] shrink-0" />
            <span className="truncate">{record.hospital || 'Pathology Lab'}</span>
          </div>
        </div>
      </div>

      {/* Card Footer Actions */}
      <div className="flex items-center justify-between gap-1 mt-4 pt-3 border-t border-[#F0F4F8]">
        <button
          type="button"
          onClick={() => onView(record)}
          className="flex-1 py-1.5 px-2 bg-[#F4F8FC] hover:bg-[#EEF5FF] text-[#102A56] hover:text-[#0FA3A3] text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-1 cursor-pointer"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>View</span>
        </button>

        <button
          type="button"
          onClick={() => onDownload(record)}
          className="p-1.5 bg-[#F4F8FC] hover:bg-[#EEF5FF] text-[#5F6F86] hover:text-[#0FA3A3] rounded-xl transition-colors cursor-pointer"
          title="Download"
        >
          <Download className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => onShare(record)}
          className="p-1.5 bg-[#F4F8FC] hover:bg-[#EEF5FF] text-[#5F6F86] hover:text-[#0FA3A3] rounded-xl transition-colors cursor-pointer"
          title="Share"
        >
          <Share2 className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => onDelete(record)}
          className="p-1.5 bg-[#F4F8FC] hover:bg-red-50 text-[#5F6F86] hover:text-[#D64545] rounded-xl transition-colors cursor-pointer"
          title="Delete"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
