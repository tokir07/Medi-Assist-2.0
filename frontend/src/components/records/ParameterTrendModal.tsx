import React, { useState, useEffect } from 'react';
import {
  X,
  TrendingUp,
  Activity,
  Calendar,
  FileText,
  Loader2,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Minus
} from 'lucide-react';
import { recordsService } from '../../services/recordsService';
import type { ParameterTrendResponse } from '../../types/records';

interface ParameterTrendModalProps {
  initialParameter?: string;
  isOpen: boolean;
  onClose: () => void;
}

const COMMON_TREND_PARAMS = [
  { key: 'hba1c', label: 'HbA1c' },
  { key: 'fasting_blood_glucose', label: 'Fasting Blood Glucose' },
  { key: 'total_cholesterol', label: 'Total Cholesterol' },
  { key: 'hdl_cholesterol', label: 'HDL Cholesterol' },
  { key: 'ldl_cholesterol', label: 'LDL Cholesterol' },
  { key: 'hemoglobin', label: 'Hemoglobin' },
  { key: 'platelets', label: 'Platelet Count' },
  { key: 'serum_creatinine', label: 'Serum Creatinine' },
  { key: 'tsh', label: 'TSH (Thyroid)' }
];

export const ParameterTrendModal: React.FC<ParameterTrendModalProps> = ({
  initialParameter = 'hba1c',
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  const [selectedParam, setSelectedParam] = useState<string>(initialParameter || 'hba1c');
  const [data, setData] = useState<ParameterTrendResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchTrend(selectedParam);
  }, [selectedParam]);

  const fetchTrend = async (param: string) => {
    try {
      setLoading(true);
      const res = await recordsService.getParameterTrends(param);
      setData(res);
    } catch (err) {
      console.error('Failed to fetch parameter trend:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl flex flex-col overflow-hidden max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Biomarker Trend Analysis</h2>
              <p className="text-xs text-slate-500">
                Track how specific lab values change chronologically across multiple reports.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Parameter Filter Pills */}
        <div className="px-6 py-3 border-b border-slate-100 bg-white flex items-center gap-1.5 overflow-x-auto">
          {COMMON_TREND_PARAMS.map((p) => (
            <button
              key={p.key}
              onClick={() => setSelectedParam(p.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                selectedParam === p.key
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-500 gap-2">
              <Loader2 className="w-7 h-7 animate-spin text-teal-600" />
              <span className="text-xs">Aggregating historical measurements...</span>
            </div>
          ) : !data || data.trend_points.length === 0 ? (
            <div className="p-12 text-center bg-slate-50 rounded-2xl border border-slate-200 text-slate-500">
              <Activity className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-slate-700">No Recorded Measurements</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                No uploaded reports in your history currently contain measurements for <strong>{selectedParam.replace('_', ' ')}</strong>.
              </p>
            </div>
          ) : (
            <>
              {/* Stat Summary Card */}
              <div className="p-4 bg-teal-50/70 border border-teal-100 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-teal-800 tracking-wider uppercase block">
                    {data.category.replace('_', ' ')}
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 mt-0.5">{data.display_name}</h3>
                  <p className="text-xs text-slate-500">
                    {data.trend_points.length} recorded measurement{data.trend_points.length > 1 ? 's' : ''} across health history
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-500 block">LATEST VALUE</span>
                  <span className="text-xl font-mono font-extrabold text-teal-900">
                    {data.trend_points[data.trend_points.length - 1].value}{' '}
                    <span className="text-xs font-normal text-teal-700">{data.unit || ''}</span>
                  </span>
                </div>
              </div>

              {/* Chronological Measurements Timeline */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Measurement History
                </h4>
                <div className="space-y-2">
                  {data.trend_points.map((pt, idx) => {
                    const prev = idx > 0 ? data.trend_points[idx - 1] : null;
                    let deltaNode = null;
                    if (prev && pt.numeric_value && prev.numeric_value) {
                      const diff = roundDiff(pt.numeric_value - prev.numeric_value);
                      if (diff > 0) {
                        deltaNode = (
                          <span className="text-[11px] font-semibold text-rose-600 flex items-center">
                            <ArrowUpRight className="w-3.5 h-3.5" /> +{diff}
                          </span>
                        );
                      } else if (diff < 0) {
                        deltaNode = (
                          <span className="text-[11px] font-semibold text-emerald-600 flex items-center">
                            <ArrowDownRight className="w-3.5 h-3.5" /> {diff}
                          </span>
                        );
                      } else {
                        deltaNode = (
                          <span className="text-[11px] text-slate-400 flex items-center">
                            <Minus className="w-3.5 h-3.5" /> 0.0
                          </span>
                        );
                      }
                    }

                    return (
                      <div
                        key={idx}
                        className="p-3.5 bg-white border border-slate-200 rounded-xl hover:border-teal-300 transition flex items-center justify-between shadow-sm"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-xs">
                            #{idx + 1}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 text-xs">{pt.record_title}</span>
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                pt.status === 'HIGH' ? 'bg-rose-100 text-rose-700' :
                                pt.status === 'LOW' ? 'bg-amber-100 text-amber-700' :
                                'bg-emerald-100 text-emerald-700'
                              }`}>
                                {pt.status}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                              <Calendar className="w-3 h-3" /> {pt.date}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-right">
                          {deltaNode}
                          <div>
                            <span className="font-mono font-bold text-sm text-slate-900">
                              {pt.value} <span className="font-normal text-xs text-slate-500">{pt.unit || ''}</span>
                            </span>
                            {pt.reference_range && (
                              <span className="block text-[10px] text-slate-400 font-mono">
                                Ref: {pt.reference_range}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-lg transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

function roundDiff(n: number): number {
  return Math.round(n * 100) / 100;
}
