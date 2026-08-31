import React, { useState } from 'react';
import { X, Shield, QrCode, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { settingsService } from '../../services/settingsService';

interface TwoFactorModalProps {
  isOpen: boolean;
  onClose: () => void;
  isEnabled: boolean;
  onToggleSuccess: (enabled: boolean) => void;
}

export const TwoFactorModal: React.FC<TwoFactorModalProps> = ({
  isOpen,
  onClose,
  isEnabled,
  onToggleSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'status' | 'setup'>('status');
  const [qrUrl, setQrUrl] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleStartSetup = async () => {
    try {
      setLoading(true);
      const res = await settingsService.toggle2FA(true);
      setQrUrl(res.qr_code_url || null);
      setStep('setup');
    } catch (err) {
      console.error('Failed to initiate 2FA:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifySetup = () => {
    onToggleSuccess(true);
    setStep('status');
    onClose();
  };

  const handleDisable2FA = async () => {
    try {
      setLoading(true);
      await settingsService.toggle2FA(false);
      onToggleSuccess(false);
      onClose();
    } catch (err) {
      console.error('Failed to disable 2FA:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#102A56]/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-3xl border border-[#D9E1EA] shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E7EDF4] flex items-center justify-between bg-[#F7FAFF]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#E6F7F7] text-[#0FA3A3] flex items-center justify-center shrink-0 shadow-2xs">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-[#102A56]">
                Two-Factor Authentication
              </h2>
              <p className="text-[11px] text-[#5F6F86]">
                Enhanced account protection using OTP
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-[#5F6F86] hover:text-[#102A56] hover:bg-[#E7EDF4] transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {step === 'status' ? (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-[#F7FAFF] border border-[#E7EDF4] flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-[#102A56] block">
                    Current 2FA Status
                  </span>
                  <span className="text-[11px] text-[#5F6F86] block">
                    {isEnabled ? 'Two-Factor Authentication is currently active' : 'Two-Factor Authentication is disabled'}
                  </span>
                </div>
                <span
                  className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                    isEnabled
                      ? 'bg-[#E8F8F5] text-[#1FA774] border-[#B2F5EA]'
                      : 'bg-[#FFFDF5] text-[#D97706] border-[#FEF3C7]'
                  }`}
                >
                  {isEnabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>

              <p className="text-xs text-[#5F6F86] leading-relaxed">
                When 2FA is enabled, you will be prompted for an authenticator code (Google Authenticator, Microsoft Authenticator, or Authy) upon logging in.
              </p>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-[#5F6F86] hover:bg-[#F4F8FC] transition-colors cursor-pointer"
                >
                  Close
                </button>
                {isEnabled ? (
                  <button
                    type="button"
                    onClick={handleDisable2FA}
                    disabled={loading}
                    className="px-5 py-2.5 rounded-xl bg-[#E53E3E] text-white text-xs font-bold hover:bg-[#C53030] transition-colors cursor-pointer shadow-xs"
                  >
                    {loading ? 'Disabling...' : 'Disable 2FA'}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleStartSetup}
                    disabled={loading}
                    className="px-5 py-2.5 rounded-xl bg-[#0FA3A3] text-white text-xs font-bold hover:bg-[#0D8E8E] transition-colors cursor-pointer shadow-xs"
                  >
                    {loading ? 'Setting up...' : 'Enable 2FA'}
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4 text-center">
              <p className="text-xs text-[#5F6F86]">
                Scan this QR code with your Authenticator app, then enter the 6-digit code below:
              </p>

              {qrUrl && (
                <div className="w-44 h-44 mx-auto p-2 bg-white rounded-2xl border border-[#D9E1EA] shadow-xs flex items-center justify-center">
                  <img src={qrUrl} alt="2FA QR Code" className="w-full h-full object-contain" />
                </div>
              )}

              <div className="space-y-1 text-left">
                <label className="text-xs font-bold text-[#102A56]">Verification Code</label>
                <input
                  type="text"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="e.g. 123456"
                  className="w-full px-3.5 py-2.5 bg-[#F4F8FC] border border-[#D9E1EA] rounded-xl text-center text-sm font-bold text-[#102A56] tracking-widest focus:bg-white focus:border-[#0FA3A3] focus:ring-2 focus:ring-[#0FA3A3]/15 focus:outline-none transition-all"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setStep('status')}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-[#5F6F86] hover:bg-[#F4F8FC] transition-colors cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleVerifySetup}
                  disabled={code.length !== 6}
                  className="px-5 py-2.5 rounded-xl bg-[#0FA3A3] text-white text-xs font-bold hover:bg-[#0D8E8E] transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                >
                  Verify & Activate
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
