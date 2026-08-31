import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SettingsNavTabs } from '../components/settings/SettingsNavTabs';
import { AccountSettingsSection } from '../components/settings/AccountSettingsSection';
import { NotificationsSection } from '../components/settings/NotificationsSection';
import { PrivacySecuritySection } from '../components/settings/PrivacySecuritySection';
import { ConnectedAppsSection } from '../components/settings/ConnectedAppsSection';
import { AboutSection } from '../components/settings/AboutSection';
import { SettingsAccountOverview } from '../components/settings/SettingsAccountOverview';
import { SettingsQuickActions } from '../components/settings/SettingsQuickActions';
import { SettingsDangerZone } from '../components/settings/SettingsDangerZone';
import { ChangePasswordModal } from '../components/profile/ChangePasswordModal';
import { TwoFactorModal } from '../components/settings/TwoFactorModal';
import { LoginHistoryModal } from '../components/settings/LoginHistoryModal';
import { ManageDevicesModal } from '../components/settings/ManageDevicesModal';
import { ClearCacheModal } from '../components/settings/ClearCacheModal';
import { DeactivateModal } from '../components/settings/DeactivateModal';
import { DeleteAccountModal } from '../components/settings/DeleteAccountModal';
import { settingsService } from '../services/settingsService';
import type {
  UserSettings,
  UserSettingsUpdatePayload,
  AccountOverview,
  SettingsNavTab,
} from '../types/settings';
import { Loader2, AlertCircle } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = (searchParams.get('tab') as SettingsNavTab) || 'Account';
  const [activeTab, setActiveTab] = useState<SettingsNavTab>(initialTab);

  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [overview, setOverview] = useState<AccountOverview | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Modals state
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [twoFactorModalOpen, setTwoFactorModalOpen] = useState(false);
  const [loginHistoryModalOpen, setLoginHistoryModalOpen] = useState(false);
  const [devicesModalOpen, setDevicesModalOpen] = useState(false);
  const [clearCacheModalOpen, setClearCacheModalOpen] = useState(false);
  const [deactivateModalOpen, setDeactivateModalOpen] = useState(false);
  const [deleteAccountModalOpen, setDeleteAccountModalOpen] = useState(false);

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [sData, oData] = await Promise.all([
        settingsService.getSettings(),
        settingsService.getAccountOverview(),
      ]);
      setSettings(sData);
      setOverview(oData);
    } catch (err: any) {
      console.error('Failed to load settings:', err);
      setError('Unable to load settings. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleTabChange = (tab: SettingsNavTab) => {
    setActiveTab(tab);
    const params = new URLSearchParams(searchParams);
    if (tab === 'Account') {
      params.delete('tab');
    } else {
      params.set('tab', tab);
    }
    setSearchParams(params);
  };

  const handleUpdateSettings = async (payload: UserSettingsUpdatePayload) => {
    // Optimistic update
    if (settings) {
      setSettings({ ...settings, ...payload });
    }
    try {
      const updated = await settingsService.updateSettings(payload);
      setSettings(updated);
    } catch (err) {
      console.error('Failed to update setting:', err);
      fetchSettings();
    }
  };

  if (loading && !settings) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-[#0FA3A3]" />
        <span className="text-xs sm:text-sm font-semibold text-[#5F6F86]">
          Loading settings...
        </span>
      </div>
    );
  }

  if (error && !settings) {
    return (
      <div className="p-8 max-w-lg mx-auto text-center space-y-4 bg-white rounded-3xl border border-[#D9E1EA] shadow-sm my-12">
        <AlertCircle className="w-10 h-10 text-[#E53E3E] mx-auto" />
        <h3 className="text-base font-bold text-[#102A56]">Unable to load settings</h3>
        <p className="text-xs text-[#5F6F86]">{error}</p>
        <button
          type="button"
          onClick={fetchSettings}
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
        {/* Main Center Content (8 cols on desktop) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Top Navigation Tabs */}
          <SettingsNavTabs activeTab={activeTab} onSelectTab={handleTabChange} />

          {/* Active Tab View */}
          {activeTab === 'Account' || activeTab === 'Preferences' ? (
            <AccountSettingsSection
              settings={settings}
              onUpdate={handleUpdateSettings}
              onOpenSecurityModal={() => setPasswordModalOpen(true)}
              onOpenNotificationsTab={() => handleTabChange('Notifications')}
              onOpenClearCacheModal={() => setClearCacheModalOpen(true)}
            />
          ) : activeTab === 'Notifications' ? (
            <NotificationsSection
              settings={settings}
              onUpdate={handleUpdateSettings}
            />
          ) : activeTab === 'Privacy & Security' ? (
            <PrivacySecuritySection
              settings={settings}
              onOpenPasswordModal={() => setPasswordModalOpen(true)}
              onOpen2FAModal={() => setTwoFactorModalOpen(true)}
              onOpenDevicesModal={() => setDevicesModalOpen(true)}
            />
          ) : activeTab === 'Connected Apps' ? (
            <ConnectedAppsSection />
          ) : (
            <AboutSection />
          )}
        </div>

        {/* Right Sidebar (4 cols on desktop) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Account Overview Card */}
          <SettingsAccountOverview overview={overview} />

          {/* Quick Actions Card */}
          <SettingsQuickActions
            onOpenPasswordModal={() => setPasswordModalOpen(true)}
            onOpen2FAModal={() => setTwoFactorModalOpen(true)}
            onOpenLoginHistoryModal={() => setLoginHistoryModalOpen(true)}
            onOpenDevicesModal={() => setDevicesModalOpen(true)}
          />

          {/* Danger Zone Card */}
          <SettingsDangerZone
            onOpenDeactivateModal={() => setDeactivateModalOpen(true)}
            onOpenDeleteAccountModal={() => setDeleteAccountModalOpen(true)}
          />
        </div>
      </div>

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={passwordModalOpen}
        onClose={() => setPasswordModalOpen(false)}
      />

      {/* Two-Factor Authentication Modal */}
      <TwoFactorModal
        isOpen={twoFactorModalOpen}
        onClose={() => setTwoFactorModalOpen(false)}
        isEnabled={settings?.two_factor_enabled ?? false}
        onToggleSuccess={(enabled) => {
          if (settings) setSettings({ ...settings, two_factor_enabled: enabled });
        }}
      />

      {/* Login History Modal */}
      <LoginHistoryModal
        isOpen={loginHistoryModalOpen}
        onClose={() => setLoginHistoryModalOpen(false)}
      />

      {/* Manage Devices Modal */}
      <ManageDevicesModal
        isOpen={devicesModalOpen}
        onClose={() => setDevicesModalOpen(false)}
      />

      {/* Clear Cache Modal */}
      <ClearCacheModal
        isOpen={clearCacheModalOpen}
        onClose={() => setClearCacheModalOpen(false)}
      />

      {/* Deactivate Account Modal */}
      <DeactivateModal
        isOpen={deactivateModalOpen}
        onClose={() => setDeactivateModalOpen(false)}
      />

      {/* Delete Account Modal */}
      <DeleteAccountModal
        isOpen={deleteAccountModalOpen}
        onClose={() => setDeleteAccountModalOpen(false)}
      />
    </div>
  );
};
