import React, { useState, useEffect, useCallback } from 'react';
import { adminService } from '../../services/adminService';
import type { OrganizationItem, DepartmentItem } from '../../types/admin';
import {
  Building2,
  Plus,
  RefreshCw,
  MapPin,
  Phone,
  Mail,
  Award,
  Users,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';

export const AdminOrganizationsPage: React.FC = () => {
  const [organizations, setOrganizations] = useState<OrganizationItem[]>([]);
  const [departments, setDepartments] = useState<DepartmentItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [showOrgModal, setShowOrgModal] = useState<boolean>(false);
  const [showDeptModal, setShowDeptModal] = useState<boolean>(false);
  const [creating, setCreating] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form states
  const [orgForm, setOrgForm] = useState({
    name: '',
    organization_type: 'Multispecialty Hospital',
    city: 'New Delhi',
    state: 'Delhi',
    phone: '',
    email: '',
    license_number: '',
  });

  const [deptForm, setDeptForm] = useState({
    organization_id: '',
    name: '',
    head_doctor_name: '',
    description: '',
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [orgsRes, deptsRes] = await Promise.all([
        adminService.getOrganizations(),
        adminService.getDepartments(),
      ]);
      setOrganizations(orgsRes.organizations);
      setDepartments(deptsRes.departments);
      if (orgsRes.organizations.length > 0 && !deptForm.organization_id) {
        setDeptForm((prev) => ({ ...prev, organization_id: orgsRes.organizations[0].id }));
      }
    } catch (err: any) {
      console.error('Failed to load organizations:', err);
      setError(err.response?.data?.message || 'Unable to load healthcare organizations.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgForm.name.trim()) {
      setFormError('Organization name is required.');
      return;
    }
    try {
      setCreating(true);
      setFormError(null);
      await adminService.createOrganization(orgForm);
      setShowOrgModal(false);
      setOrgForm({
        name: '',
        organization_type: 'Multispecialty Hospital',
        city: 'New Delhi',
        state: 'Delhi',
        phone: '',
        email: '',
        license_number: '',
      });
      fetchData();
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to create organization.');
    } finally {
      setCreating(false);
    }
  };

  const handleCreateDept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptForm.name.trim() || !deptForm.organization_id) {
      setFormError('Department name and parent facility are required.');
      return;
    }
    try {
      setCreating(true);
      setFormError(null);
      await adminService.createDepartment(deptForm);
      setShowDeptModal(false);
      setDeptForm({
        organization_id: organizations[0]?.id || '',
        name: '',
        head_doctor_name: '',
        description: '',
      });
      fetchData();
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to create department.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6 text-xs">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
            Healthcare Facilities & Clinical Departments
          </h2>
          <p className="text-xs text-slate-500">
            Manage hospital network nodes, affiliated clinics, and specialized clinical care units.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={fetchData}
            className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => {
              setFormError(null);
              setShowDeptModal(true);
            }}
            className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold transition flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Department</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setFormError(null);
              setShowOrgModal(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Add Facility</span>
          </button>
        </div>
      </div>

      {/* Facilities Grid */}
      <div className="space-y-3">
        <h3 className="font-bold text-sm text-slate-900">Affiliated Healthcare Facilities</h3>

        {loading && organizations.length === 0 ? (
          <div className="p-12 text-center text-slate-500 animate-pulse bg-white rounded-2xl border border-slate-200">
            Loading healthcare network facilities from PostgreSQL...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {organizations.map((org) => (
              <div
                key={org.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-0.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
                        {org.organization_type}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900">{org.name}</h4>
                    </div>

                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Active Facility
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-slate-600 text-[11px] pt-1">
                    <div className="flex items-center gap-1.5 truncate">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">
                        {org.city}, {org.state}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 truncate">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{org.phone || '+91 11 2345 6789'}</span>
                    </div>

                    <div className="flex items-center gap-1.5 truncate">
                      <Award className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">Lic: {org.license_number || 'DEL-2024-8841'}</span>
                    </div>

                    <div className="flex items-center gap-1.5 truncate">
                      <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{org.doctors_count} Affiliated Doctors</span>
                    </div>
                  </div>
                </div>

                {/* Sub-departments chips */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] text-slate-400 font-bold">Departments:</span>
                    {departments
                      .filter((d) => d.organization_id === org.id)
                      .slice(0, 3)
                      .map((d) => (
                        <span
                          key={d.id}
                          className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-medium"
                        >
                          {d.name}
                        </span>
                      ))}
                    {departments.filter((d) => d.organization_id === org.id).length > 3 && (
                      <span className="text-[10px] text-slate-400">
                        +{departments.filter((d) => d.organization_id === org.id).length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Departments Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden space-y-0">
        <div className="p-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-900">Clinical Departments Registry</h3>
          <span className="text-[11px] text-slate-500 font-medium">
            Total {departments.length} departments registered
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-5 py-3">Department</th>
                <th className="px-5 py-3">Parent Hospital</th>
                <th className="px-5 py-3">Head of Department</th>
                <th className="px-5 py-3">Staff Doctors</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {departments.map((d) => (
                <tr key={d.id} className="hover:bg-slate-50/80 transition">
                  <td className="px-5 py-3 font-bold text-slate-900">{d.name}</td>
                  <td className="px-5 py-3 text-slate-700">{d.organization_name}</td>
                  <td className="px-5 py-3 text-slate-700">{d.head_doctor_name || 'Dr. Physician'}</td>
                  <td className="px-5 py-3 text-teal-700 font-semibold">{d.doctors_count} Doctors</td>
                  <td className="px-5 py-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Active
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Create Facility */}
      {showOrgModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900">Add Healthcare Facility</h3>
              <button
                type="button"
                onClick={() => setShowOrgModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="p-2.5 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateOrg} className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Facility Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Health Institute"
                  value={orgForm.name}
                  onChange={(e) => setOrgForm({ ...orgForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-teal-600 outline-hidden font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Type</label>
                  <select
                    value={orgForm.organization_type}
                    onChange={(e) => setOrgForm({ ...orgForm, organization_type: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-medium"
                  >
                    <option value="Multispecialty Hospital">Hospital</option>
                    <option value="Specialty Clinic">Clinic</option>
                    <option value="Medical Diagnostic Center">Diagnostic Center</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">City</label>
                  <input
                    type="text"
                    value={orgForm.city}
                    onChange={(e) => setOrgForm({ ...orgForm, city: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-medium"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowOrgModal(false)}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold shadow-2xs"
                >
                  {creating ? 'Saving...' : 'Create Facility'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Create Department */}
      {showDeptModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900">Add Clinical Department</h3>
              <button
                type="button"
                onClick={() => setShowDeptModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="p-2.5 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateDept} className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Parent Facility *</label>
                <select
                  value={deptForm.organization_id}
                  onChange={(e) => setDeptForm({ ...deptForm, organization_id: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-medium"
                >
                  {organizations.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.name} ({org.city})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Department Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Oncology, Pediatrics, Orthopedics"
                  value={deptForm.name}
                  onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-teal-600 outline-hidden font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Head of Department</label>
                <input
                  type="text"
                  placeholder="e.g. Dr. Priya Sharma"
                  value={deptForm.head_doctor_name}
                  onChange={(e) => setDeptForm({ ...deptForm, head_doctor_name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDeptModal(false)}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold shadow-2xs"
                >
                  {creating ? 'Saving...' : 'Add Department'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
