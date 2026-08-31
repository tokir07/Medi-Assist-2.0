import React, { useRef } from 'react';
import {
  User as UserIcon,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Edit2,
  Camera,
} from 'lucide-react';
import type { PatientProfile } from '../../types/profile';

interface ProfileHeroCardProps {
  profile: PatientProfile | null;
  onOpenEditModal: () => void;
  onPhotoUpload?: (file: File) => void;
}

export const ProfileHeroCard: React.FC<ProfileHeroCardProps> = ({
  profile,
  onOpenEditModal,
  onPhotoUpload,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && onPhotoUpload) {
      onPhotoUpload(e.target.files[0]);
    }
  };

  const displayName = profile?.full_name || 'Patient';
  const displayEmail = profile?.email || 'patient@example.com';
  const displayPhone = profile?.phone || 'Not provided';
  const displayDob = profile?.date_of_birth
    ? `${profile.date_of_birth}${profile.age ? ` (${profile.age} years)` : ''}`
    : 'Not provided';
  const displayLocation =
    profile?.city && profile?.country
      ? `${profile.city}, ${profile.country}`
      : profile?.address || 'Not provided';

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-6">
      {/* Left: Avatar & Personal Quick Info */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-5 min-w-0">
        {/* Avatar */}
        <div className="relative shrink-0">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-teal-50 border-2 border-teal-100 flex items-center justify-center text-teal-700 overflow-hidden shadow-2xs">
            {profile?.profile_photo_url ? (
              <img
                src={profile.profile_photo_url}
                alt={displayName}
                className="w-full h-full object-cover"
              />
            ) : (
              <UserIcon className="w-10 h-10 text-teal-600" />
            )}
          </div>

          {/* Camera Upload Trigger */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="absolute -bottom-1 -right-1 w-7 h-7 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-teal-700 hover:border-teal-300 flex items-center justify-center shadow-xs transition cursor-pointer"
            title="Change photo"
            aria-label="Change profile photo"
          >
            <Camera className="w-3.5 h-3.5" />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />
        </div>

        {/* Info Stack */}
        <div className="space-y-1.5 min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 leading-tight">
              {displayName}
            </h2>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-bold bg-teal-50 text-teal-700 border border-teal-200">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-600" />
              <span>Verified Patient</span>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-xs text-slate-600">
            <div className="flex items-center gap-2 truncate">
              <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{displayEmail}</span>
            </div>

            <div className="flex items-center gap-2 truncate">
              <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>{displayPhone}</span>
            </div>

            <div className="flex items-center gap-2 truncate">
              <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>{displayDob}</span>
            </div>

            <div className="flex items-center gap-2 truncate">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{displayLocation}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right: Edit Button */}
      <div className="flex items-center justify-end shrink-0">
        <button
          type="button"
          onClick={onOpenEditModal}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition shadow-2xs cursor-pointer"
        >
          <Edit2 className="w-3.5 h-3.5" />
          <span>Edit Profile</span>
        </button>
      </div>
    </div>
  );
};
