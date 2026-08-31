import React from 'react';
import { User, Phone, Mail, MapPin } from 'lucide-react';
import type { EmergencyContact } from '../../types/profile';

interface EmergencyContactCardProps {
  contact?: EmergencyContact | null;
  onOpenEditModal: () => void;
}

export const EmergencyContactCard: React.FC<EmergencyContactCardProps> = ({
  contact,
  onOpenEditModal,
}) => {
  const name = contact?.name || 'Jane Doe';
  const relationship = contact?.relationship || 'Spouse';
  const phone = contact?.phone || '+91 98765 67890';
  const email = contact?.email || 'janedoe@email.com';
  const address = contact?.address || '123, Green Park, New Delhi, Delhi 110016, India';

  return (
    <div className="bg-white rounded-3xl border border-[#D9E1EA]/80 p-5 shadow-[0_4px_20px_rgba(16,42,86,0.03)] space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm sm:text-base font-bold text-[#102A56]">
          Emergency Contact
        </h3>
        <button
          type="button"
          onClick={onOpenEditModal}
          className="text-xs font-bold text-[#0FA3A3] hover:text-[#0D8E8E] transition-colors cursor-pointer"
        >
          Edit
        </button>
      </div>

      {/* Contact Details */}
      <div className="space-y-3">
        {/* Name & Relationship */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#F0F4F8] border border-[#D9E1EA] flex items-center justify-center text-[#8A98AA] shrink-0">
            <User className="w-5 h-5 text-[#A0AEC0]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-bold text-[#102A56]">
                {name}
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#E6F7F7] text-[#0FA3A3] border border-[#B2F5EA]/60">
                {relationship}
              </span>
            </div>
          </div>
        </div>

        {/* Contact Links */}
        <div className="space-y-2 text-xs text-[#5F6F86] pt-1">
          <div className="flex items-center gap-2.5">
            <Phone className="w-3.5 h-3.5 text-[#8A98AA] shrink-0" />
            <span>{phone}</span>
          </div>

          <div className="flex items-center gap-2.5">
            <Mail className="w-3.5 h-3.5 text-[#8A98AA] shrink-0" />
            <span className="truncate">{email}</span>
          </div>

          <div className="flex items-start gap-2.5">
            <MapPin className="w-3.5 h-3.5 text-[#8A98AA] shrink-0 mt-0.5" />
            <span className="leading-relaxed">{address}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
