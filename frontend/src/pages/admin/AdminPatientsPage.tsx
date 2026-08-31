import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import type { PatientItem } from '../../services/adminService';
import {
  Users,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Eye,
  X,
  Loader2,
  Lock,
  ShieldAlert,
  Calendar,
} from 'lucide-react';

export const AdminPatientsPage: React.FC = () => {
  const [patients, setPatients] = useState<PatientItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals state
  const [viewingPatient, setViewingPatient] = useState<PatientItem | null>(null);
  const [togglingPatient, setTogglingPatient] = useState<PatientItem | null>(null);
  const [toggleReason, setToggleReason] = useState<string>('Administrative decision');

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const res = await adminService.getPatients(searchTerm);
      setPatients(res.patients || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleConfirmToggleStatus = async () => {
    if (!togglingPatient) return;
    const newStatus = !togglingPatient.is_active;
    try {
      await adminService.togglePatientStatus(togglingPatient.id, newStatus, toggleReason);
      showToast(
        newStatus
          ? `Patient account ${togglingPatient.name} reactivated.`
          : `Patient account ${togglingPatient.name} restricted.`
      );
      setTogglingPatient(null);
      fetchPatients();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-teal-800 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 text-sm font-semibold animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-5 h-5 text-teal-300 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Users className="w-6 h-6 text-teal-600" />
            <span>Patients Account Management</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Administrative management of registered patient accounts, ABHA linkages, and account access.
          </p>
        </div>
      </div>

      {/* Search Input */}
      <div className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
        <Search className="w-4 h-4 text-slate-400 pl-1" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && fetchPatients()}
          placeholder="Search patients by name, email, phone, or ABHA ID..."
          className="flex-1 bg-transparent text-xs sm:text-sm text-slate-900 font-medium placeholder:text-slate-400 focus:outline-none"
        />
      </div>

      {/* Patients Table */}
      {loading ? (
        <div className="min-h-[40vh] flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
          <span className="text-xs font-medium text-slate-500">Loading patient accounts...</span>
        </div>
      ) : patients.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
          <Users className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No Patient Accounts Found</h3>
          <p className="text-xs text-slate-500">There are currently no patient records matching your search query.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/50 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-3 px-4">Patient ID</th>
                  <th className="py-3 px-4">Patient</th>
                  <th className="py-3 px-4">ABHA ID</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Registration Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {patients.map((pat) => (
                  <tr key={pat.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{pat.id.slice(0, 8).toUpperCase()}</td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-800 font-bold flex items-center justify-center text-xs shrink-0">
                          {pat.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">{pat.name}</div>
                          <div className="text-[11px] text-slate-400">{pat.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-teal-700 font-semibold">{pat.abha_id || 'N/A'}</td>
                    <td className="py-3.5 px-4 text-slate-600 font-medium">{pat.city || 'New Delhi'}</td>
                    <td className="py-3.5 px-4 text-slate-500">{pat.created_at}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          pat.is_active
                            ? 'bg-teal-50 text-teal-700 border border-teal-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {pat.is_active ? 'Active' : 'Restricted'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setViewingPatient(pat)}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
                        >
                          View Details
                        </button>
                        <button
                          type="button"
                          onClick={() => setTogglingPatient(pat)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            pat.is_active
                              ? 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                              : 'bg-teal-50 text-teal-700 hover:bg-teal-100'
                          }`}
                        >
                          {pat.is_active ? 'Restrict' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Patient Detail Modal */}
      {viewingPatient && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-slate-200 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-teal-600" />
                <span>Patient Account Metadata</span>
              </h3>
              <button
                type="button"
                onClick={() => setViewingPatient(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <div className="font-bold text-sm text-slate-900">{viewingPatient.name}</div>
                <div className="text-slate-500">{viewingPatient.email} • {viewingPatient.phone || 'Phone not provided'}</div>
                <div className="font-mono text-teal-700 font-bold mt-1">ABHA ID: {viewingPatient.abha_id || 'N/A'}</div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-slate-400 block font-semibold">Gender & DOB</span>
                  <span className="font-bold text-slate-800">{viewingPatient.gender || 'Not specified'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">Blood Group</span>
                  <span className="font-bold text-slate-800">{viewingPatient.blood_group || 'O+'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">City / Region</span>
                  <span className="font-medium text-slate-800">{viewingPatient.city || 'New Delhi'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">KYC Verification</span>
                  <span className="font-bold text-teal-600">{viewingPatient.kyc_verified ? 'Verified' : 'Unverified'}</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-[11px] font-bold text-slate-700 block">Platform Activity Overview</span>
                <div className="grid grid-cols-3 gap-2 text-center pt-1">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Records</span>
                    <span className="font-bold text-slate-800">{viewingPatient.records_count}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Appointments</span>
                    <span className="font-bold text-slate-800">{viewingPatient.appointments_count}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Prescriptions</span>
                    <span className="font-bold text-slate-800">{viewingPatient.prescriptions_count}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setViewingPatient(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Restrict / Activate Modal */}
      {togglingPatient && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2 text-amber-600">
                <AlertTriangle className="w-5 h-5" />
                <span>{togglingPatient.is_active ? 'Restrict Patient Account?' : 'Reactivate Patient Account?'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setTogglingPatient(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              {togglingPatient.is_active
                ? `Restricting ${togglingPatient.name} will prevent them from booking new appointments until reactivated.`
                : `Reactivating ${togglingPatient.name} will restore full access to the Patient Portal.`}
            </p>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Reason</label>
              <input
                type="text"
                value={toggleReason}
                onChange={(e) => setToggleReason(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setTogglingPatient(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmToggleStatus}
                className={`px-4 py-2 rounded-xl text-white text-xs font-bold cursor-pointer shadow-2xs ${
                  togglingPatient.is_active ? 'bg-rose-600 hover:bg-rose-700' : 'bg-teal-600 hover:bg-teal-700'
                }`}
              >
                {togglingPatient.is_active ? 'Confirm Restrict' : 'Confirm Reactivate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
