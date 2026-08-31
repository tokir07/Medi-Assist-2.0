import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ReminderTabs } from '../components/reminders/ReminderTabs';
import { ReminderSummaryCards } from '../components/reminders/ReminderSummaryCards';
import { TodayRemindersSection } from '../components/reminders/TodayRemindersSection';
import { UpcomingRemindersSection } from '../components/reminders/UpcomingRemindersSection';
import { ReminderCalendarPanel } from '../components/reminders/ReminderCalendarPanel';
import { QuickActionsPanel } from '../components/reminders/QuickActionsPanel';
import { StayOnTrackCard } from '../components/reminders/StayOnTrackCard';
import { ImportantNoteCard } from '../components/reminders/ImportantNoteCard';
import { AddReminderModal } from '../components/reminders/AddReminderModal';
import { ReminderHistoryModal } from '../components/reminders/ReminderHistoryModal';
import { DeleteReminderModal } from '../components/reminders/DeleteReminderModal';
import { remindersService } from '../services/remindersService';
import type {
  ReminderItem,
  ReminderTab,
  ReminderType,
  ReminderSummaryStats,
  ReminderCreatePayload,
} from '../types/reminders';

export const RemindersPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Search & Filter state synced with URL
  const activeTab = (searchParams.get('tab') as ReminderTab) || 'All Reminders';
  const searchQuery = searchParams.get('search') || '';
  const selectedDate = searchParams.get('date') || null;

  // Data states
  const [todayReminders, setTodayReminders] = useState<ReminderItem[]>([]);
  const [upcomingReminders, setUpcomingReminders] = useState<ReminderItem[]>([]);
  const [summary, setSummary] = useState<ReminderSummaryStats | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [summaryLoading, setSummaryLoading] = useState<boolean>(true);

  const [showAllUpcoming, setShowAllUpcoming] = useState<boolean>(false);

  // Modals state
  const [addModalOpen, setAddModalOpen] = useState<boolean>(false);
  const [addModalType, setAddModalType] = useState<ReminderType>('Medication');
  const [editingReminder, setEditingReminder] = useState<ReminderItem | null>(null);

  const [historyModalOpen, setHistoryModalOpen] = useState<boolean>(false);

  const [deleteModalOpen, setDeleteModalOpen] = useState<boolean>(false);
  const [reminderToDelete, setReminderToDelete] = useState<ReminderItem | null>(null);

  // Fetch reminders based on filters
  const fetchReminders = useCallback(async () => {
    try {
      setLoading(true);
      const res = await remindersService.getReminders({
        tab: activeTab,
        search: searchQuery || undefined,
        date: selectedDate || undefined,
      });

      setTodayReminders(res.today_reminders || []);
      setUpcomingReminders(res.upcoming_reminders || []);
    } catch (err) {
      console.error('Failed to load reminders:', err);
    } finally {
      setLoading(false);
    }
  }, [activeTab, searchQuery, selectedDate]);

  // Fetch summary counters
  const fetchSummary = useCallback(async () => {
    try {
      setSummaryLoading(true);
      const data = await remindersService.getSummary();
      setSummary(data);
    } catch (err) {
      console.error('Failed to load summary stats:', err);
    } finally {
      setSummaryLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReminders();
  }, [fetchReminders]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  // Tab & Filter Handlers
  const handleSelectTab = (tab: ReminderTab) => {
    const params = new URLSearchParams(searchParams);
    if (tab === 'All Reminders') {
      params.delete('tab');
    } else {
      params.set('tab', tab);
    }
    setSearchParams(params);
  };

  const handleSelectDate = (dateStr: string | null) => {
    const params = new URLSearchParams(searchParams);
    if (!dateStr) {
      params.delete('date');
    } else {
      params.set('date', dateStr);
    }
    setSearchParams(params);
  };

  // Complete single reminder
  const handleComplete = async (reminderId: string) => {
    try {
      // Optimistic update
      setTodayReminders((prev) =>
        prev.map((r) => (r.id === reminderId ? { ...r, is_completed: true, status: 'Completed' } : r))
      );
      setUpcomingReminders((prev) =>
        prev.map((r) => (r.id === reminderId ? { ...r, is_completed: true, status: 'Completed' } : r))
      );

      await remindersService.markCompleted(reminderId);
      fetchSummary();
    } catch (err) {
      console.error('Failed to mark reminder completed:', err);
      fetchReminders();
    }
  };

  // Snooze reminder
  const handleSnooze = async (reminderId: string) => {
    try {
      setTodayReminders((prev) =>
        prev.map((r) => (r.id === reminderId ? { ...r, status: 'Snoozed' } : r))
      );
      await remindersService.snoozeReminder(reminderId, 15);
      fetchSummary();
    } catch (err) {
      console.error('Failed to snooze reminder:', err);
      fetchReminders();
    }
  };

  // Dismiss reminder
  const handleDismiss = async (reminderId: string) => {
    try {
      setTodayReminders((prev) =>
        prev.filter((r) => r.id !== reminderId)
      );
      setUpcomingReminders((prev) =>
        prev.filter((r) => r.id !== reminderId)
      );
      await remindersService.dismissReminder(reminderId);
      fetchSummary();
    } catch (err) {
      console.error('Failed to dismiss reminder:', err);
      fetchReminders();
    }
  };

  // Mark all today's reminders complete
  const handleMarkAllTodayCompleted = async () => {
    try {
      setTodayReminders((prev) =>
        prev.map((r) => ({ ...r, is_completed: true, status: 'Completed' }))
      );
      await remindersService.markAllTodayCompleted();
      fetchSummary();
    } catch (err) {
      console.error('Failed to complete all today reminders:', err);
      fetchReminders();
    }
  };

  // Add / Edit Reminder submit
  const handleSaveReminder = async (payload: ReminderCreatePayload, editingId?: string) => {
    if (editingId) {
      await remindersService.updateReminder(editingId, payload);
    } else {
      await remindersService.createReminder(payload);
    }
    fetchReminders();
    fetchSummary();
  };

  // Delete reminder confirm
  const handleConfirmDelete = async (reminderId: string) => {
    await remindersService.deleteReminder(reminderId);
    fetchReminders();
    fetchSummary();
  };

  // View Appointment Details
  const handleViewAppointmentDetails = () => {
    navigate('/patient/appointments');
  };

  const handleOpenAddModal = (type: ReminderType = 'Medication') => {
    setEditingReminder(null);
    setAddModalType(type);
    setAddModalOpen(true);
  };

  const handleOpenEditModal = (reminder: ReminderItem) => {
    setEditingReminder(reminder);
    setAddModalType(reminder.reminder_type as ReminderType);
    setAddModalOpen(true);
  };

  const handleOpenDeleteModal = (reminder: ReminderItem) => {
    setReminderToDelete(reminder);
    setDeleteModalOpen(true);
  };

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* 3-Column Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Main Center Content (8 cols on desktop) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Primary Navigation Tabs */}
          <ReminderTabs
            activeTab={activeTab}
            onSelectTab={handleSelectTab}
            onOpenAddModal={() => handleOpenAddModal('Medication')}
          />

          {/* 5 Summary Stat Cards */}
          <ReminderSummaryCards summary={summary} loading={summaryLoading} />

          {/* Date Filter Indicator */}
          {selectedDate && (
            <div className="p-3.5 bg-teal-50/70 border border-teal-200 rounded-2xl flex items-center justify-between shadow-2xs">
              <span className="text-xs font-semibold text-slate-900">
                Filtered for date: <strong className="text-teal-700">{selectedDate}</strong>
              </span>
              <button
                type="button"
                onClick={() => handleSelectDate(null)}
                className="text-xs font-bold text-teal-700 hover:text-teal-800 cursor-pointer"
              >
                Clear Date Filter
              </button>
            </div>
          )}

          {/* Today's Reminders Section */}
          <TodayRemindersSection
            reminders={todayReminders}
            onComplete={handleComplete}
            onSnooze={handleSnooze}
            onDismiss={handleDismiss}
            onEdit={handleOpenEditModal}
            onDelete={handleOpenDeleteModal}
            onViewAppointmentDetails={handleViewAppointmentDetails}
            onMarkAllCompleted={handleMarkAllTodayCompleted}
            onOpenAddModal={() => handleOpenAddModal('Medication')}
            loading={loading}
          />

          {/* Upcoming Reminders Section */}
          <UpcomingRemindersSection
            reminders={upcomingReminders}
            onComplete={handleComplete}
            onSnooze={handleSnooze}
            onDismiss={handleDismiss}
            onEdit={handleOpenEditModal}
            onDelete={handleOpenDeleteModal}
            onViewAppointmentDetails={handleViewAppointmentDetails}
            showAll={showAllUpcoming}
            onToggleShowAll={() => setShowAllUpcoming(!showAllUpcoming)}
          />
        </div>

        {/* Right Sidebar Panel (4 cols on desktop) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Interactive Calendar */}
          <ReminderCalendarPanel
            selectedDate={selectedDate}
            onSelectDate={handleSelectDate}
          />

          {/* Quick Actions */}
          <QuickActionsPanel
            onOpenAddModalWithType={(type) => handleOpenAddModal(type)}
          />

          {/* Stay on Track */}
          <StayOnTrackCard onOpenHistory={() => setHistoryModalOpen(true)} />

          {/* Important Medical Note */}
          <ImportantNoteCard />
        </div>
      </div>

      {/* Add / Edit Reminder Modal */}
      <AddReminderModal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSubmit={handleSaveReminder}
        initialType={addModalType}
        editingReminder={editingReminder}
      />

      {/* History Modal */}
      <ReminderHistoryModal
        isOpen={historyModalOpen}
        onClose={() => setHistoryModalOpen(false)}
      />

      {/* Delete Confirmation Modal */}
      <DeleteReminderModal
        reminder={reminderToDelete}
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirmDelete={handleConfirmDelete}
      />
    </div>
  );
};
