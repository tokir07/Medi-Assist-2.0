import React, { useState } from 'react';
import { X, Filter, RotateCcw } from 'lucide-react';

interface FilterAppointmentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSpecialty: string;
  selectedDoctor: string;
  selectedHospital: string;
  onApply: (specialty: string, doctor: string, hospital: string) => void;
  onReset: () => void;
}

export const FilterAppointmentsModal: React.FC<FilterAppointmentsModalProps> = ({
  isOpen,
  onClose,
  selectedSpecialty,
  selectedDoctor,
  selectedHospital,
  onApply,
  onReset,
}) => {
  const [specialty, setSpecialty] = useState(selectedSpecialty);
  const [doctor, setDoctor] = useState(selectedDoctor);
  const [hospital, setHospital] = useState(selectedHospital);

  if (!isOpen) return null;

  const specialties = [
    'All',
    'General Physician',
    'Cardiologist',
    'Orthopedic Surgeon',
    'Dentist',
    'Dermatologist',
  ];

  const doctors = [
    'All',
    'Dr. Priya Sharma',
    'Dr. Arjun Mehta',
    'Dr. Neha Verma',
    'Dr. Sarah Jenkins',
    'Dr. Rajesh Kothari',
  ];

  const hospitals = [
    'All',
    'City Care Hospital',
    'Heart Health Clinic',
    'Bone & Joint Care',
    'MediAssist Medical Center',
  ];

  const handleApply = () => {
    onApply(specialty, doctor, hospital);
    onClose();
  };

  const handleReset = () => {
    setSpecialty('All');
    setDoctor('All');
    setHospital('All');
    onReset();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-3xl border border-[#D9E1EA] shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-[#F4F8FC] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#E8F8F5] text-[#0FA3A3] flex items-center justify-center shadow-2xs">
              <Filter className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#102A56]">
                Filter Appointments
              </h3>
              <p className="text-xs text-[#5F6F86]">Refine appointment list</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-[#8A98AA] hover:text-[#102A56] hover:bg-[#F4F8FC] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filters */}
        <div className="p-5 sm:p-6 space-y-4 text-xs">
          <div>
            <label className="block font-bold text-[#102A56] mb-1.5">
              Specialty
            </label>
            <select
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#F4F8FC] border border-[#D9E1EA] rounded-xl text-xs text-[#102A56] focus:bg-white focus:outline-none cursor-pointer"
            >
              {specialties.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-[#102A56] mb-1.5">
              Doctor
            </label>
            <select
              value={doctor}
              onChange={(e) => setDoctor(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#F4F8FC] border border-[#D9E1EA] rounded-xl text-xs text-[#102A56] focus:bg-white focus:outline-none cursor-pointer"
            >
              {doctors.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-[#102A56] mb-1.5">
              Hospital / Clinic
            </label>
            <select
              value={hospital}
              onChange={(e) => setHospital(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#F4F8FC] border border-[#D9E1EA] rounded-xl text-xs text-[#102A56] focus:bg-white focus:outline-none cursor-pointer"
            >
              {hospitals.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-[#F4F8FC] flex items-center justify-between gap-3 bg-white">
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#5F6F86] hover:text-[#102A56] cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-[#D9E1EA] text-xs font-semibold text-[#5F6F86] hover:bg-[#F4F8FC] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="px-5 py-2 rounded-xl bg-[#0FA3A3] hover:bg-[#0D8E8E] text-white text-xs font-bold cursor-pointer"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
