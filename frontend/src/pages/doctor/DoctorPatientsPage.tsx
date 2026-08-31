import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { doctorService } from '../../services/doctorService';
import type { DoctorPatientSummary } from '../../services/doctorService';
import {
  Users,
  Search,
  Filter,
  User,
  Activity,
  AlertCircle,
  FileText,
  MessageSquare,
  Calendar,
  ChevronRight,
  Loader2,
  ShieldAlert,
} from 'lucide-react';

export const DoctorPatientsPage: React.FC = () => {
  const navigate = useNavigate();

  const [patients, setPatients] = useState<DoctorPatientSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('All');

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const res = await doctorService.getPatients(searchTerm);
      setPatients(res || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPatients();
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Users className="w-6 h-6 text-teal-600" />
            <span>My Patients Directory</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Access medical histories, uploaded lab reports, active prescriptions, and consultation notes.
          </p>
        </div>
      </div>

      {/* Controls Bar: Search & Filter */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
        <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center gap-2 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200/80 w-full">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search patients by name, allergy, condition, or blood group..."
            className="flex-1 bg-transparent text-xs sm:text-sm text-slate-900 font-medium placeholder:text-slate-400 focus:outline-none"
          />
        </form>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {['All', 'Recent', 'Active Prescriptions'].map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setFilterCategory(cat)}
              className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                filterCategory === cat
                  ? 'bg-teal-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Patient Cards Grid */}
      {loading ? (
        <div className="min-h-[40vh] flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
          <span className="text-xs font-medium text-slate-500">Loading patient records...</span>
        </div>
      ) : patients.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
          <Users className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No patients found</h3>
          <p className="text-xs text-slate-500">Try adjusting your search criteria or filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {patients.map((pat) => (
            <div
              key={pat.id}
              onClick={() => navigate(`/doctor/patients/${pat.id}`)}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md hover:border-slate-300 transition-all cursor-pointer space-y-4 flex flex-col justify-between group"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-teal-50 text-teal-700 border border-teal-200 flex items-center justify-center font-bold text-sm shrink-0">
                      {pat.name.split(' ').map((n) => n[0]).join('')}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 group-hover:text-teal-700 transition-colors">
                        {pat.name}
                      </h3>
                      <p className="text-xs text-slate-500 font-medium">
                        {pat.age} yrs • {pat.gender} • Blood Group: <span className="font-bold text-slate-700">{pat.blood_group || 'B+'}</span>
                      </p>
                    </div>
                  </div>

                  <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                    Last Visit: {pat.last_visit || '28 Aug'}
                  </span>
                </div>

                {/* Badges / Clinical Alerts */}
                <div className="space-y-1.5 pt-1 text-xs">
                  <div className="flex items-center gap-1.5 text-rose-700 bg-rose-50/80 p-2 rounded-xl border border-rose-100">
                    <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                    <span className="font-medium truncate">Allergies: {pat.allergies || 'None reported'}</span>
                  </div>

                  <div className="flex items-center gap-1.5 text-slate-700 bg-slate-50 p-2 rounded-xl border border-slate-100">
                    <Activity className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                    <span className="font-medium truncate">Condition: {pat.conditions || 'Routine checkup'}</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">
                  {pat.active_prescriptions_count || 1} Active Prescription(s)
                </span>
                <span className="font-bold text-teal-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  <span>View Profile</span>
                  <ChevronRight className="w-4 h-4" />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
