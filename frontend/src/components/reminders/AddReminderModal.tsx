import React, { useState, useEffect } from 'react';
import { X, Pill, Calendar, CheckSquare, Bell, Loader2, Sparkles } from 'lucide-react';
import type { ReminderItem, ReminderType, ReminderCreatePayload } from '../../types/reminders';

interface AddReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: ReminderCreatePayload, editingId?: string) => Promise<void>;
  initialType?: ReminderType;
  editingReminder?: ReminderItem | null;
}

const TYPES: { type: ReminderType; label: string; icon: React.ReactNode }[] = [
  { type: 'Medication', label: 'Medication', icon: <Pill className="w-4 h-4" /> },
  { type: 'Appointment', label: 'Appointment', icon: <Calendar className="w-4 h-4" /> },
  { type: 'Health Task', label: 'Health Task', icon: <CheckSquare className="w-4 h-4" /> },
  { type: 'Custom', label: 'Custom', icon: <Bell className="w-4 h-4" /> },
];

export const AddReminderModal: React.FC<AddReminderModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialType = 'Medication',
  editingReminder,
}) => {
  const [selectedType, setSelectedType] = useState<ReminderType>(initialType);
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [timeStr, setTimeStr] = useState('08:00 AM');
  const [dateStr, setDateStr] = useState(new Date().toISOString().split('T')[0]);
  const [recurrence, setRecurrence] = useState('Daily');
  const [priority, setPriority] = useState('Normal');
  const [notificationPref, setNotificationPref] = useState('IN_APP');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editingReminder) {
      setSelectedType(editingReminder.reminder_type as ReminderType);
      setTitle(editingReminder.title);
      setSubtitle(editingReminder.subtitle || '');
      setTimeStr(editingReminder.time_str);
      setDateStr(editingReminder.date_str || new Date().toISOString().split('T')[0]);
      setRecurrence(editingReminder.recurrence || 'Daily');
      setPriority(editingReminder.priority || 'Normal');
      setNotificationPref(editingReminder.notification_preference || 'IN_APP');
      setNotes(editingReminder.notes || '');
    } else {
      setSelectedType(initialType);
      setTitle('');
      setSubtitle('');
      setTimeStr('08:00 AM');
      setDateStr(new Date().toISOString().split('T')[0]);
      setRecurrence('Daily');
      setPriority('Normal');
      setNotificationPref('IN_APP');
      setNotes('');
    }
  }, [editingReminder, initialType, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      setLoading(true);
      await onSubmit(
        {
          reminder_type: selectedType,
          title: title.trim(),
          subtitle: subtitle.trim() || undefined,
          time_str: timeStr,
          date_str: dateStr || undefined,
          recurrence,
          priority,
          notification_preference: notificationPref,
          notes: notes.trim() || undefined,
        },
        editingReminder ? editingReminder.id : undefined
      );
      onClose();
    } catch (err) {
      console.error('Error saving reminder:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-fadeIn">
      <div className="bg-white w-full max-w-lg rounded-3xl border border-slate-200 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col my-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900">
              {editingReminder ? 'Edit Reminder' : 'Add New Reminder'}
            </h2>
            <p className="text-[11px] text-slate-500">
              {editingReminder ? 'Update scheduled reminder details' : 'Set up a personalized alert for medications, appointments or health tasks'}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
          {/* Reminder Type Picker */}
          {!editingReminder && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-900">Reminder Type</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {TYPES.map((t) => {
                  const isSel = selectedType === t.type;
                  return (
                    <button
                      key={t.type}
                      type="button"
                      onClick={() => setSelectedType(t.type)}
                      className={`p-2.5 rounded-2xl border text-xs font-bold transition flex flex-col items-center gap-1.5 cursor-pointer ${
                        isSel
                          ? 'bg-teal-50 border-teal-400 text-teal-700 shadow-2xs'
                          : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600'
                      }`}
                    >
                      {t.icon}
                      <span className="text-[11px]">{t.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Title */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-900">
              {selectedType === 'Medication'
                ? 'Medication Name & Strength *'
                : selectedType === 'Appointment'
                ? 'Appointment / Visit Title *'
                : selectedType === 'Health Task'
                ? 'Health Task Title *'
                : 'Reminder Title *'}
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={
                selectedType === 'Medication'
                  ? 'e.g. Paracetamol 500mg'
                  : selectedType === 'Appointment'
                  ? 'e.g. Cardiology Consultation'
                  : selectedType === 'Health Task'
                  ? 'e.g. Drink 500ml Water'
                  : 'e.g. Call pharmacy for refill'
              }
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-teal-500 bg-white text-slate-900"
            />
          </div>

          {/* Subtitle / Dosage / Details */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-900">
              {selectedType === 'Medication'
                ? 'Dosage & Instruction'
                : selectedType === 'Appointment'
                ? 'Doctor / Clinic Name'
                : 'Subtitle or Notes'}
            </label>
            <input
              type="text"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder={
                selectedType === 'Medication'
                  ? 'e.g. 1 tablet • After breakfast'
                  : selectedType === 'Appointment'
                  ? 'e.g. Dr. Arjun Mehta • Heart Care Clinic'
                  : 'e.g. Stay hydrated throughout the morning'
              }
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-teal-500 bg-white text-slate-900"
            />
          </div>

          {/* Date & Time Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-900">Scheduled Time *</label>
              <input
                type="text"
                required
                value={timeStr}
                onChange={(e) => setTimeStr(e.target.value)}
                placeholder="e.g. 08:00 AM"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-teal-500 bg-white text-slate-900"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-900">Start / Event Date</label>
              <input
                type="date"
                value={dateStr}
                onChange={(e) => setDateStr(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-teal-500 bg-white text-slate-900"
              />
            </div>
          </div>

          {/* Recurrence & Priority Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-900">Repeat Frequency</label>
              <select
                value={recurrence}
                onChange={(e) => setRecurrence(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-teal-500 bg-white text-slate-900"
              >
                <option value="Daily">Daily</option>
                <option value="Once">Once</option>
                <option value="Weekly">Weekly</option>
                <option value="Monthly">Monthly</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-900">Priority Level</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-teal-500 bg-white text-slate-900"
              >
                <option value="Normal">Normal</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-900">Additional Instructions / Notes</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Take with a full glass of water. Avoid taking on an empty stomach."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-teal-500 bg-white text-slate-900 resize-none"
            />
          </div>

          {/* Footer Buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !title.trim()}
              className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs transition flex items-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{editingReminder ? 'Save Changes' : 'Create Reminder'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
