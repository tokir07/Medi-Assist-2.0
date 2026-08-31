import React, { useState, useEffect } from 'react';
import {
  X,
  GitCompare,
  ArrowRight,
  Activity,
  Calendar,
  Loader2,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Minus
} from 'lucide-react';
import { recordsService } from '../../services/recordsService';
import type { MedicalRecordItem, ReportCompareResponse } from '../../types/records';

interface ReportComparisonModalProps {
  records: MedicalRecordItem[];
  isOpen: boolean;
  onClose: () => void;
}

export const ReportComparisonModal: React.FC<ReportComparisonModalProps> = ({
  records,
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  const validRecords = records.filter((r) => r.extracted_data && r.extracted_data.parameters?.length);

  const [id1, setId1] = useState<string>(validRecords[0]?.id || '');
  const [id2, setId2] = useState<string>(validRecords[1]?.id || validRecords[0]?.id || '');
  const [comparison, setComparison] = useState<ReportCompareResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (id1 && id2) {
      runComparison(id1, id2);
    }
  }, [id1, id2]);

  const runComparison = async (rec1: string, rec2: string) => {
    try {
      setLoading(true);
      const res = await recordsService.compareReports(rec1, rec2);
      setComparison(res);
    } catch (err) {
      console.error('Failed to compare reports:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl flex flex-col overflow-hidden max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600">
              <GitCompare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Side-by-Side Report Comparison</h2>
              <p className="text-xs text-slate-500">
                Compare medical values between two reports to inspect changes and progression over time.
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

        {/* Report Selectors */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
              Baseline Report 1 (Earlier)
            </label>
            <select
              value={id1}
              onChange={(e) => setId1(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 outline-none focus:border-teal-500"
            >
              {validRecords.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.title} ({r.record_date || 'Recent'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
              Comparison Report 2 (Follow-up)
            </label>
            <select
              value={id2}
              onChange={(e) => setId2(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 outline-none focus:border-teal-500"
            >
              {validRecords.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.title} ({r.record_date || 'Recent'})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Comparison Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-500 gap-2">
              <Loader2 className="w-7 h-7 animate-spin text-teal-600" />
              <span className="text-xs">Aligning and comparing extracted parameters...</span>
            </div>
          ) : !comparison || comparison.parameters.length === 0 ? (
            <div className="p-10 text-center bg-slate-50 rounded-2xl border border-slate-200 text-slate-500">
              <Activity className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="font-semibold text-xs text-slate-700">No common parameters found to compare</p>
              <p className="text-[11px] text-slate-400 mt-1">
                Select two diagnostic reports containing laboratory parameters.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold text-[11px]">
                    <tr>
                      <th className="py-2.5 px-3">Parameter</th>
                      <th className="py-2.5 px-3">{comparison.report_1_title} ({comparison.report_1_date})</th>
                      <th className="py-2.5 px-3">{comparison.report_2_title} ({comparison.report_2_date})</th>
                      <th className="py-2.5 px-3 text-right">Delta / Change</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {comparison.parameters.map((p, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/60 transition">
                        <td className="py-2.5 px-3">
                          <span className="font-medium text-slate-800">{p.display_name}</span>
                          <span className="block text-[10px] text-slate-400 font-mono">
                            Ref: {p.reference_range || 'Not provided'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono">
                          {p.value_1 ? (
                            <span className="font-bold text-slate-900">
                              {p.value_1} <span className="font-normal text-slate-500 text-[10px]">{p.unit || ''}</span>
                            </span>
                          ) : (
                            <span className="text-slate-400 italic text-[10px]">-</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-mono">
                          {p.value_2 ? (
                            <span className="font-bold text-slate-900">
                              {p.value_2} <span className="font-normal text-slate-500 text-[10px]">{p.unit || ''}</span>
                            </span>
                          ) : (
                            <span className="text-slate-400 italic text-[10px]">-</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          {p.delta !== null && p.delta !== undefined ? (
                            <span
                              className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded font-mono font-bold text-xs ${
                                p.delta > 0
                                  ? 'bg-rose-50 text-rose-700'
                                  : p.delta < 0
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {p.delta > 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : p.delta < 0 ? <ArrowDownRight className="w-3.5 h-3.5" /> : <Minus className="w-3.5 h-3.5" />}
                              {p.delta_text}
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">{p.delta_text || '-'}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
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
