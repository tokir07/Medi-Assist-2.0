import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, ArrowRight, Activity, Syringe, ChevronRight } from 'lucide-react';
import type { MedicalRecordItem } from '../../types/dashboard';

interface RecentRecordsCardProps {
  records?: MedicalRecordItem[];
}

export const RecentRecordsCard: React.FC<RecentRecordsCardProps> = ({ records = [] }) => {
  const getCategoryIcon = (category: string) => {
    const cat = category.toLowerCase();
    if (cat.includes('radiology') || cat.includes('x-ray') || cat.includes('lab')) {
      return { icon: <Activity className="w-4 h-4 text-blue-600" />, bg: 'bg-blue-50 border-blue-200' };
    }
    if (cat.includes('prescription') || cat.includes('physician')) {
      return { icon: <FileText className="w-4 h-4 text-teal-600" />, bg: 'bg-teal-50 border-teal-200' };
    }
    if (cat.includes('immunization') || cat.includes('vaccination')) {
      return { icon: <Syringe className="w-4 h-4 text-emerald-600" />, bg: 'bg-emerald-50 border-emerald-200' };
    }
    return { icon: <FileText className="w-4 h-4 text-purple-600" />, bg: 'bg-purple-50 border-purple-200' };
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs flex flex-col justify-between h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-3.5 pb-2.5 border-b border-slate-100">
        <h3 className="text-sm sm:text-base font-bold text-slate-900">Recent Medical Records</h3>
        <Link
          to="/patient/records"
          className="inline-flex items-center gap-1 text-xs font-bold text-teal-700 hover:text-teal-800 transition"
        >
          <span>View All</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* List */}
      {records.length === 0 ? (
        <div className="py-8 text-center space-y-2">
          <div className="w-10 h-10 mx-auto rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400">
            <FileText className="w-5 h-5" />
          </div>
          <p className="text-xs font-bold text-slate-900">No medical records uploaded yet</p>
          <p className="text-[11px] text-slate-500">Your lab reports and clinical summaries will appear here.</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {records.slice(0, 4).map((rec) => {
            const { icon, bg } = getCategoryIcon(rec.category);
            return (
              <div key={rec.id} className="flex items-center justify-between py-2.5 gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-8 h-8 rounded-lg border ${bg} flex items-center justify-center shrink-0`}>
                    {icon}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-slate-900 truncate leading-snug">
                      {rec.title}
                    </h4>
                    <p className="text-[10px] text-slate-500 truncate">{rec.category}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0 text-xs">
                  <span className="text-[10px] text-slate-400 hidden sm:inline">{rec.date}</span>
                  <Link
                    to="/patient/records"
                    className="px-2.5 py-1 bg-slate-50 hover:bg-teal-50 hover:text-teal-700 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold transition"
                  >
                    View
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
