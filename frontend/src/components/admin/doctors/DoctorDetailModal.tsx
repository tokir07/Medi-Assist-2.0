import React, { useState } from 'react';
import type { DoctorItem } from '../../../types/admin';
import { adminService } from '../../../services/adminService';
import {
  X,
  Stethoscope,
  Building2,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Mail,
  Phone,
  Calendar,
  Award,
  DollarSign,
  Loader2,
} from 'lucide-react';

interface DoctorDetailModalProps {
  doctor: DoctorItem | null;
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

export const DoctorDetailModal: React.FC<DoctorDetailModalProps> = ({
  doctor,
  isOpen,
  onClose,
  onRefresh,
}) => {
  const [verifying, setVerifying] = useState<boolean>(false);
  const [suspending, setSuspending] = useState<boolean>(false);
  const [actionError, setActionError] = useState<string | null>(null);

  if (!isOpen || !doctor) return null;

  const handleVerify = async (status: string) => {
    try {
      setVerifying(true);
      setActionError(null);
      await adminService.verifyDoctor(doctor.id, status, `Manual review by admin on ${new Date().toLocaleDateString()}`);
      onRefresh();
      onClose();
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Verification update failed.');
    } finally {
      setVerifying(false);
    }
  };

  const handleToggleSuspend = async () => {
    try {
      setSuspending(true);
      setActionError(null);
      const shouldSuspend = doctor.account_status !== 'SUSPENDED';
      await adminService.suspendDoctor(doctor.id, shouldSuspend, shouldSuspend ? 'Administrative compliance lock' : 'Compliance cleared');
      onRefresh();
      onClose();
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Account status update failed.');
    } finally {
      setSuspending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn text-xs">
      <div className="bg-white w-full max-w-xl rounded-2xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center font-bold shrink-0">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-sm text-slate-900 leading-tight truncate">
                {doctor.name}
              </h3>
              <p className="text-[11px] text-teal-700 font-mono font-bold">
                {doctor.doctor_id}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action Error Alert */}
        {actionError && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-medium">
            {actionError}
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar space-y-4">
          {/* Status Badges */}
          <div className="flex items-center gap-2 flex-wrap pb-2 border-b border-slate-100">
            <span
              className={`px-2.5 py-1 rounded-md text-[10px] font-bold border ${
                doctor.verification_status === 'VERIFIED'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : doctor.verification_status === 'PENDING_VERIFICATION'
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : 'bg-rose-50 text-rose-700 border-rose-200'
              }`}
            >
              Verification: {doctor.verification_status}
            </span>

            <span
              className={`px-2.5 py-1 rounded-md text-[10px] font-bold border ${
                doctor.account_status === 'ACTIVE'
                  ? 'bg-teal-50 text-teal-700 border-teal-200'
                  : doctor.account_status === 'SUSPENDED'
                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                  : 'bg-slate-50 text-slate-600 border-slate-200'
              }`}
            >
              Account: {doctor.account_status}
            </span>
          </div>

          {/* Section 1: Clinical Profile */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
            <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-teal-600" />
              <span>Clinical Credentials</span>
            </h4>
            <div className="grid grid-cols-2 gap-y-2 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px]">Specialization:</span>
                <strong className="text-slate-900">{doctor.specialization}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Qualifications:</span>
                <strong className="text-slate-900">{doctor.qualification}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Registration Number:</span>
                <strong className="text-slate-900">{doctor.registration_number || 'N/A'}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Authority:</span>
                <strong className="text-slate-900">{doctor.registration_authority || 'NMC'}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Experience:</span>
                <strong className="text-slate-900">{doctor.experience} Years</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Consultation Fee:</span>
                <strong className="text-slate-900">₹{doctor.consultation_fee}</strong>
              </div>
            </div>
          </div>

          {/* Section 2: Hospital & Department */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
            <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-teal-600" />
              <span>Affiliated Facility</span>
            </h4>
            <div className="grid grid-cols-2 gap-y-2 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px]">Hospital / Clinic:</span>
                <strong className="text-slate-900">{doctor.hospital}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Department:</span>
                <strong className="text-slate-900">{doctor.department}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Designation:</span>
                <strong className="text-slate-900">{doctor.designation}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Email:</span>
                <strong className="text-slate-900">{doctor.email}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between gap-3">
          {/* Suspend / Reactivate Action */}
          <button
            type="button"
            onClick={handleToggleSuspend}
            disabled={suspending}
            className={`px-3.5 py-2 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer text-xs ${
              doctor.account_status === 'SUSPENDED'
                ? 'bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200'
                : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
            }`}
          >
            {suspending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : doctor.account_status === 'SUSPENDED' ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Reactivate Account</span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Suspend Account</span>
              </>
            )}
          </button>

          {/* Verification Actions */}
          <div className="flex items-center gap-2">
            {doctor.verification_status !== 'VERIFIED' && (
              <button
                type="button"
                onClick={() => handleVerify('VERIFIED')}
                disabled={verifying}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs text-xs"
              >
                {verifying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                <span>Approve & Verify</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-bold transition cursor-pointer text-xs"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
