import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  User,
  MapPin,
  HeartPulse,
  PhoneCall,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Loader2,
  ShieldCheck,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { Logo } from '../components/common/Logo';

export const PatientOnboardingPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [fullName, setFullName] = useState<string>(user?.name || '');
  const [dateOfBirth, setDateOfBirth] = useState<string>('1990-03-12');
  const [gender, setGender] = useState<string>('Male');
  const [bloodGroup, setBloodGroup] = useState<string>('O+');
  const [maritalStatus, setMaritalStatus] = useState<string>('Married');

  // Contact & Address
  const [phone, setPhone] = useState<string>('+91 98765 43210');
  const [address, setAddress] = useState<string>('123, Green Park');
  const [city, setCity] = useState<string>('New Delhi');
  const [state, setState] = useState<string>('Delhi');
  const [postalCode, setPostalCode] = useState<string>('110016');
  const [country, setCountry] = useState<string>('India');

  // Medical Profile
  const [allergies, setAllergies] = useState<string>('Pollen, Penicillin');
  const [currentMedications, setCurrentMedications] = useState<string>('Atorvastatin 10mg (Daily)');
  const [chronicConditions, setChronicConditions] = useState<string>('None');
  const [primaryPhysician, setPrimaryPhysician] = useState<string>('Dr. Priya Sharma');

  // Emergency Contact
  const [emergencyName, setEmergencyName] = useState<string>('Jane Doe');
  const [emergencyRelationship, setEmergencyRelationship] = useState<string>('Spouse');
  const [emergencyPhone, setEmergencyPhone] = useState<string>('+91 98765 67890');

  const handleNext = () => {
    setError(null);
    if (step === 1) {
      if (!fullName.trim()) {
        setError('Please enter your full name.');
        return;
      }
    }
    if (step === 2) {
      if (!phone.trim()) {
        setError('Please enter your phone number.');
        return;
      }
    }
    setStep((prev) => Math.min(prev + 1, 4));
  };

  const handlePrev = () => {
    setError(null);
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const payload = {
        fullName: fullName.trim(),
        phone: phone.trim(),
        dateOfBirth,
        gender,
        bloodGroup,
        maritalStatus,
        address: address.trim(),
        city: city.trim(),
        state: state.trim(),
        postalCode: postalCode.trim(),
        country: country.trim(),
        allergies: allergies.trim(),
        currentMedications: currentMedications.trim(),
        chronicConditions: chronicConditions.trim(),
        primaryPhysician: primaryPhysician.trim(),
        emergencyContact: {
          name: emergencyName.trim(),
          relationship: emergencyRelationship.trim(),
          phone: emergencyPhone.trim(),
        },
      };

      const res = await api.post('/patients/onboarding', payload);
      if (res.data) {
        // Update user storage
        const updatedUser = { ...user, ...res.data, is_onboarded: true };
        localStorage.setItem('mediassist_user', JSON.stringify(updatedUser));
      }
      navigate('/patient');
    } catch (err: any) {
      console.error('Onboarding submission failed:', err);
      setError(err.response?.data?.detail || 'Failed to complete profile onboarding. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-between py-8 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="max-w-3xl mx-auto w-full flex items-center justify-between">
        <Logo size="md" />
        <div className="flex items-center gap-2 text-xs text-[#5F6F86]">
          <ShieldCheck className="w-4 h-4 text-[#0FA3A3]" />
          <span>HIPAA & ABHA Compliant</span>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-2xl mx-auto w-full my-6">
        <div className="bg-white rounded-3xl border border-[#D9E1EA] shadow-[0_4px_25px_rgba(16,42,86,0.06)] p-6 sm:p-8 space-y-6">
          {/* Title & Progress Tracker */}
          <div className="space-y-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#0FA3A3] bg-[#E6F7F7] px-3 py-1 rounded-full">
                Step {step} of 4
              </span>
              <h1 className="text-xl sm:text-2xl font-extrabold text-[#102A56] mt-2">
                {step === 1 && 'Personal Information'}
                {step === 2 && 'Contact & Residential Address'}
                {step === 3 && 'Basic Medical Profile'}
                {step === 4 && 'Emergency Contact'}
              </h1>
              <p className="text-xs sm:text-sm text-[#5F6F86] mt-0.5">
                {step === 1 && 'Tell us your basic details to personalize your healthcare experience.'}
                {step === 2 && 'Provide contact details for appointments and medical communications.'}
                {step === 3 && 'Your clinical history helps our AI assistant give safe, tailored guidance.'}
                {step === 4 && 'Nominate a trusted emergency contact for critical notifications.'}
              </p>
            </div>

            {/* Stepper Dots / Bars */}
            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 3, 4].map((s) => (
                <div
                  key={s}
                  className={`h-1.5 rounded-full transition-all duration-200 ${
                    s <= step ? 'bg-[#0FA3A3]' : 'bg-[#E7EDF4]'
                  }`}
                />
              ))}
            </div>
          </div>

          {error && (
            <div className="p-3.5 rounded-2xl bg-[#FFF5F5] border border-[#FED7D7] text-xs font-bold text-[#E53E3E] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form Step 1: Personal Details */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-[#102A56]">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full mt-1 px-3.5 py-2.5 bg-[#F4F8FC] border border-[#D9E1EA] rounded-xl text-xs sm:text-sm text-[#102A56] font-medium focus:bg-white focus:border-[#0FA3A3] focus:ring-2 focus:ring-[#0FA3A3]/15 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-[#102A56]">Date of Birth</label>
                  <input
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    className="w-full mt-1 px-3.5 py-2.5 bg-[#F4F8FC] border border-[#D9E1EA] rounded-xl text-xs sm:text-sm text-[#102A56] font-medium focus:bg-white focus:border-[#0FA3A3] focus:ring-2 focus:ring-[#0FA3A3]/15 focus:outline-none cursor-pointer"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#102A56]">Gender</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full mt-1 px-3.5 py-2.5 bg-[#F4F8FC] border border-[#D9E1EA] rounded-xl text-xs sm:text-sm text-[#102A56] font-medium focus:bg-white focus:border-[#0FA3A3] focus:ring-2 focus:ring-[#0FA3A3]/15 focus:outline-none cursor-pointer"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-[#102A56]">Blood Group</label>
                  <select
                    value={bloodGroup}
                    onChange={(e) => setBloodGroup(e.target.value)}
                    className="w-full mt-1 px-3.5 py-2.5 bg-[#F4F8FC] border border-[#D9E1EA] rounded-xl text-xs sm:text-sm text-[#102A56] font-medium focus:bg-white focus:border-[#0FA3A3] focus:ring-2 focus:ring-[#0FA3A3]/15 focus:outline-none cursor-pointer"
                  >
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-[#102A56]">Marital Status</label>
                  <select
                    value={maritalStatus}
                    onChange={(e) => setMaritalStatus(e.target.value)}
                    className="w-full mt-1 px-3.5 py-2.5 bg-[#F4F8FC] border border-[#D9E1EA] rounded-xl text-xs sm:text-sm text-[#102A56] font-medium focus:bg-white focus:border-[#0FA3A3] focus:ring-2 focus:ring-[#0FA3A3]/15 focus:outline-none cursor-pointer"
                  >
                    <option value="Single">Single</option>
                    <option value="Married">Married</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Form Step 2: Contact & Address */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-[#102A56]">Registered Email</label>
                  <input
                    type="email"
                    value={user?.email || 'patient@example.com'}
                    disabled
                    className="w-full mt-1 px-3.5 py-2.5 bg-[#EEF5FF] border border-[#D9E1EA] rounded-xl text-xs sm:text-sm text-[#5F6F86] font-medium cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#102A56]">Phone Number</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full mt-1 px-3.5 py-2.5 bg-[#F4F8FC] border border-[#D9E1EA] rounded-xl text-xs sm:text-sm text-[#102A56] font-medium focus:bg-white focus:border-[#0FA3A3] focus:ring-2 focus:ring-[#0FA3A3]/15 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#102A56]">Street Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="123, Green Park"
                  className="w-full mt-1 px-3.5 py-2.5 bg-[#F4F8FC] border border-[#D9E1EA] rounded-xl text-xs sm:text-sm text-[#102A56] font-medium focus:bg-white focus:border-[#0FA3A3] focus:ring-2 focus:ring-[#0FA3A3]/15 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#102A56]">City</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="New Delhi"
                    className="w-full mt-1 px-3.5 py-2.5 bg-[#F4F8FC] border border-[#D9E1EA] rounded-xl text-xs sm:text-sm text-[#102A56] font-medium focus:bg-white focus:border-[#0FA3A3] focus:ring-2 focus:ring-[#0FA3A3]/15 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#102A56]">State</label>
                  <input
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="Delhi"
                    className="w-full mt-1 px-3.5 py-2.5 bg-[#F4F8FC] border border-[#D9E1EA] rounded-xl text-xs sm:text-sm text-[#102A56] font-medium focus:bg-white focus:border-[#0FA3A3] focus:ring-2 focus:ring-[#0FA3A3]/15 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#102A56]">Postal Code</label>
                  <input
                    type="text"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    placeholder="110016"
                    className="w-full mt-1 px-3.5 py-2.5 bg-[#F4F8FC] border border-[#D9E1EA] rounded-xl text-xs sm:text-sm text-[#102A56] font-medium focus:bg-white focus:border-[#0FA3A3] focus:ring-2 focus:ring-[#0FA3A3]/15 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#102A56]">Country</label>
                  <input
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder="India"
                    className="w-full mt-1 px-3.5 py-2.5 bg-[#F4F8FC] border border-[#D9E1EA] rounded-xl text-xs sm:text-sm text-[#102A56] font-medium focus:bg-white focus:border-[#0FA3A3] focus:ring-2 focus:ring-[#0FA3A3]/15 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Form Step 3: Medical Profile */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-[#102A56]">Known Allergies</label>
                <input
                  type="text"
                  value={allergies}
                  onChange={(e) => setAllergies(e.target.value)}
                  placeholder="e.g. Pollen, Penicillin (or None)"
                  className="w-full mt-1 px-3.5 py-2.5 bg-[#F4F8FC] border border-[#D9E1EA] rounded-xl text-xs sm:text-sm text-[#102A56] font-medium focus:bg-white focus:border-[#0FA3A3] focus:ring-2 focus:ring-[#0FA3A3]/15 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#102A56]">Current Medications</label>
                <input
                  type="text"
                  value={currentMedications}
                  onChange={(e) => setCurrentMedications(e.target.value)}
                  placeholder="e.g. Atorvastatin 10mg (Daily) (or None)"
                  className="w-full mt-1 px-3.5 py-2.5 bg-[#F4F8FC] border border-[#D9E1EA] rounded-xl text-xs sm:text-sm text-[#102A56] font-medium focus:bg-white focus:border-[#0FA3A3] focus:ring-2 focus:ring-[#0FA3A3]/15 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#102A56]">Chronic Conditions</label>
                <input
                  type="text"
                  value={chronicConditions}
                  onChange={(e) => setChronicConditions(e.target.value)}
                  placeholder="e.g. Hypertension, Diabetes Type 2 (or None)"
                  className="w-full mt-1 px-3.5 py-2.5 bg-[#F4F8FC] border border-[#D9E1EA] rounded-xl text-xs sm:text-sm text-[#102A56] font-medium focus:bg-white focus:border-[#0FA3A3] focus:ring-2 focus:ring-[#0FA3A3]/15 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#102A56]">Primary Physician</label>
                <input
                  type="text"
                  value={primaryPhysician}
                  onChange={(e) => setPrimaryPhysician(e.target.value)}
                  placeholder="Dr. Priya Sharma"
                  className="w-full mt-1 px-3.5 py-2.5 bg-[#F4F8FC] border border-[#D9E1EA] rounded-xl text-xs sm:text-sm text-[#102A56] font-medium focus:bg-white focus:border-[#0FA3A3] focus:ring-2 focus:ring-[#0FA3A3]/15 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Form Step 4: Emergency Contact */}
          {step === 4 && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-[#102A56]">Emergency Contact Name</label>
                <input
                  type="text"
                  value={emergencyName}
                  onChange={(e) => setEmergencyName(e.target.value)}
                  placeholder="Jane Doe"
                  className="w-full mt-1 px-3.5 py-2.5 bg-[#F4F8FC] border border-[#D9E1EA] rounded-xl text-xs sm:text-sm text-[#102A56] font-medium focus:bg-white focus:border-[#0FA3A3] focus:ring-2 focus:ring-[#0FA3A3]/15 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-[#102A56]">Relationship</label>
                  <select
                    value={emergencyRelationship}
                    onChange={(e) => setEmergencyRelationship(e.target.value)}
                    className="w-full mt-1 px-3.5 py-2.5 bg-[#F4F8FC] border border-[#D9E1EA] rounded-xl text-xs sm:text-sm text-[#102A56] font-medium focus:bg-white focus:border-[#0FA3A3] focus:ring-2 focus:ring-[#0FA3A3]/15 focus:outline-none cursor-pointer"
                  >
                    <option value="Spouse">Spouse</option>
                    <option value="Parent">Parent</option>
                    <option value="Sibling">Sibling</option>
                    <option value="Child">Child</option>
                    <option value="Friend">Friend</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-[#102A56]">Emergency Phone</label>
                  <input
                    type="text"
                    value={emergencyPhone}
                    onChange={(e) => setEmergencyPhone(e.target.value)}
                    placeholder="+91 98765 67890"
                    className="w-full mt-1 px-3.5 py-2.5 bg-[#F4F8FC] border border-[#D9E1EA] rounded-xl text-xs sm:text-sm text-[#102A56] font-medium focus:bg-white focus:border-[#0FA3A3] focus:ring-2 focus:ring-[#0FA3A3]/15 focus:outline-none"
                  />
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#E8F8F5] border border-[#B2F5EA] text-xs text-[#1FA774] font-medium flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <span>You&apos;re all set! Submitting will finalize your profile and take you to your dashboard.</span>
              </div>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="pt-4 border-t border-[#F0F4F8] flex items-center justify-between gap-3">
            {step > 1 ? (
              <button
                type="button"
                onClick={handlePrev}
                disabled={loading}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-[#D9E1EA] text-[#102A56] hover:bg-[#F4F8FC] text-xs font-bold transition-all cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
            ) : (
              <div />
            )}

            {step < 4 ? (
              <button
                type="button"
                onClick={handleNext}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#0FA3A3] hover:bg-[#0D8E8E] text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
              >
                <span>Continue</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#0FA3A3] hover:bg-[#0D8E8E] text-white text-xs font-bold shadow-xs transition-all cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Completing Setup...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Complete Onboarding</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Footer Disclaimer */}
      <div className="max-w-3xl mx-auto w-full text-center text-[11px] text-[#8A98AA]">
        © 2026 MediAssist Health Technologies Inc. All medical records are securely encrypted.
      </div>
    </div>
  );
};
