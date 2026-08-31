import React, { useState, useEffect } from 'react';
import { X, Building2, MapPin, Phone, Star, Loader2 } from 'lucide-react';
import { appointmentsService } from '../../services/appointmentsService';
import type { HospitalItem } from '../../types/appointments';

interface HospitalListModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HospitalListModal: React.FC<HospitalListModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [hospitals, setHospitals] = useState<HospitalItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      const fetchHospitals = async () => {
        try {
          setLoading(true);
          const data = await appointmentsService.getHospitals();
          setHospitals(data);
        } catch (e) {
          console.error(e);
        } finally {
          setLoading(false);
        }
      };
      fetchHospitals();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-3xl border border-[#D9E1EA] shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-[#F4F8FC] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#E8F8F5] text-[#0FA3A3] flex items-center justify-center shadow-2xs">
              <Building2 className="w-5 h-5 text-[#0FA3A3]" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-[#102A56]">
                Partner Hospitals & Clinics
              </h3>
              <p className="text-xs text-[#5F6F86]">
                Affiliated healthcare centers in your network
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

        {/* List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3.5 custom-scrollbar">
          {loading ? (
            <div className="py-12 text-center text-xs text-[#5F6F86] flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-[#0FA3A3]" />
              <span>Loading partner clinics...</span>
            </div>
          ) : (
            hospitals.map((hosp) => (
              <div
                key={hosp.id}
                className="bg-white rounded-2xl border border-[#D9E1EA]/80 p-4 shadow-[0_2px_8px_rgba(16,42,86,0.02)] space-y-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-bold text-[#102A56]">
                      {hosp.name}
                    </h4>
                    <div className="flex items-center gap-1.5 text-xs text-[#5F6F86] mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-[#0FA3A3] shrink-0" />
                      <span>{hosp.location}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-xs font-bold text-[#D99500] bg-[#FFFBEB] px-2 py-0.5 rounded-md shrink-0">
                    <Star className="w-3 h-3 fill-[#D99500]" />
                    <span>{hosp.rating}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {hosp.departments.map((dept) => (
                    <span
                      key={dept}
                      className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-[#F4F8FC] text-[#5F6F86]"
                    >
                      {dept}
                    </span>
                  ))}
                </div>

                <div className="flex items-center gap-1.5 text-xs font-semibold text-[#102A56] pt-1 border-t border-[#F4F8FC]">
                  <Phone className="w-3.5 h-3.5 text-[#8A98AA]" />
                  <span>{hosp.contact}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
