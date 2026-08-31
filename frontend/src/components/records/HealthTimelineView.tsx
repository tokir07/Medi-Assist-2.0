import React, { useState, useEffect } from 'react';
import {
  Clock,
  Bot,
  Mic,
  FileText,
  Calendar,
  ChevronRight,
  ShieldCheck,
  Filter
} from 'lucide-react';
import { recordsService } from '../../services/recordsService';
import type { TimelineItem } from '../../types/records';

interface HealthTimelineViewProps {
  onSelectRecord?: (recordId: string) => void;
}

export const HealthTimelineView: React.FC<HealthTimelineViewProps> = () => {
  const [items, setItems] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('ALL');

  const fetchTimeline = async () => {
    try {
      setLoading(true);
      const res = await recordsService.getTimeline();
      setItems(res || []);
    } catch (err) {
      console.error('Failed to load timeline:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimeline();
  }, []);

  const filteredItems = items.filter((item) => {
    if (filterType === 'ALL') return true;
    return item.source_type === filterType;
  });

  const getSourceIcon = (type: string) => {
    switch (type) {
      case 'VOICE_CONSULTATION':
        return (
          <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center border-2 border-white shadow-sm">
            <Mic className="w-4 h-4" />
          </div>
        );
      case 'AI_CONVERSATION':
        return (
          <div className="w-8 h-8 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center border-2 border-white shadow-sm">
            <Bot className="w-4 h-4" />
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center border-2 border-white shadow-sm">
            <FileText className="w-4 h-4" />
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 py-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex gap-4 animate-pulse">
            <div className="w-8 h-8 bg-slate-200 rounded-full flex-shrink-0" />
            <div className="flex-1 bg-white p-4 rounded-xl border border-slate-200 space-y-2">
              <div className="h-4 bg-slate-100 rounded w-1/4" />
              <div className="h-3 bg-slate-50 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter Bar */}
      <div className="flex items-center justify-between bg-white p-3.5 rounded-xl border border-slate-200">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
          <Filter className="w-4 h-4 text-slate-400" />
          <span>Filter Timeline:</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          {[
            { label: 'All Sources', val: 'ALL' },
            { label: 'Uploaded Reports', val: 'UPLOADED_RECORD' },
            { label: 'AI Text Chats', val: 'AI_CONVERSATION' },
            { label: 'Voice Sessions', val: 'VOICE_CONSULTATION' }
          ].map((f) => (
            <button
              key={f.val}
              onClick={() => setFilterType(f.val)}
              className={`px-3 py-1 rounded-lg font-medium transition ${
                filterType === f.val
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline Feed */}
      <div className="relative pl-6 space-y-6 before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
        {filteredItems.map((item) => (
          <div key={item.id} className="relative flex items-start gap-4 group">
            {/* Dot Icon */}
            <div className="absolute -left-6 top-1">
              {getSourceIcon(item.source_type)}
            </div>

            {/* Event Card */}
            <div className="flex-1 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:shadow transition group-hover:border-teal-300">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-slate-900">{item.title}</h4>
                  {item.status && (
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-semibold">
                      {item.status}
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> {item.date} • {item.time}
                </span>
              </div>
              <p className="text-xs text-slate-600 line-clamp-2 mt-1">
                {item.preview || item.subtitle}
              </p>
              {item.subtitle && (
                <p className="text-[11px] text-teal-700 font-medium mt-1">
                  {item.subtitle}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
