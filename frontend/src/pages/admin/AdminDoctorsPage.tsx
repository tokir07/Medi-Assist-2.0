import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { adminService } from '../../services/adminService';
import type { DoctorItem } from '../../services/adminService';
import {
  Stethoscope,
  Search,
  Filter,
  Plus,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  UserCheck,
  UserX,
  Eye,
  Edit,
  X,
  Loader2,
  ShieldAlert,
  Copy,
  Building,
} from 'lucide-react';

export const AdminDoctorsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [doctors, setDoctors] = useState<DoctorItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState<boolean>(searchParams.get('action') === 'create');
  const [showSuccessModal, setShowSuccessModal] = useState<DoctorItem | null>(null);
  const [viewingDoctor, setViewingDoctor] = useState<DoctorItem | null>(null);
  const [suspendingDoctor, setSuspendingDoctor] = useState<DoctorItem | null>(null);
  const [suspendReason, setSuspendReason] = useState<string>('Administrative decision');

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    specialization: 'General Medicine',
    qualification: 'MBBS, MD',
    experience: 5,
    medical_registration_number: '',
    registration_authority: 'National Medical Commission',
    designation: 'Consultant Physician',
    department: 'General Medicine',
    hospital: 'City Care Hospital',
    consultation_fee: 500,
    bio: '',
    send_invitation: true,
  });

  useEffect(() => {
    fetchDoctors();
  }, [statusFilter]);

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const res = await adminService.getDoctors(
        searchTerm,
        undefined,
        undefined,
        undefined,
        statusFilter === 'ALL' ? undefined : statusFilter
      );
      setDoctors(res.doctors || []);
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

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await adminService.createDoctor(formData);
      setShowCreateModal(false);
      setShowSuccessModal(created);
      showToast(`Doctor account created successfully with ID: ${created.doctor_id}`);
      fetchDoctors();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.detail || 'Failed to create doctor account.');
    }
  };

  const handleConfirmSuspend = async () => {
    if (!suspendingDoctor) return;
    const isSuspending = suspendingDoctor.account_status !== 'SUSPENDED';
    try {
      await adminService.suspendDoctor(suspendingDoctor.id, isSuspending, suspendReason);
      showToast(
        isSuspending
          ? `Doctor account ${suspendingDoctor.doctor_id} suspended.`
          : `Doctor account ${suspendingDoctor.doctor_id} reactivated.`
      );
      setSuspendingDoctor(null);
      fetchDoctors();
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
            <Stethoscope className="w-6 h-6 text-teal-600" />
            <span>Doctors Management</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage MediAssist doctor accounts, clinical credentials, onboarding & authorizations.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-2xs transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>+ Create Doctor</span>
        </button>
      </div>

      {/* Search & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex-1 flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchDoctors()}
            placeholder="Search doctors by name, email, Doctor ID, or registration number..."
            className="w-full bg-transparent text-xs sm:text-sm text-slate-900 font-medium placeholder:text-slate-400 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INVITED">Invited / Pending</option>
            <option value="SUSPENDED">Suspended</option>
          </select>
        </div>
      </div>

      {/* Doctor List Table */}
      {loading ? (
        <div className="min-h-[40vh] flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
          <span className="text-xs font-medium text-slate-500">Loading doctor accounts...</span>
        </div>
      ) : doctors.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
          <Stethoscope className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No Doctor Accounts Found</h3>
          <p className="text-xs text-slate-500">There are currently no doctor records matching your search query.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/50 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-3 px-4">Doctor ID</th>
                  <th className="py-3 px-4">Doctor</th>
                  <th className="py-3 px-4">Specialization</th>
                  <th className="py-3 px-4">Registration No.</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Created</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {doctors.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{doc.doctor_id}</td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-800 font-bold flex items-center justify-center text-xs shrink-0">
                          {doc.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">{doc.name}</div>
                          <div className="text-[11px] text-slate-400">{doc.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-700">{doc.specialization}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-500">{doc.registration_number || 'N/A'}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          doc.account_status === 'ACTIVE'
                            ? 'bg-teal-50 text-teal-700 border border-teal-200'
                            : doc.account_status === 'SUSPENDED'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {doc.account_status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">{doc.created_at}</td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setViewingDoctor(doc)}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
                        >
                          View
                        </button>
                        <button
                          type="button"
                          onClick={() => setSuspendingDoctor(doc)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            doc.account_status === 'SUSPENDED'
                              ? 'bg-teal-50 text-teal-700 hover:bg-teal-100'
                              : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                          }`}
                        >
                          {doc.account_status === 'SUSPENDED' ? 'Reactivate' : 'Suspend'}
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

      {/* Create Doctor Multi-Section Form Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-xl border border-slate-200 animate-in zoom-in-95 duration-150 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                  <Stethoscope className="w-5 h-5 text-teal-600" />
                  <span>Onboard New MediAssist Doctor</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Fill out personal, clinical registration, and hospital assignment details.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-6">
              {/* Section 1: Personal Information */}
              <div className="space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-teal-600 block">
                  Section 1: Personal Information
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Dr. Rohan Mehta"
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Email Address *</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="rohan.mehta@mediassist.demo"
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Phone Number</label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+91 98765 43210"
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Professional Credentials */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <span className="text-xs font-bold uppercase tracking-wider text-teal-600 block">
                  Section 2: Professional Information
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Medical Registration Number *</label>
                    <input
                      type="text"
                      required
                      value={formData.medical_registration_number}
                      onChange={(e) => setFormData({ ...formData, medical_registration_number: e.target.value })}
                      placeholder="MC-88901"
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Specialization *</label>
                    <select
                      value={formData.specialization}
                      onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none"
                    >
                      <option value="Cardiology">Cardiology</option>
                      <option value="General Medicine">General Medicine</option>
                      <option value="Dermatology">Dermatology</option>
                      <option value="Neurology">Neurology</option>
                      <option value="Pediatrics">Pediatrics</option>
                      <option value="Orthopedics">Orthopedics</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Qualification</label>
                    <input
                      type="text"
                      value={formData.qualification}
                      onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                      placeholder="MBBS, MD (Cardiology)"
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Years of Experience</label>
                    <input
                      type="number"
                      value={formData.experience}
                      onChange={(e) => setFormData({ ...formData, experience: parseInt(e.target.value) || 1 })}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: MediAssist Organization & Department */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <span className="text-xs font-bold uppercase tracking-wider text-teal-600 block">
                  Section 3: Hospital & Department Assignment
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Department</label>
                    <input
                      type="text"
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Hospital / Clinic Name</label>
                    <input
                      type="text"
                      value={formData.hospital}
                      onChange={(e) => setFormData({ ...formData, hospital: e.target.value })}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-2xs transition-all cursor-pointer"
                >
                  Create Doctor Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Doctor Creation Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200 text-center animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <h3 className="font-bold text-lg text-slate-900">Doctor Account Created Successfully</h3>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-left text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Doctor ID:</span>
                <span className="font-mono font-bold text-teal-700">{showSuccessModal.doctor_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Doctor Name:</span>
                <span className="font-bold text-slate-900">{showSuccessModal.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Email:</span>
                <span className="font-medium text-slate-800">{showSuccessModal.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Account Status:</span>
                <span className="font-bold text-teal-600">{showSuccessModal.account_status}</span>
              </div>
            </div>

            <p className="text-xs text-slate-500">
              A secure onboarding invitation has been created for the physician.
            </p>

            <button
              type="button"
              onClick={() => setShowSuccessModal(null)}
              className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold text-xs cursor-pointer shadow-2xs"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Doctor Detail Modal */}
      {viewingDoctor && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-slate-200 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-teal-600" />
                <span>Doctor Profile Details</span>
              </h3>
              <button
                type="button"
                onClick={() => setViewingDoctor(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <div className="font-bold text-sm text-slate-900">{viewingDoctor.name}</div>
                <div className="text-slate-500">{viewingDoctor.email} • {viewingDoctor.phone}</div>
                <div className="font-mono text-teal-700 font-bold mt-1">ID: {viewingDoctor.doctor_id}</div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-slate-400 block font-semibold">Specialization</span>
                  <span className="font-bold text-slate-800">{viewingDoctor.specialization}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">Registration Number</span>
                  <span className="font-mono font-bold text-slate-800">{viewingDoctor.registration_number || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">Qualification</span>
                  <span className="font-medium text-slate-800">{viewingDoctor.qualification}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">Hospital</span>
                  <span className="font-medium text-slate-800">{viewingDoctor.hospital}</span>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setViewingDoctor(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Suspend Confirmation Modal */}
      {suspendingDoctor && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2 text-rose-600">
                <AlertTriangle className="w-5 h-5" />
                <span>
                  {suspendingDoctor.account_status === 'SUSPENDED' ? 'Reactivate Doctor Account?' : 'Suspend Doctor Account?'}
                </span>
              </h3>
              <button
                type="button"
                onClick={() => setSuspendingDoctor(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              {suspendingDoctor.account_status === 'SUSPENDED'
                ? `Reactivating ${suspendingDoctor.name} (${suspendingDoctor.doctor_id}) will restore access to the Doctor Portal.`
                : `Suspending ${suspendingDoctor.name} (${suspendingDoctor.doctor_id}) will revoke access to the Doctor Portal immediately.`}
            </p>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Reason</label>
              <input
                type="text"
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSuspendingDoctor(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSuspend}
                className={`px-4 py-2 rounded-xl text-white text-xs font-bold cursor-pointer shadow-2xs ${
                  suspendingDoctor.account_status === 'SUSPENDED' ? 'bg-teal-600 hover:bg-teal-700' : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {suspendingDoctor.account_status === 'SUSPENDED' ? 'Confirm Reactivate' : 'Confirm Suspend'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
