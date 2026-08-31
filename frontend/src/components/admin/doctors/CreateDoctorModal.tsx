import React, { useState, useEffect } from 'react';
import { adminService } from '../../../services/adminService';
import type { DoctorCreatePayload, OrganizationItem, DepartmentItem } from '../../../types/admin';
import {
  X,
  User,
  Stethoscope,
  Building2,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ChevronRight,
  ChevronLeft,
  Mail,
  Phone,
  Award,
} from 'lucide-react';

interface CreateDoctorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newDoctorId: string) => void;
}

export const CreateDoctorModal: React.FC<CreateDoctorModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [step, setStep] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Organizations & Departments from DB
  const [organizations, setOrganizations] = useState<OrganizationItem[]>([]);
  const [departments, setDepartments] = useState<DepartmentItem[]>([]);

  // Form State
  const [formData, setFormData] = useState<DoctorCreatePayload>({
    name: '',
    email: '',
    phone: '',
    gender: 'Female',
    specialization: 'Cardiology',
    qualification: 'MBBS, MD (Cardiology)',
    experience: 5,
    medical_registration_number: '',
    registration_authority: 'National Medical Commission',
    designation: 'Senior Consultant Physician',
    hospital: 'City Care Hospital',
    department: 'Cardiology',
    consultation_fee: 600,
    verification_status: 'VERIFIED',
    send_invitation: true,
  });

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setError(null);
      // Load available organizations and departments from PostgreSQL
      const loadOrgData = async () => {
        try {
          const orgsData = await adminService.getOrganizations();
          setOrganizations(orgsData.organizations);
          const deptsData = await adminService.getDepartments();
          setDepartments(deptsData.departments);
          if (orgsData.organizations.length > 0) {
            setFormData((prev) => ({
              ...prev,
              hospital: orgsData.organizations[0].name,
              organization_id: orgsData.organizations[0].id,
            }));
          }
        } catch (err) {
          console.error('Failed to load organizations:', err);
        }
      };
      loadOrgData();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (field: keyof DoctorCreatePayload, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleNextStep = () => {
    setError(null);
    if (step === 1) {
      if (!formData.name.trim() || !formData.email.trim()) {
        setError('Doctor full name and email are required.');
        return;
      }
      if (!formData.email.includes('@')) {
        setError('Please enter a valid email address.');
        return;
      }
    } else if (step === 2) {
      if (!formData.specialization.trim() || !formData.medical_registration_number.trim()) {
        setError('Specialization and Medical Registration Number are mandatory.');
        return;
      }
    }
    setStep((prev) => prev + 1);
  };

  const handlePrevStep = () => {
    setError(null);
    setStep((prev) => Math.max(1, prev - 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      const created = await adminService.createDoctor(formData);
      onSuccess(created.doctor_id);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to create doctor account.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const stepTitles = [
    'Personal Identity',
    'Clinical Credentials',
    'Hospital & Department',
    'Account & Verification',
    'Review & Finalize',
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn text-xs">
      <div className="bg-white w-full max-w-2xl rounded-2xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center font-bold">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 leading-tight">
                Create & Onboard Doctor Account
              </h3>
              <p className="text-[11px] text-slate-500">
                Step {step} of 5: {stepTitles[step - 1]}
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

        {/* Wizard Progress Bar */}
        <div className="w-full bg-slate-100 h-1">
          <div
            className="bg-teal-600 h-1 transition-all duration-300"
            style={{ width: `${(step / 5) * 100}%` }}
          />
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="font-medium leading-snug">{error}</span>
          </div>
        )}

        {/* Body Form */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-4">
          {/* STEP 1: Personal Identity */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Doctor Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Priya Sharma"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 focus:border-teal-600 focus:ring-1 focus:ring-teal-600 outline-hidden font-medium text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Official Email Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. dr.priya@hospital.org"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 focus:border-teal-600 focus:ring-1 focus:ring-teal-600 outline-hidden font-medium text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Contact Phone</label>
                  <input
                    type="tel"
                    placeholder="e.g. +91 98765 43210"
                    value={formData.phone || ''}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 focus:border-teal-600 focus:ring-1 focus:ring-teal-600 outline-hidden font-medium text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Gender</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => handleChange('gender', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 focus:border-teal-600 focus:ring-1 focus:ring-teal-600 outline-hidden font-medium text-slate-900 cursor-pointer"
                  >
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Other">Other / Prefer not to say</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Clinical Credentials */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Specialization <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Cardiology, Neurology, General Medicine"
                    value={formData.specialization}
                    onChange={(e) => handleChange('specialization', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 focus:border-teal-600 focus:ring-1 focus:ring-teal-600 outline-hidden font-medium text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Qualifications <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. MBBS, MD, DM, FRCP"
                    value={formData.qualification}
                    onChange={(e) => handleChange('qualification', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 focus:border-teal-600 focus:ring-1 focus:ring-teal-600 outline-hidden font-medium text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Medical Registration Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. NMC/MCI-2024-8841"
                    value={formData.medical_registration_number}
                    onChange={(e) => handleChange('medical_registration_number', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 focus:border-teal-600 focus:ring-1 focus:ring-teal-600 outline-hidden font-medium text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Registration Authority</label>
                  <input
                    type="text"
                    placeholder="e.g. National Medical Commission / State Council"
                    value={formData.registration_authority || ''}
                    onChange={(e) => handleChange('registration_authority', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 focus:border-teal-600 focus:ring-1 focus:ring-teal-600 outline-hidden font-medium text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Years of Experience</label>
                  <input
                    type="number"
                    min="0"
                    max="60"
                    value={formData.experience}
                    onChange={(e) => handleChange('experience', parseInt(e.target.value) || 0)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 focus:border-teal-600 focus:ring-1 focus:ring-teal-600 outline-hidden font-medium text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Designation</label>
                  <input
                    type="text"
                    placeholder="e.g. Senior Consultant"
                    value={formData.designation || ''}
                    onChange={(e) => handleChange('designation', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 focus:border-teal-600 focus:ring-1 focus:ring-teal-600 outline-hidden font-medium text-slate-900"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Hospital & Department */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Hospital / Organization <span className="text-rose-500">*</span>
                  </label>
                  {organizations.length > 0 ? (
                    <select
                      value={formData.hospital}
                      onChange={(e) => {
                        const org = organizations.find((o) => o.name === e.target.value);
                        handleChange('hospital', e.target.value);
                        if (org) handleChange('organization_id', org.id);
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 focus:border-teal-600 focus:ring-1 focus:ring-teal-600 outline-hidden font-medium text-slate-900 cursor-pointer"
                    >
                      {organizations.map((org) => (
                        <option key={org.id} value={org.name}>
                          {org.name} ({org.city})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={formData.hospital}
                      onChange={(e) => handleChange('hospital', e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 focus:border-teal-600 focus:ring-1 focus:ring-teal-600 outline-hidden font-medium text-slate-900"
                    />
                  )}
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Department <span className="text-rose-500">*</span>
                  </label>
                  {departments.length > 0 ? (
                    <select
                      value={formData.department}
                      onChange={(e) => {
                        const d = departments.find((dept) => dept.name === e.target.value);
                        handleChange('department', e.target.value);
                        if (d) handleChange('department_id', d.id);
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 focus:border-teal-600 focus:ring-1 focus:ring-teal-600 outline-hidden font-medium text-slate-900 cursor-pointer"
                    >
                      {departments.map((dept) => (
                        <option key={dept.id} value={dept.name}>
                          {dept.name} ({dept.organization_name})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={formData.department}
                      onChange={(e) => handleChange('department', e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 focus:border-teal-600 focus:ring-1 focus:ring-teal-600 outline-hidden font-medium text-slate-900"
                    />
                  )}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Consultation Fee (₹)</label>
                <input
                  type="number"
                  min="0"
                  step="50"
                  value={formData.consultation_fee || 500}
                  onChange={(e) => handleChange('consultation_fee', parseInt(e.target.value) || 0)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 focus:border-teal-600 focus:ring-1 focus:ring-teal-600 outline-hidden font-medium text-slate-900"
                />
              </div>
            </div>
          )}

          {/* STEP 4: Account & Verification Settings */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <h4 className="font-bold text-slate-900">Verification & Status</h4>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Initial Verification Status</label>
                  <select
                    value={formData.verification_status}
                    onChange={(e) => handleChange('verification_status', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 focus:border-teal-600 focus:ring-1 focus:ring-teal-600 outline-hidden font-medium text-slate-900 cursor-pointer"
                  >
                    <option value="VERIFIED">Verified (Direct Approval)</option>
                    <option value="PENDING_VERIFICATION">Pending Verification (Manual Review)</option>
                  </select>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-teal-50/60 border border-teal-200 space-y-2">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.send_invitation}
                    onChange={(e) => handleChange('send_invitation', e.target.checked)}
                    className="rounded border-slate-300 text-teal-600 focus:ring-teal-600"
                  />
                  <span className="font-bold text-slate-900">
                    Generate Secure Onboarding Token & Invitation
                  </span>
                </label>
                <p className="text-[11px] text-slate-600 pl-6 leading-relaxed">
                  Doctor will receive an activation link to verify their credentials and set their private password. Permanent passwords are never stored in plaintext or exposed to administrators.
                </p>
              </div>
            </div>
          )}

          {/* STEP 5: Review & Submit */}
          {step === 5 && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <h4 className="font-bold text-slate-900 pb-2 border-b border-slate-200">
                  Review Physician Profile
                </h4>
                <div className="grid grid-cols-2 gap-y-2.5 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Full Name:</span>
                    <strong className="text-slate-900">{formData.name}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Email:</span>
                    <strong className="text-slate-900">{formData.email}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Specialization:</span>
                    <strong className="text-slate-900">{formData.specialization}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Registration Number:</span>
                    <strong className="text-slate-900">{formData.medical_registration_number}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Hospital:</span>
                    <strong className="text-slate-900">{formData.hospital}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Department:</span>
                    <strong className="text-slate-900">{formData.department}</strong>
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span className="text-[11px] font-medium leading-snug">
                  Upon submission, a unique Doctor ID will be generated in PostgreSQL and an immutable audit event will be logged.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation Controls */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between">
          {step > 1 ? (
            <button
              type="button"
              onClick={handlePrevStep}
              disabled={loading}
              className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
          ) : (
            <div />
          )}

          {step < 5 ? (
            <button
              type="button"
              onClick={handleNextStep}
              className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold transition flex items-center gap-2 cursor-pointer shadow-2xs disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Create & Issue Doctor ID</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
