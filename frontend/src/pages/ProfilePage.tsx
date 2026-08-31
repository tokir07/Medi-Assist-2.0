import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProfileNavTabs } from '../components/profile/ProfileNavTabs';
import { ProfileHeroCard } from '../components/profile/ProfileHeroCard';
import { PersonalInformationCard } from '../components/profile/PersonalInformationCard';
import { MedicalInformationCard } from '../components/profile/MedicalInformationCard';
import { DataSecurityBanner } from '../components/profile/DataSecurityBanner';
import { ProfileQuickActions } from '../components/profile/ProfileQuickActions';
import { EmergencyContactCard } from '../components/profile/EmergencyContactCard';
import { AccountOverviewCard } from '../components/profile/AccountOverviewCard';
import { EditProfileModal } from '../components/profile/EditProfileModal';
import { ChangePasswordModal } from '../components/profile/ChangePasswordModal';
import { profileService } from '../services/profileService';
import type { PatientProfile, ProfileNavTab, ProfileUpdatePayload } from '../types/profile';
import { Loader2, AlertCircle } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<ProfileNavTab>('Personal Information');
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await profileService.getProfile();
      setProfile(data);
    } catch (err: any) {
      console.error('Failed to load profile:', err);
      setError('Unable to load your profile. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleTabChange = (tab: ProfileNavTab) => {
    setActiveTab(tab);
    if (tab === 'Security') {
      setPasswordModalOpen(true);
    } else if (tab === 'Preferences') {
      navigate('/patient/settings');
    }
  };

  const handleSaveProfile = async (payload: ProfileUpdatePayload) => {
    const updated = await profileService.updateProfile(payload);
    setProfile(updated);
  };

  const handlePhotoUpload = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      try {
        const updated = await profileService.updateProfile({ profile_photo_url: base64 });
        setProfile(updated);
      } catch (err) {
        console.error('Failed to update avatar:', err);
      }
    };
    reader.readAsDataURL(file);
  };

  if (loading && !profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-[#0FA3A3]" />
        <span className="text-xs sm:text-sm font-semibold text-[#5F6F86]">
          Loading profile details...
        </span>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="p-8 max-w-lg mx-auto text-center space-y-4 bg-white rounded-3xl border border-[#D9E1EA] shadow-sm my-12">
        <AlertCircle className="w-10 h-10 text-[#E53E3E] mx-auto" />
        <h3 className="text-base font-bold text-[#102A56]">Unable to load profile</h3>
        <p className="text-xs text-[#5F6F86]">{error}</p>
        <button
          type="button"
          onClick={fetchProfile}
          className="px-5 py-2.5 rounded-xl bg-[#0FA3A3] text-white text-xs font-bold hover:bg-[#0D8E8E] transition-all cursor-pointer shadow-xs"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* 3-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Main Center Content (8 Cols on Desktop) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Top Navigation Tabs */}
          <ProfileNavTabs activeTab={activeTab} onSelectTab={handleTabChange} />

          {/* Profile Hero Card */}
          <ProfileHeroCard
            profile={profile}
            onOpenEditModal={() => setEditModalOpen(true)}
            onPhotoUpload={handlePhotoUpload}
          />

          {/* Personal Information Card */}
          <PersonalInformationCard profile={profile} />

          {/* Medical Information Card */}
          <MedicalInformationCard profile={profile} />

          {/* Data Security Banner */}
          <DataSecurityBanner />
        </div>

        {/* Right Sidebar Panel (4 Cols on Desktop) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Quick Actions */}
          <ProfileQuickActions
            onOpenEditModal={() => setEditModalOpen(true)}
            onOpenPasswordModal={() => setPasswordModalOpen(true)}
          />

          {/* Emergency Contact */}
          <EmergencyContactCard
            contact={profile?.emergency_contact}
            onOpenEditModal={() => setEditModalOpen(true)}
          />

          {/* Account Overview */}
          <AccountOverviewCard profile={profile} />
        </div>
      </div>

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        profile={profile}
        onSave={handleSaveProfile}
      />

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={passwordModalOpen}
        onClose={() => setPasswordModalOpen(false)}
      />
    </div>
  );
};
