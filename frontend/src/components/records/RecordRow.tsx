import React, { useState, useRef, useEffect } from 'react';
import {
  FileText,
  Eye,
  Download,
  MoreVertical,
  Share2,
  Trash2,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';
import type { MedicalRecordItem } from '../../types/records';

interface RecordRowProps {
  record: MedicalRecordItem;
  onView: (record: MedicalRecordItem) => void;
  onDownload: (record: MedicalRecordItem) => void;
  onShare: (record: MedicalRecordItem) => void;
  onDelete: (record: MedicalRecordItem) => void;
}

export const RecordRow: React.FC<RecordRowProps> = ({
  record,
  onView,
  onDownload,
  onShare,
  onDelete,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getCategoryBadgeClass = (category: string) => {
    const cat = category.toLowerCase();
    if (cat.includes('lab')) return 'bg-[#E6F7F7] text-[#0FA3A3] border border-[#B2EBEB]';
    if (cat.includes('radio') || cat.includes('x-ray'))
      return 'bg-[#F3E8FF] text-[#8B5CF6] border border-[#E9D5FF]';
    if (cat.includes('prescrip'))
      return 'bg-[#FEF3C7] text-[#D97706] border border-[#FDE68A]';
    if (cat.includes('discharge'))
      return 'bg-[#DBEAFE] text-[#2563EB] border border-[#BFDBFE]';
    if (cat.includes('consult'))
      return 'bg-[#FFE4E6] text-[#E11D48] border border-[#FECDD3]';
    return 'bg-[#F1F5F9] text-[#5F6F86] border border-[#E2E8F0]';
  };

  const getFileBadge = () => {
    const type = (record.file_type || 'PDF').toUpperCase();
    if (type === 'DICOM') {
      return (
        <div className="w-8 h-8 rounded-lg bg-[#243347] text-white flex items-center justify-center font-bold text-[9px] tracking-wider shrink-0 shadow-2xs">
          DICOM
        </div>
      );
    }
    return (
      <div className="w-8 h-8 rounded-lg bg-[#FFF5F5] border border-[#FED7D7] text-[#E53E3E] flex items-center justify-center shrink-0 shadow-2xs">
        <FileText className="w-4 h-4 text-[#E53E3E]" />
      </div>
    );
  };

  // Format date parts
  const formatRecordDateParts = () => {
    if (!record.record_date) return { date: 'N/A', time: '' };
    const parts = record.record_date.split(',');
    if (parts.length >= 2) {
      return { date: parts[0].trim(), time: parts[1].trim() };
    }
    return { date: record.record_date, time: '' };
  };

  const { date: displayDate, time: displayTime } = formatRecordDateParts();
  const primaryTag = record.tags && record.tags.length > 0 ? record.tags[0] : 'General';

  return (
    <tr className="border-b border-[#F0F4F8] hover:bg-[#F9FBFE] transition-colors group">
      {/* 1. Record Name & Size */}
      <td className="py-3.5 px-4">
        <div className="flex items-center gap-3">
          {getFileBadge()}
          <div className="min-w-0">
            <h4
              onClick={() => onView(record)}
              className="text-xs sm:text-sm font-bold text-[#102A56] group-hover:text-[#0FA3A3] transition-colors cursor-pointer truncate max-w-[200px] sm:max-w-[240px]"
            >
              {record.title}
            </h4>
            <p className="text-[11px] text-[#8A98AA] font-medium mt-0.5">
              {record.file_type} • {record.file_size_formatted}
            </p>
          </div>
        </div>
      </td>

      {/* 2. Type */}
      <td className="py-3.5 px-4 whitespace-nowrap">
        <span
          className={`inline-block px-2.5 py-1 rounded-lg text-[11px] font-bold ${getCategoryBadgeClass(
            record.category
          )}`}
        >
          {record.category}
        </span>
      </td>

      {/* 3. Date */}
      <td className="py-3.5 px-4 whitespace-nowrap">
        <div className="text-xs font-semibold text-[#102A56]">{displayDate}</div>
        {displayTime && (
          <div className="text-[10px] text-[#8A98AA] font-normal mt-0.5">{displayTime}</div>
        )}
      </td>

      {/* 4. Doctor / Source */}
      <td className="py-3.5 px-4 whitespace-nowrap">
        <div className="text-xs font-semibold text-[#102A56]">
          {record.doctor_name || 'Dr. Priya Sharma'}
        </div>
        <div className="text-[10px] text-[#8A98AA] font-normal mt-0.5">
          {record.hospital || 'Pathology Lab'}
        </div>
      </td>

      {/* 5. Tags */}
      <td className="py-3.5 px-4 whitespace-nowrap">
        <span className="inline-block px-2.5 py-0.5 rounded-md bg-[#F4F8FC] border border-[#D9E1EA] text-[#5F6F86] text-[10px] font-medium">
          {primaryTag}
        </span>
      </td>

      {/* 6. Actions */}
      <td className="py-3.5 px-4 whitespace-nowrap text-right">
        <div className="flex items-center justify-end gap-1 relative" ref={menuRef}>
          {/* View */}
          <button
            type="button"
            onClick={() => onView(record)}
            className="p-1.5 rounded-lg text-[#8A98AA] hover:text-[#0FA3A3] hover:bg-[#EEF5FF] transition-colors cursor-pointer"
            title="View Record"
          >
            <Eye className="w-4 h-4" />
          </button>

          {/* Download */}
          <button
            type="button"
            onClick={() => onDownload(record)}
            className="p-1.5 rounded-lg text-[#8A98AA] hover:text-[#0FA3A3] hover:bg-[#EEF5FF] transition-colors cursor-pointer"
            title="Download Document"
          >
            <Download className="w-4 h-4" />
          </button>

          {/* More 3-Dots */}
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1.5 rounded-lg text-[#8A98AA] hover:text-[#102A56] hover:bg-[#F4F8FC] transition-colors cursor-pointer"
            title="More Options"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {/* Dropdown Menu */}
          {menuOpen && (
            <div className="absolute right-0 top-8 w-44 bg-white border border-[#D9E1EA] rounded-2xl shadow-[0_10px_25px_rgba(16,42,86,0.1)] py-1.5 z-40 text-left animate-fade-in">
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onView(record);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#5F6F86] hover:bg-[#F4F8FC] hover:text-[#102A56] transition-colors cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5 text-[#8A98AA]" />
                <span>View Details</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onDownload(record);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#5F6F86] hover:bg-[#F4F8FC] hover:text-[#102A56] transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-[#8A98AA]" />
                <span>Download File</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onShare(record);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#5F6F86] hover:bg-[#F4F8FC] hover:text-[#102A56] transition-colors cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5 text-[#8A98AA]" />
                <span>Share with Doctor</span>
              </button>

              <div className="my-1 border-t border-[#F4F8FC]" />

              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onDelete(record);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#D64545] hover:bg-red-50 transition-colors cursor-pointer font-medium"
              >
                <Trash2 className="w-3.5 h-3.5 text-[#D64545]" />
                <span>Delete Record</span>
              </button>
            </div>
          )}
        </div>
      </td>
    </tr>
  );
};
