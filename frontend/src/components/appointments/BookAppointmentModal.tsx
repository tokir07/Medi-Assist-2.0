import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Stethoscope,
  Video,
  MapPin,
  AlertCircle,
  Loader2,
  Clock,
  Sparkles,
  Search,
} from 'lucide-react';
import { appointmentsService } from '../../services/appointmentsService';
import type { DoctorItem, CreateAppointmentPayload } from '../../types/appointments';

interface BookAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialSpecialty?: string;
  initialDoctor?: DoctorItem | null;
}

export const BookAppointmentModal: React.FC<BookAppointmentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialSpecialty,
  initialDoctor,
}) => {
  const [step, setStep] = useState<number>(1);
  const [doctors, setDoctors] = useState<DoctorItem[]>([]);
  const [doctorSearch, setDoctorSearch] = useState<string>('');

  // Form State
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>(
    initialSpecialty || 'General Physician'
  );
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorItem | null>(
    initialDoctor || null
  );

  // Dynamic default date: Tomorrow
  const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(tomorrowStr);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState<boolean>(false);
  const [selectedSlot, setSelectedSlot] = useState<string>('10:30 AM');
  const [appointmentType, setAppointmentType] = useState<string>('General Checkup');
  const [mode, setMode] = useState<'In-Person' | 'Video Call'>('In-Person');
  const [notes, setNotes] = useState<string>('');

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmedAptId, setConfirmedAptId] = useState<string | null>(null);

  const specialties = [
    'General Physician',
    'Cardiologist',
    'Orthopedic Surgeon',
    'Dentist',
    'Dermatologist',
    'Neurologist',
  ];

  // Fetch doctors on mount
  useEffect(() => {
    if (isOpen) {
      const fetchDocs = async () => {
        try {
          const docs = await appointmentsService.getDoctors();
          setDoctors(docs);
          if (!selectedDoctor && docs.length > 0) {
            const match = docs.find((d) => d.specialty === selectedSpecialty) || docs[0];
            setSelectedDoctor(match);
          }
        } catch (e) {
          console.error(e);
        }
      };
      fetchDocs();
    }
  }, [isOpen]);

  // Fetch real-time available slots whenever doctor or date changes
  useEffect(() => {
    if (selectedDoctor && selectedDate) {
      const fetchSlots = async () => {
        try {
          setLoadingSlots(true);
          const data = await appointmentsService.getAvailableSlots(
            selectedDoctor.name,
            selectedDate
          );
          setAvailableSlots(data.slots || []);
          if (data.slots && data.slots.length > 0) {
            if (!data.slots.includes(selectedSlot)) {
              setSelectedSlot(data.slots[0]);
            }
          } else {
            setSelectedSlot('');
          }
        } catch (e) {
          console.error(e);
        } finally {
          setLoadingSlots(false);
        }
      };
      fetchSlots();
    }
  }, [selectedDoctor, selectedDate]);

  if (!isOpen) return null;

  const filteredDoctors = doctors.filter((doc) => {
    const matchesSearch =
      doc.name.toLowerCase().includes(doctorSearch.toLowerCase()) ||
      doc.specialty.toLowerCase().includes(doctorSearch.toLowerCase()) ||
      doc.hospital.toLowerCase().includes(doctorSearch.toLowerCase());
    const matchesSpecialty =
      selectedSpecialty === 'All' || doc.specialty.toLowerCase().includes(selectedSpecialty.toLowerCase());
    return matchesSearch && (doctorSearch ? true : matchesSpecialty);
  });

  const handleConfirmBooking = async () => {
    if (!selectedDoctor) {
      setError('Please select a doctor.');
      return;
    }
    if (!selectedDate || !selectedSlot) {
      setError('Please choose an available appointment date and time slot.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const payload: CreateAppointmentPayload = {
        doctor_id: selectedDoctor.id.startsWith('doc-') ? undefined : selectedDoctor.id,
        doctor_name: selectedDoctor.name,
        doctor_specialty: selectedDoctor.specialty,
        doctor_image: selectedDoctor.image_url || undefined,
        hospital: selectedDoctor.hospital,
        appointment_type: appointmentType,
        appointment_date: selectedDate,
        appointment_time: selectedSlot,
        mode: mode,
        session_name: `${appointmentType} with ${selectedDoctor.name}`,
        notes: notes.trim() || undefined,
      };

      const result = await appointmentsService.createAppointment(payload);
      setConfirmedAptId(result.id);
      setStep(4); // Success step
    } catch (err: any) {
      console.error('Booking failed:', err);
      setError(
        err?.response?.data?.message ||
          'This appointment slot is no longer available. Please select another time.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-700 border border-teal-100 flex items-center justify-center shadow-2xs font-bold">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                Book Medical Appointment
              </h3>
              <p className="text-xs text-slate-500">
                {step === 4
                  ? 'Appointment Confirmed'
                  : `Step ${step} of 3: ${
                      step === 1 ? 'Find & Select Doctor' : step === 2 ? 'Select Schedule & Mode' : 'Review & Confirm'
                    }`}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 custom-scrollbar text-xs space-y-4">
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          {/* STEP 1: Select Doctor & Specialty */}
          {step === 1 && (
            <div className="space-y-4">
              {/* Specialty selector */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Choose Specialty
                </label>
                <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                  {specialties.map((spec) => (
                    <button
                      key={spec}
                      type="button"
                      onClick={() => {
                        setSelectedSpecialty(spec);
                        const match = doctors.find((d) => d.specialty === spec);
                        if (match) setSelectedDoctor(match);
                      }}
                      className={`px-3 py-1.5 rounded-xl font-bold text-xs whitespace-nowrap transition cursor-pointer ${
                        selectedSpecialty === spec
                          ? 'bg-teal-600 text-white shadow-2xs'
                          : 'bg-slate-100 hover:bg-slate-200/80 text-slate-700'
                      }`}
                    >
                      {spec}
                    </button>
                  ))}
                </div>
              </div>

              {/* Search doctor input */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search doctor by name, specialty, or clinic..."
                  value={doctorSearch}
                  onChange={(e) => setDoctorSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:border-teal-500 focus:outline-hidden transition"
                />
              </div>

              {/* Doctor List */}
              <div className="space-y-2.5 max-h-64 overflow-y-auto custom-scrollbar">
                {filteredDoctors.map((doc) => {
                  const isSelected = selectedDoctor?.name === doc.name;
                  return (
                    <div
                      key={doc.id}
                      onClick={() => setSelectedDoctor(doc)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'bg-teal-50/60 border-teal-500 shadow-2xs'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {doc.image_url ? (
                          <img
                            src={doc.image_url}
                            alt={doc.name}
                            className="w-11 h-11 rounded-full object-cover border border-slate-200 shadow-2xs shrink-0"
                          />
                        ) : (
                          <div className="w-11 h-11 rounded-full bg-teal-50 text-teal-700 font-bold flex items-center justify-center border border-teal-200 shrink-0">
                            {doc.name.replace('Dr.', '').trim().charAt(0) || 'D'}
                          </div>
                        )}
                        <div className="min-w-0">
                          <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                            {doc.name}
                          </h4>
                          <p className="text-[11px] text-slate-500">{doc.specialty} • {doc.experience}y exp</p>
                          <p className="text-[10px] text-slate-400 truncate">{doc.hospital}</p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="inline-block px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 font-bold text-[10px]">
                          ★ {doc.rating}
                        </span>
                        {isSelected && (
                          <div className="text-teal-600 mt-1 flex items-center justify-end gap-0.5 text-[11px] font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Selected</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 2: Date, Slot & Consultation Details */}
          {step === 2 && (
            <div className="space-y-4">
              {/* Selected doctor banner */}
              {selectedDoctor && (
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Stethoscope className="w-4 h-4 text-teal-600" />
                    <div>
                      <h4 className="font-bold text-slate-900">{selectedDoctor.name}</h4>
                      <p className="text-[11px] text-slate-500">{selectedDoctor.specialty} • {selectedDoctor.hospital}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-teal-700 font-bold text-[11px] hover:underline"
                  >
                    Change
                  </button>
                </div>
              )}

              {/* Date Picker */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Select Appointment Date *
                </label>
                <input
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:bg-white focus:border-teal-500 focus:outline-hidden transition"
                />
              </div>

              {/* Time Slots */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    Available Time Slots *
                  </label>
                  {loadingSlots && <span className="text-[10px] text-teal-600 animate-pulse">Checking availability...</span>}
                </div>

                {availableSlots.length === 0 && !loadingSlots ? (
                  <p className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-[11px]">
                    No available slots for this date. Please select another date.
                  </p>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {availableSlots.map((slot) => {
                      const isSlotSelected = selectedSlot === slot;
                      return (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => setSelectedSlot(slot)}
                          className={`py-2 px-1 rounded-xl text-center font-bold text-xs transition cursor-pointer ${
                            isSlotSelected
                              ? 'bg-teal-600 text-white shadow-2xs'
                              : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200'
                          }`}
                        >
                          {slot}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Mode Selection */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setMode('In-Person')}
                  className={`p-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer ${
                    mode === 'In-Person'
                      ? 'bg-teal-50 border-teal-500 text-teal-700'
                      : 'bg-white border-slate-200 text-slate-700'
                  }`}
                >
                  <MapPin className="w-4 h-4" />
                  <span>In-Person Visit</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMode('Video Call')}
                  className={`p-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer ${
                    mode === 'Video Call'
                      ? 'bg-teal-50 border-teal-500 text-teal-700'
                      : 'bg-white border-slate-200 text-slate-700'
                  }`}
                >
                  <Video className="w-4 h-4" />
                  <span>Teleconsultation</span>
                </button>
              </div>

              {/* Notes / Reason */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Reason for Visit / Symptoms (Optional)
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Regular health checkup, mild headache for 2 days..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:border-teal-500 focus:outline-hidden transition"
                />
              </div>
            </div>
          )}

          {/* STEP 3: Review & Confirm */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 space-y-3">
                <h4 className="font-bold text-slate-900 text-sm border-b border-slate-200/80 pb-2">
                  Appointment Summary Review
                </h4>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Doctor</span>
                    <p className="font-bold text-slate-900">{selectedDoctor?.name}</p>
                    <p className="text-slate-500 text-[11px]">{selectedDoctor?.specialty}</p>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Location</span>
                    <p className="font-bold text-slate-900">{selectedDoctor?.hospital}</p>
                    <p className="text-slate-500 text-[11px]">{mode}</p>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Date & Time</span>
                    <p className="font-bold text-slate-900">{selectedDate}</p>
                    <p className="text-teal-700 font-bold text-[11px]">{selectedSlot}</p>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Type</span>
                    <p className="font-bold text-slate-900">{appointmentType}</p>
                    <p className="text-slate-500 text-[11px]">30 Minutes</p>
                  </div>
                </div>

                {notes && (
                  <div className="pt-2 border-t border-slate-200 text-xs">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Notes</span>
                    <p className="text-slate-700">{notes}</p>
                  </div>
                )}
              </div>

              <div className="p-3 bg-teal-50 border border-teal-100 rounded-xl text-teal-900 text-[11px] flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-teal-600 shrink-0" />
                <span>An automated reminder will be created for you upon booking confirmation.</span>
              </div>
            </div>
          )}

          {/* STEP 4: Success Screen */}
          {step === 4 && (
            <div className="py-6 text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto shadow-sm animate-bounce">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Appointment Confirmed!</h3>
              <p className="text-xs text-slate-600 max-w-sm mx-auto">
                Your appointment with <strong>{selectedDoctor?.name}</strong> on <strong>{selectedDate}</strong> at <strong>{selectedSlot}</strong> has been booked and saved to your records.
              </p>
              {confirmedAptId && (
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 inline-block text-xs font-mono font-bold text-slate-700">
                  Appointment ID: {confirmedAptId.slice(0, 8).toUpperCase()}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between">
          {step < 4 ? (
            <>
              {step > 1 ? (
                <button
                  type="button"
                  onClick={() => setStep((prev) => prev - 1)}
                  className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl font-bold text-xs transition flex items-center gap-1 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl font-bold text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
              )}

              {step === 1 ? (
                <button
                  type="button"
                  disabled={!selectedDoctor}
                  onClick={() => setStep(2)}
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold text-xs transition flex items-center gap-1 disabled:opacity-50 cursor-pointer shadow-sm"
                >
                  <span>Continue</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : step === 2 ? (
                <button
                  type="button"
                  disabled={!selectedSlot || !selectedDate}
                  onClick={() => setStep(3)}
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold text-xs transition flex items-center gap-1 disabled:opacity-50 cursor-pointer shadow-sm"
                >
                  <span>Review Booking</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleConfirmBooking}
                  className="px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold text-xs transition flex items-center gap-1.5 disabled:opacity-60 cursor-pointer shadow-sm"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{submitting ? 'Confirming...' : 'Confirm Appointment'}</span>
                </button>
              )}
            </>
          ) : (
            <button
              type="button"
              onClick={() => {
                onSuccess();
                onClose();
              }}
              className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold text-xs transition cursor-pointer shadow-sm"
            >
              Done & View Appointments
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
