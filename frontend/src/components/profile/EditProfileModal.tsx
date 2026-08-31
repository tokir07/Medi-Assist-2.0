import React, { useState, useEffect } from 'react';
import { X, User, Shield, HeartPulse, Loader2 } from 'lucide-react';
import type { PatientProfile, ProfileUpdatePayload } from '../../types/profile';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: PatientProfile | null;
  onSave: (payload: ProfileUpdatePayload) => Promise<void>;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
  profile,
  onSave,
}) => {
  const [fullName, setFullName] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('Male');
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('India');
  const [maritalStatus, setMaritalStatus] = useState('Married');

  // Medical info
  const [allergies, setAllergies] = useState('');
  const [chronicConditions, setChronicConditions] = useState('');
  const [currentMedications, setCurrentMedications] = useState('');
  const [primaryPhysician, setPrimaryPhysician] = useState('');
  const [primaryPhysicianSpecialty, setPrimaryPhysicianSpecialty] = useState('');

  // Emergency contact
  const [ecName, setEcName] = useState('');
  const [ecRelationship, setEcRelationship] = useState('Spouse');
  const [ecPhone, setEcPhone] = useState('');
  const [ecEmail, setEcEmail] = useState('');
  const [ecAddress, setEcAddress] = useState('');

  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'personal' | 'medical' | 'emergency'>('personal');

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setDob(profile.date_of_birth || '12 March 1990');
      setGender(profile.gender || 'Male');
      setBloodGroup(profile.blood_group || 'O+');
      setPhone(profile.phone || '+91 98765 43210');
      setAddress(profile.address || '123, Green Park, New Delhi, Delhi 110016, India');
      setCity(profile.city || 'New Delhi');
      setState(profile.state || 'Delhi');
      setPostalCode(profile.postal_code || '110016');
      setCountry(profile.country || 'India');
      setMaritalStatus(profile.marital_status || 'Married');

      setAllergies(profile.allergies || 'Pollen, Penicillin');
      setChronicConditions(profile.chronic_conditions || 'None');
      setCurrentMedications(profile.current_medications || 'Atorvastatin 10mg (Daily)');
      setPrimaryPhysician(profile.primary_physician || 'Dr. Priya Sharma');
      setPrimaryPhysicianSpecialty(profile.primary_physician_specialty || 'General Physician');

      if (profile.emergency_contact) {
        setEcName(profile.emergency_contact.name || 'Jane Doe');
        setEcRelationship(profile.emergency_contact.relationship || 'Spouse');
        setEcPhone(profile.emergency_contact.phone || '+91 98765 67890');
        setEcEmail(profile.emergency_contact.email || 'janedoe@email.com');
        setEcAddress(profile.emergency_contact.address || '123, Green Park, New Delhi, Delhi 110016, India');
      }
    }
  }, [profile, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) return;

    try {
      setLoading(true);
      await onSave({
        full_name: fullName.trim(),
        date_of_birth: dob.trim(),
        gender,
        blood_group: bloodGroup,
        phone: phone.trim(),
        address: address.trim(),
        city: city.trim(),
        state: state.trim(),
        postal_code: postalCode.trim(),
        country: country.trim(),
        marital_status: maritalStatus,
        allergies: allergies.trim(),
        chronic_conditions: chronicConditions.trim(),
        current_medications: currentMedications.trim(),
        primary_physician: primaryPhysician.trim(),
        primary_physician_specialty: primaryPhysicianSpecialty.trim(),
        emergency_contact: {
          name: ecName.trim(),
          relationship: ecRelationship,
          phone: ecPhone.trim(),
          email: ecEmail.trim(),
          address: ecAddress.trim(),
        },
      });
      onClose();
    } catch (err) {
      console.error('Failed to update profile:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#102A56]/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-3xl border border-[#D9E1EA] shadow-2xl overflow-hidden max-h-[92vh] flex flex-col my-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E7EDF4] flex items-center justify-between bg-[#F7FAFF]">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-[#102A56]">
              Edit Profile Details
            </h2>
            <p className="text-[11px] text-[#5F6F86]">
              Update your personal, medical, and emergency contact details
            </p>
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

        {/* Sub Navigation Tabs */}
        <div className="px-6 border-b border-[#F0F4F8] flex items-center gap-4 bg-white">
          <button
            type="button"
            onClick={() => setActiveTab('personal')}
            className={`py-2.5 text-xs font-bold transition-all border-b-2 cursor-pointer ${
              activeTab === 'personal'
                ? 'border-[#0FA3A3] text-[#0FA3A3]'
                : 'border-transparent text-[#5F6F86] hover:text-[#102A56]'
            }`}
          >
            Personal Details
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('medical')}
            className={`py-2.5 text-xs font-bold transition-all border-b-2 cursor-pointer ${
              activeTab === 'medical'
                ? 'border-[#0FA3A3] text-[#0FA3A3]'
                : 'border-transparent text-[#5F6F86] hover:text-[#102A56]'
            }`}
          >
            Medical Info
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('emergency')}
            className={`py-2.5 text-xs font-bold transition-all border-b-2 cursor-pointer ${
              activeTab === 'emergency'
                ? 'border-[#0FA3A3] text-[#0FA3A3]'
                : 'border-transparent text-[#5F6F86] hover:text-[#102A56]'
            }`}
          >
            Emergency Contact
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* Tab 1: Personal Details */}
          {activeTab === 'personal' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Full Name */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#102A56]">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#F4F8FC] border border-[#D9E1EA] rounded-xl text-xs sm:text-sm text-[#102A56] focus:bg-white focus:border-[#0FA3A3] focus:ring-2 focus:ring-[#0FA3A3]/15 focus:outline-none transition-all"
                  />
                </div>

                {/* Email (Readonly as identifier) */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#102A56]">Email Address</label>
                  <input
                    type="email"
                    disabled
                    value={profile?.email || 'patient@example.com'}
                    className="w-full px-3.5 py-2.5 bg-[#F0F4F8] border border-[#D9E1EA] rounded-xl text-xs sm:text-sm text-[#8A98AA] cursor-not-allowed"
                  />
                </div>

                {/* Date of Birth */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#102A56]">Date of Birth</label>
                  <input
                    type="text"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    placeholder="e.g. 12 March 1990"
                    className="w-full px-3.5 py-2.5 bg-[#F4F8FC] border border-[#D9E1EA] rounded-xl text-xs sm:text-sm text-[#102A56] focus:bg-white focus:border-[#0FA3A3] focus:ring-2 focus:ring-[#0FA3A3]/15 focus:outline-none transition-all"
                  />
                </div>

                {/* Phone Number */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#102A56]">Phone Number</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full px-3.5 py-2.5 bg-[#F4F8FC] border border-[#D9E1EA] rounded-xl text-xs sm:text-sm text-[#102A56] focus:bg-white focus:border-[#0FA3A3] focus:ring-2 focus:ring-[#0FA3A3]/15 focus:outline-none transition-all"
                  />
                </div>

                {/* Gender */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#102A56]">Gender</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#F4F8FC] border border-[#D9E1EA] rounded-xl text-xs sm:text-sm font-semibold text-[#102A56] focus:bg-white focus:border-[#0FA3A3] focus:ring-2 focus:ring-[#0FA3A3]/15 focus:outline-none transition-all cursor-pointer"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Blood Group */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#102A56]">Blood Group</label>
                  <select
                    value={bloodGroup}
                    onChange={(e) => setBloodGroup(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#F4F8FC] border border-[#D9E1EA] rounded-xl text-xs sm:text-sm font-semibold text-[#102A56] focus:bg-white focus:border-[#0FA3A3] focus:ring-2 focus:ring-[#0FA3A3]/15 focus:outline-none transition-all cursor-pointer"
                  >
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                      <option key={bg} value={bg}>
                        {bg}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Marital Status */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#102A56]">Marital Status</label>
                  <select
                    value={maritalStatus}
                    onChange={(e) => setMaritalStatus(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#F4F8FC] border border-[#D9E1EA] rounded-xl text-xs sm:text-sm font-semibold text-[#102A56] focus:bg-white focus:border-[#0FA3A3] focus:ring-2 focus:ring-[#0FA3A3]/15 focus:outline-none transition-all cursor-pointer"
                  >
                    <option value="Married">Married</option>
                    <option value="Single">Single</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* City */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#102A56]">City</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. New Delhi"
                    className="w-full px-3.5 py-2.5 bg-[#F4F8FC] border border-[#D9E1EA] rounded-xl text-xs sm:text-sm text-[#102A56] focus:bg-white focus:border-[#0FA3A3] focus:ring-2 focus:ring-[#0FA3A3]/15 focus:outline-none transition-all"
                  />
                </div>
              </div>

              {/* Full Address */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#102A56]">Residential Address</label>
                <textarea
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street, locality, city, state, postal code"
                  className="w-full px-3.5 py-2 bg-[#F4F8FC] border border-[#D9E1EA] rounded-xl text-xs sm:text-sm text-[#102A56] focus:bg-white focus:border-[#0FA3A3] focus:ring-2 focus:ring-[#0FA3A3]/15 focus:outline-none transition-all"
                />
              </div>
            </div>
          )}

          {/* Tab 2: Medical Details */}
          {activeTab === 'medical' && (
            <div className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#102A56]">Allergies</label>
                <input
                  type="text"
                  value={allergies}
                  onChange={(e) => setAllergies(e.target.value)}
                  placeholder="e.g. Pollen, Penicillin"
                  className="w-full px-3.5 py-2.5 bg-[#F4F8FC] border border-[#D9E1EA] rounded-xl text-xs sm:text-sm text-[#102A56] focus:bg-white focus:border-[#0FA3A3] focus:ring-2 focus:ring-[#0FA3A3]/15 focus:outline-none transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#102A56]">Current Medications</label>
                <input
                  type="text"
                  value={currentMedications}
                  onChange={(e) => setCurrentMedications(e.target.value)}
                  placeholder="e.g. Atorvastatin 10mg (Daily)"
                  className="w-full px-3.5 py-2.5 bg-[#F4F8FC] border border-[#D9E1EA] rounded-xl text-xs sm:text-sm text-[#102A56] focus:bg-white focus:border-[#0FA3A3] focus:ring-2 focus:ring-[#0FA3A3]/15 focus:outline-none transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#102A56]">Chronic Conditions</label>
                <input
                  type="text"
                  value={chronicConditions}
                  onChange={(e) => setChronicConditions(e.target.value)}
                  placeholder="e.g. None or Hypertension"
                  className="w-full px-3.5 py-2.5 bg-[#F4F8FC] border border-[#D9E1EA] rounded-xl text-xs sm:text-sm text-[#102A56] focus:bg-white focus:border-[#0FA3A3] focus:ring-2 focus:ring-[#0FA3A3]/15 focus:outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#102A56]">Primary Physician</label>
                  <input
                    type="text"
                    value={primaryPhysician}
                    onChange={(e) => setPrimaryPhysician(e.target.value)}
                    placeholder="e.g. Dr. Priya Sharma"
                    className="w-full px-3.5 py-2.5 bg-[#F4F8FC] border border-[#D9E1EA] rounded-xl text-xs sm:text-sm text-[#102A56] focus:bg-white focus:border-[#0FA3A3] focus:ring-2 focus:ring-[#0FA3A3]/15 focus:outline-none transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#102A56]">Physician Specialty</label>
                  <input
                    type="text"
                    value={primaryPhysicianSpecialty}
                    onChange={(e) => setPrimaryPhysicianSpecialty(e.target.value)}
                    placeholder="e.g. General Physician"
                    className="w-full px-3.5 py-2.5 bg-[#F4F8FC] border border-[#D9E1EA] rounded-xl text-xs sm:text-sm text-[#102A56] focus:bg-white focus:border-[#0FA3A3] focus:ring-2 focus:ring-[#0FA3A3]/15 focus:outline-none transition-all"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Emergency Contact */}
          {activeTab === 'emergency' && (
            <div className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#102A56]">Contact Name</label>
                  <input
                    type="text"
                    value={ecName}
                    onChange={(e) => setEcName(e.target.value)}
                    placeholder="e.g. Jane Doe"
                    className="w-full px-3.5 py-2.5 bg-[#F4F8FC] border border-[#D9E1EA] rounded-xl text-xs sm:text-sm text-[#102A56] focus:bg-white focus:border-[#0FA3A3] focus:ring-2 focus:ring-[#0FA3A3]/15 focus:outline-none transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#102A56]">Relationship</label>
                  <select
                    value={ecRelationship}
                    onChange={(e) => setEcRelationship(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#F4F8FC] border border-[#D9E1EA] rounded-xl text-xs sm:text-sm font-semibold text-[#102A56] focus:bg-white focus:border-[#0FA3A3] focus:ring-2 focus:ring-[#0FA3A3]/15 focus:outline-none transition-all cursor-pointer"
                  >
                    <option value="Spouse">Spouse</option>
                    <option value="Parent">Parent</option>
                    <option value="Sibling">Sibling</option>
                    <option value="Child">Child</option>
                    <option value="Friend">Friend</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#102A56]">Phone Number</label>
                  <input
                    type="text"
                    value={ecPhone}
                    onChange={(e) => setEcPhone(e.target.value)}
                    placeholder="e.g. +91 98765 67890"
                    className="w-full px-3.5 py-2.5 bg-[#F4F8FC] border border-[#D9E1EA] rounded-xl text-xs sm:text-sm text-[#102A56] focus:bg-white focus:border-[#0FA3A3] focus:ring-2 focus:ring-[#0FA3A3]/15 focus:outline-none transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#102A56]">Email Address</label>
                  <input
                    type="email"
                    value={ecEmail}
                    onChange={(e) => setEcEmail(e.target.value)}
                    placeholder="e.g. janedoe@email.com"
                    className="w-full px-3.5 py-2.5 bg-[#F4F8FC] border border-[#D9E1EA] rounded-xl text-xs sm:text-sm text-[#102A56] focus:bg-white focus:border-[#0FA3A3] focus:ring-2 focus:ring-[#0FA3A3]/15 focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#102A56]">Contact Address</label>
                <textarea
                  rows={2}
                  value={ecAddress}
                  onChange={(e) => setEcAddress(e.target.value)}
                  placeholder="Street, locality, city, state, postal code"
                  className="w-full px-3.5 py-2 bg-[#F4F8FC] border border-[#D9E1EA] rounded-xl text-xs sm:text-sm text-[#102A56] focus:bg-white focus:border-[#0FA3A3] focus:ring-2 focus:ring-[#0FA3A3]/15 focus:outline-none transition-all"
                />
              </div>
            </div>
          )}

          {/* Footer CTA */}
          <div className="pt-3 border-t border-[#E7EDF4] flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-[#5F6F86] hover:bg-[#F4F8FC] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !fullName.trim()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0FA3A3] hover:bg-[#0D8E8E] active:bg-[#0A7373] text-white text-xs sm:text-sm font-bold shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save Changes</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
