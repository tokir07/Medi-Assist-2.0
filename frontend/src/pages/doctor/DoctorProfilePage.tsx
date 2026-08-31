import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  User,
  ShieldCheck,
  CheckCircle2,
  Building,
  Award,
  BookOpen,
  Phone,
  Mail,
  Globe,
  Video,
  UserCheck,
  Edit2,
  Save,
} from 'lucide-react';

export const DoctorProfilePage: React.FC = () => {
  const { user } = useAuth();

  const [name, setName] = useState<string>(user?.name || 'Dr. Priya Sharma');
  const [specialization, setSpecialization] = useState<string>('General Medicine & Preventive Care');
  const [registrationNo, setRegistrationNo] = useState<string>('NMC-2026-889412');
  const [qualification, setQualification] = useState<string>('MBBS, MD (Internal Medicine)');
  const [experience, setExperience] = useState<number>(8);
  const [hospital, setHospital] = useState<string>('City Care Hospital');
  const [phone, setPhone] = useState<string>('+91 98765 43210');
  const [bio, setBio] = useState<string>(
    'Dedicated General Physician with 8 years of clinical experience in internal medicine, chronic disease management, lifestyle disease prevention, and teleconsultation care.'
  );

  const [consultationFee, setConsultationFee] = useState<number>(600);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsEditing(false);
    setToastMessage('Profile updated successfully!');
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-teal-800 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 text-sm font-semibold animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-5 h-5 text-teal-300 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-teal-50 text-teal-700 border-2 border-teal-200 flex items-center justify-center font-bold text-2xl shrink-0">
            {name.split(' ').map((n) => n[0]).join('')}
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span>{name}</span>
              <span className="inline-flex items-center gap-1 text-xs font-bold text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                <span>Verified Doctor</span>
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">{specialization}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsEditing(!isEditing)}
          className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-2 shadow-2xs transition-all cursor-pointer shrink-0 self-end sm:self-center"
        >
          {isEditing ? <Save className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
          <span>{isEditing ? 'Save Changes' : 'Edit Profile'}</span>
        </button>
      </div>

      {/* Main Profile Form / Details */}
      <form onSubmit={handleSave} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
        <h2 className="font-bold text-base text-slate-900 border-b border-slate-100 pb-3">Professional Credentials</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Full Doctor Name</label>
            <input
              type="text"
              disabled={!isEditing}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 disabled:opacity-80"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Medical Specialization</label>
            <input
              type="text"
              disabled={!isEditing}
              value={specialization}
              onChange={(e) => setSpecialization(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 disabled:opacity-80"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Registration Number (NMC / Council)</label>
            <input
              type="text"
              disabled={true}
              value={registrationNo}
              className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 cursor-not-allowed"
            />
            <span className="text-[10px] text-slate-400 mt-0.5 block">Protected admin-verified credential</span>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Qualifications</label>
            <input
              type="text"
              disabled={!isEditing}
              value={qualification}
              onChange={(e) => setQualification(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 disabled:opacity-80"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Years of Experience</label>
            <input
              type="number"
              disabled={!isEditing}
              value={experience}
              onChange={(e) => setExperience(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 disabled:opacity-80"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Consultation Fee (₹)</label>
            <input
              type="number"
              disabled={!isEditing}
              value={consultationFee}
              onChange={(e) => setConsultationFee(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 disabled:opacity-80"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1">Affiliated Hospital / Clinic</label>
          <input
            type="text"
            disabled={!isEditing}
            value={hospital}
            onChange={(e) => setHospital(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 disabled:opacity-80"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1">Professional Bio</label>
          <textarea
            rows={4}
            disabled={!isEditing}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 leading-relaxed disabled:opacity-80"
          />
        </div>

        {isEditing && (
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-2xs transition-all cursor-pointer"
            >
              Save Profile Changes
            </button>
          </div>
        )}
      </form>
    </div>
  );
};
