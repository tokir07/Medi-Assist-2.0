import React, { useState, useEffect } from 'react';
import { X, Search, Star, Calendar, Loader2 } from 'lucide-react';
import { appointmentsService } from '../../services/appointmentsService';
import type { DoctorItem } from '../../types/appointments';

interface FindDoctorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectDoctorToBook: (doctor: DoctorItem) => void;
}

export const FindDoctorModal: React.FC<FindDoctorModalProps> = ({
  isOpen,
  onClose,
  onSelectDoctorToBook,
}) => {
  const [doctors, setDoctors] = useState<DoctorItem[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('All');
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      const fetchDocs = async () => {
        try {
          setLoading(true);
          const docs = await appointmentsService.getDoctors();
          setDoctors(docs);
        } catch (e) {
          console.error(e);
        } finally {
          setLoading(false);
        }
      };
      fetchDocs();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const specialties = [
    'All',
    'General Physician',
    'Cardiologist',
    'Orthopedic Surgeon',
    'Dentist',
    'Dermatologist',
  ];

  const filtered = doctors.filter((doc) => {
    const matchesSearch =
      doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.specialty.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.hospital.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSpec =
      selectedSpecialty === 'All' ||
      doc.specialty.toLowerCase() === selectedSpecialty.toLowerCase();

    return matchesSearch && matchesSpec;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-3xl border border-[#D9E1EA] shadow-2xl max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-[#F4F8FC] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#E8F8F5] text-[#0FA3A3] flex items-center justify-center shadow-2xs">
              <Search className="w-5 h-5 text-[#0FA3A3]" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-[#102A56]">
                Find Doctor & Specialist
              </h3>
              <p className="text-xs text-[#5F6F86]">
                Explore verified medical professionals
              </p>
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

        {/* Search & Filter Bar */}
        <div className="p-4 bg-[#F7FAFF] border-b border-[#E7EDF4] space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-[#8A98AA] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by doctor name, specialty, or hospital..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-[#D9E1EA] rounded-xl text-xs sm:text-sm text-[#102A56] focus:border-[#0FA3A3] focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
            {specialties.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSelectedSpecialty(s)}
                className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  selectedSpecialty === s
                    ? 'bg-[#0FA3A3] text-white'
                    : 'bg-white border border-[#D9E1EA] text-[#5F6F86] hover:text-[#102A56]'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Doctor List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 custom-scrollbar">
          {loading ? (
            <div className="py-12 text-center text-xs text-[#5F6F86] flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-[#0FA3A3]" />
              <span>Loading doctors directory...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#5F6F86]">
              No doctors found matching your search.
            </div>
          ) : (
            filtered.map((doc) => (
              <div
                key={doc.id}
                className="bg-white rounded-2xl border border-[#D9E1EA]/80 p-4 shadow-[0_2px_8px_rgba(16,42,86,0.02)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-[#0FA3A3]/40 transition-all"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {doc.image_url ? (
                    <img
                      src={doc.image_url}
                      alt={doc.name}
                      className="w-12 h-12 rounded-full object-cover border border-[#D9E1EA]"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-[#E8F8F5] text-[#0FA3A3] font-bold flex items-center justify-center">
                      {doc.name.charAt(0)}
                    </div>
                  )}

                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-[#102A56] truncate">
                      {doc.name}
                    </h4>
                    <p className="text-xs text-[#0FA3A3] font-semibold">
                      {doc.specialty} • {doc.experience} years experience
                    </p>
                    <p className="text-[11px] text-[#5F6F86] truncate mt-0.5">
                      {doc.hospital}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#F4F8FC]">
                  <div className="flex items-center gap-1 text-xs font-bold text-[#D99500]">
                    <Star className="w-3.5 h-3.5 fill-[#D99500]" />
                    <span>{doc.rating}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onSelectDoctorToBook(doc);
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#0FA3A3] hover:bg-[#0D8E8E] text-white text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Book</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
