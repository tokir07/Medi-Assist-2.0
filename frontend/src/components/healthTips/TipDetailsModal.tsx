import React, { useState, useEffect } from 'react';
import {
  X,
  Bookmark,
  Share2,
  Clock,
  ShieldCheck,
  Check,
  Sparkles,
  ArrowRight,
  BookOpen,
  Copy,
} from 'lucide-react';
import { healthTipsService } from '../../services/healthTipsService';
import type { HealthTipItem } from '../../types/healthTips';

interface TipDetailsModalProps {
  tip: HealthTipItem | null;
  isOpen: boolean;
  onClose: () => void;
  onToggleSave: (tipId: string, e: React.MouseEvent) => void;
  onSelectTip?: (tip: HealthTipItem) => void;
}

export const TipDetailsModal: React.FC<TipDetailsModalProps> = ({
  tip,
  isOpen,
  onClose,
  onToggleSave,
  onSelectTip,
}) => {
  const [relatedTips, setRelatedTips] = useState<HealthTipItem[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (tip && isOpen) {
      // Record view in backend
      healthTipsService.recordTipView(tip.id);

      // Fetch related tips
      const fetchRelated = async () => {
        try {
          const related = await healthTipsService.getRelatedTips(tip.id, tip.category);
          setRelatedTips(related);
        } catch (e) {
          console.error(e);
        }
      };
      fetchRelated();
    }
  }, [tip, isOpen]);

  if (!isOpen || !tip) return null;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: tip.title,
          text: tip.summary,
          url: window.location.href,
        });
      } catch (e) {
        // User cancelled or share failed
      }
    } else {
      navigator.clipboard.writeText(`${tip.title} - ${tip.summary}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-700 border border-teal-100 flex items-center justify-center shadow-2xs font-bold">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-100">
                  {tip.category}
                </span>
                <span className="text-slate-400 text-xs flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {tip.read_time}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Educational Health Information
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 custom-scrollbar text-xs">
          {/* Title & Summary */}
          <div className="space-y-2">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug">
              {tip.title}
            </h2>
            <p className="text-slate-600 font-medium leading-relaxed bg-teal-50/50 p-3.5 rounded-2xl border border-teal-100/70">
              {tip.summary}
            </p>
          </div>

          {/* Full Article Markdown Content */}
          <div className="prose prose-slate max-w-none text-slate-700 leading-relaxed text-xs space-y-3 whitespace-pre-line">
            {tip.content}
          </div>

          {/* Tags */}
          {tip.tags && (
            <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Tags:</span>
              {tip.tags.split(',').map((tag) => (
                <span
                  key={tag.trim()}
                  className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-[10px] font-semibold"
                >
                  #{tag.trim()}
                </span>
              ))}
            </div>
          )}

          {/* Source / Clinical Review Card */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/90 space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-slate-900">
              <ShieldCheck className="w-4 h-4 text-teal-600" />
              <span>Evidence-Based Information</span>
            </div>
            <p className="text-[11px] text-slate-600">
              <strong>Source:</strong> {tip.source || 'MediAssist Medical Advisory & Clinical Guidelines'}
            </p>
            <p className="text-[11px] text-slate-600">
              <strong>Reviewed By:</strong> {tip.reviewed_by || tip.author}
            </p>
            <p className="text-[10px] text-slate-400 pt-1 italic">
              Disclaimer: This content is for general educational and preventive purposes only. It is not intended to replace direct professional medical diagnosis or personalized treatment.
            </p>
          </div>

          {/* Related Tips */}
          {relatedTips.length > 0 && (
            <div className="space-y-2.5 pt-2 border-t border-slate-100">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Related Health Tips
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {relatedTips.map((r) => (
                  <div
                    key={r.id}
                    onClick={() => onSelectTip && onSelectTip(r)}
                    className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition cursor-pointer flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <h5 className="font-bold text-slate-900 text-xs truncate">{r.title}</h5>
                      <span className="text-[10px] text-slate-400">{r.read_time}</span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleShare}
            className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl font-bold text-xs transition flex items-center gap-1.5 cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-teal-600" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4" />
                <span>Share</span>
              </>
            )}
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={(e) => onToggleSave(tip.id, e)}
              className={`px-4 py-2 rounded-xl font-bold text-xs transition flex items-center gap-1.5 border cursor-pointer ${
                tip.is_saved
                  ? 'bg-teal-50 border-teal-300 text-teal-700 shadow-2xs'
                  : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700 shadow-2xs'
              }`}
            >
              {tip.is_saved ? (
                <>
                  <Check className="w-4 h-4 text-teal-600" />
                  <span>Saved</span>
                </>
              ) : (
                <>
                  <Bookmark className="w-4 h-4 text-slate-400" />
                  <span>Save Tip</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold text-xs transition cursor-pointer shadow-sm"
            >
              Done Reading
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
