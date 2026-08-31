import React, { useState } from 'react';
import { X, FileText, CheckCircle2, AlertCircle, Building, Clock } from 'lucide-react';
import { recordsService } from '../../services/recordsService';

interface RequestRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RequestRecordModal: React.FC<RequestRecordModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [hospitalName, setHospitalName] = useState('City Care Hospital');
  const [department, setDepartment] = useState('Pathology / Diagnostics');
  const [recordType, setRecordType] = useState('Lab Report');
  const [urgency, setUrgency] = useState<'NORMAL' | 'URGENT'>('NORMAL');
  const [notes, setNotes] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [successResult, setSuccessResult] = useState<{ id: string; message: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hospitalName.trim()) {
      setError('Please provide the hospital or lab name.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      const res = await recordsService.requestDocument({
        hospital_name: hospitalName.trim(),
        department: department.trim(),
        record_type: recordType.trim(),
        urgency,
        notes: notes.trim() || undefined,
      });

      setSuccessResult({
        id: res.request_id,
        message: res.message,
      });

      setTimeout(() => {
        setSubmitting(false);
      }, 500);
    } catch (err: any) {
      console.error('Failed to submit document request:', err);
      setError(err?.response?.data?.message || 'Failed to submit document request.');
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-3xl border border-[#D9E1EA] w-full max-w-lg shadow-[0_20px_50px_rgba(16,42,86,0.15)] overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-[#E7EDF4] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#FEF3C7] text-[#D99500] flex items-center justify-center shadow-2xs">
              <FileText className="w-4 h-4 text-[#D99500]" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-[#102A56]">Request Medical Records</h3>
              <p className="text-[11px] text-[#5F6F86]">Request reports from partner hospitals & labs</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-[#8A98AA] hover:text-[#102A56] hover:bg-[#F4F8FC] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {successResult ? (
          <div className="p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-[#E6F7F7] text-[#0FA3A3] flex items-center justify-center mx-auto shadow-2xs">
              <CheckCircle2 className="w-7 h-7 text-[#0FA3A3]" />
            </div>
            <div>
              <h4 className="text-base font-bold text-[#102A56]">Request Successfully Submitted</h4>
              <p className="text-xs text-[#5F6F86] mt-1 max-w-xs mx-auto">
                {successResult.message}
              </p>
              <div className="mt-3 p-3 rounded-2xl bg-[#F7FAFF] border border-[#E7EDF4] inline-block">
                <span className="text-[10px] text-[#8A98AA] font-semibold uppercase">Tracking ID</span>
                <p className="text-xs font-bold text-[#102A56] tracking-wider">{successResult.id}</p>
              </div>
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 rounded-xl bg-[#0FA3A3] hover:bg-[#0D8E8E] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-[#FFF5F5] border border-[#FED7D7] text-[#D64545] text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#102A56]">Hospital or Lab Facility</label>
                <input
                  type="text"
                  required
                  value={hospitalName}
                  onChange={(e) => setHospitalName(e.target.value)}
                  placeholder="e.g. City Care Hospital"
                  className="w-full px-3.5 py-2 rounded-xl bg-[#F7FAFF] border border-[#D9E1EA] text-xs sm:text-sm text-[#102A56] focus:bg-white focus:border-[#0FA3A3] focus:outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#102A56]">Department</label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="e.g. Pathology"
                    className="w-full px-3.5 py-2 rounded-xl bg-[#F7FAFF] border border-[#D9E1EA] text-xs sm:text-sm text-[#102A56] focus:bg-white focus:border-[#0FA3A3] focus:outline-none transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#102A56]">Record Type</label>
                  <select
                    value={recordType}
                    onChange={(e) => setRecordType(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#F7FAFF] border border-[#D9E1EA] text-xs sm:text-sm text-[#102A56] focus:bg-white focus:border-[#0FA3A3] focus:outline-none transition-all cursor-pointer"
                  >
                    <option value="Lab Report">Lab Report</option>
                    <option value="Radiology / Scan">Radiology / Scan</option>
                    <option value="Discharge Summary">Discharge Summary</option>
                    <option value="Prescription">Prescription</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#102A56]">Urgency</label>
                <select
                  value={urgency}
                  onChange={(e) => setUrgency(e.target.value as any)}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#F7FAFF] border border-[#D9E1EA] text-xs sm:text-sm text-[#102A56] focus:bg-white focus:border-[#0FA3A3] focus:outline-none transition-all cursor-pointer"
                >
                  <option value="NORMAL">Standard (24–48 hours)</option>
                  <option value="URGENT">Urgent (Clinical Follow-up)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#102A56]">Additional Instructions</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Specify visit date range or patient ID at facility..."
                  className="w-full px-3.5 py-2 rounded-xl bg-[#F7FAFF] border border-[#D9E1EA] text-xs sm:text-sm text-[#102A56] focus:bg-white focus:border-[#0FA3A3] focus:outline-none transition-all resize-none"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="px-4 py-2 rounded-xl border border-[#D9E1EA] text-xs font-bold text-[#5F6F86] hover:bg-[#F4F8FC] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 rounded-xl bg-[#0FA3A3] hover:bg-[#0D8E8E] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
