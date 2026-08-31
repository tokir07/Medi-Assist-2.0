import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { appointmentsService } from '../services/appointmentsService';
import { recordsService } from '../services/recordsService';
import type {
  AppointmentItem,
  AppointmentSummaryStats,
  AppointmentTab,
  DoctorItem,
  RecommendationItem,
  DoctorHealthMessage,
} from '../types/appointments';
import type { MedicalRecordItem } from '../types/records';

import { AppointmentTabs } from '../components/appointments/AppointmentTabs';
import { AppointmentSummaryCards } from '../components/appointments/AppointmentSummaryCards';
import { AppointmentToolbar } from '../components/appointments/AppointmentToolbar';
import { AppointmentList } from '../components/appointments/AppointmentList';
import { DoctorMessagesSection } from '../components/appointments/DoctorMessagesSection';
import { RecommendationsSection } from '../components/appointments/RecommendationsSection';
import { HealthTipBanner } from '../components/appointments/HealthTipBanner';
import { CalendarPanel } from '../components/appointments/CalendarPanel';
import { QuickActionsCard } from '../components/appointments/QuickActionsCard';
import { SupportPanel } from '../components/appointments/SupportPanel';

import { BookAppointmentModal } from '../components/appointments/BookAppointmentModal';
import { AppointmentDetailsModal } from '../components/appointments/AppointmentDetailsModal';
import { RescheduleAppointmentModal } from '../components/appointments/RescheduleAppointmentModal';
import { CancelAppointmentModal } from '../components/appointments/CancelAppointmentModal';
import { FilterAppointmentsModal } from '../components/appointments/FilterAppointmentsModal';
import { FindDoctorModal } from '../components/appointments/FindDoctorModal';
import { HospitalListModal } from '../components/appointments/HospitalListModal';
import { AppointmentRemindersModal } from '../components/appointments/AppointmentRemindersModal';
import { SendDoctorMessageModal } from '../components/appointments/SendDoctorMessageModal';
import { RecordViewerModal } from '../components/records/RecordViewerModal';

export const AppointmentsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // URL state synchronization
  const [activeTab, setActiveTab] = useState<AppointmentTab>(
    (searchParams.get('tab') as AppointmentTab) || 'Upcoming'
  );
  const searchQuery = searchParams.get('search') || '';
  const [sort, setSort] = useState<'earliest' | 'latest' | 'doctor_asc' | 'status'>(
    (searchParams.get('sort') as any) || 'earliest'
  );
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>(
    searchParams.get('specialty') || 'All'
  );
  const [selectedDoctorFilter, setSelectedDoctorFilter] = useState<string>(
    searchParams.get('doctor') || 'All'
  );
  const [selectedHospitalFilter, setSelectedHospitalFilter] = useState<string>(
    searchParams.get('hospital') || 'All'
  );
  const [selectedDate, setSelectedDate] = useState<string | null>(
    searchParams.get('date') || null
  );

  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  // Data State
  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);
  const [summary, setSummary] = useState<AppointmentSummaryStats | null>(null);
  const [doctorMessages, setDoctorMessages] = useState<DoctorHealthMessage[]>([]);
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const page = 1;
  const pageSize = 10;

  const [loading, setLoading] = useState<boolean>(true);
  const [summaryLoading, setSummaryLoading] = useState<boolean>(true);
  const [messagesLoading, setMessagesLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Modal States
  const [isBookOpen, setIsBookOpen] = useState<boolean>(false);
  const [selectedDoctorForBooking, setSelectedDoctorForBooking] = useState<DoctorItem | null>(null);
  const [initialBookingSpecialty, setInitialBookingSpecialty] = useState<string>('General Physician');

  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentItem | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState<boolean>(false);
  const [isRescheduleOpen, setIsRescheduleOpen] = useState<boolean>(false);
  const [isCancelOpen, setIsCancelOpen] = useState<boolean>(false);
  const [isFilterOpen, setIsFilterOpen] = useState<boolean>(false);
  const [isFindDoctorOpen, setIsFindDoctorOpen] = useState<boolean>(false);
  const [isHospitalListOpen, setIsHospitalListOpen] = useState<boolean>(false);
  const [isRemindersOpen, setIsRemindersOpen] = useState<boolean>(false);

  // Doctor Messaging Modal
  const [isSendMessageOpen, setIsSendMessageOpen] = useState<boolean>(false);
  const [messageTargetDoctor, setMessageTargetDoctor] = useState<string | undefined>(undefined);
  const [messageTargetAptId, setMessageTargetAptId] = useState<string | undefined>(undefined);

  // Record Viewer Modal
  const [viewerRecord, setViewerRecord] = useState<MedicalRecordItem | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState<boolean>(false);

  // Update URL params
  useEffect(() => {
    const params: Record<string, string> = { tab: activeTab };
    if (searchQuery) params.search = searchQuery;
    if (sort !== 'earliest') params.sort = sort;
    if (selectedSpecialty !== 'All') params.specialty = selectedSpecialty;
    if (selectedDoctorFilter !== 'All') params.doctor = selectedDoctorFilter;
    if (selectedHospitalFilter !== 'All') params.hospital = selectedHospitalFilter;
    if (selectedDate) params.date = selectedDate;
    setSearchParams(params, { replace: true });
  }, [
    activeTab,
    searchQuery,
    sort,
    selectedSpecialty,
    selectedDoctorFilter,
    selectedHospitalFilter,
    selectedDate,
    setSearchParams,
  ]);

  // Load Appointments List
  const fetchAppointments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await appointmentsService.getAppointments({
        tab: activeTab,
        search: searchQuery,
        sort,
        specialty: selectedSpecialty,
        doctor: selectedDoctorFilter,
        hospital: selectedHospitalFilter,
        date: selectedDate || undefined,
        page,
        page_size: pageSize,
      });

      setAppointments(data.appointments);
      setTotalCount(data.total_count);
      setLoading(false);
    } catch (err: any) {
      console.error('Failed to load appointments:', err);
      setError(
        err?.response?.data?.message ||
          'Unable to retrieve appointments from the server.'
      );
      setLoading(false);
    }
  }, [
    activeTab,
    searchQuery,
    sort,
    selectedSpecialty,
    selectedDoctorFilter,
    selectedHospitalFilter,
    selectedDate,
    page,
    pageSize,
  ]);

  // Load Summary Stats
  const fetchSummary = useCallback(async () => {
    try {
      setSummaryLoading(true);
      const sum = await appointmentsService.getSummary();
      setSummary(sum);
    } catch (err) {
      console.error('Failed to load summary stats:', err);
    } finally {
      setSummaryLoading(false);
    }
  }, []);

  // Load Doctor Health Messages
  const fetchDoctorMessages = useCallback(async () => {
    try {
      setMessagesLoading(true);
      const msgs = await appointmentsService.getAllDoctorMessages();
      setDoctorMessages(msgs);
    } catch (err) {
      console.error('Failed to load doctor messages:', err);
    } finally {
      setMessagesLoading(false);
    }
  }, []);

  // Load Recommendations
  const fetchRecommendations = useCallback(async () => {
    try {
      const recs = await appointmentsService.getRecommendations();
      setRecommendations(recs);
    } catch (err) {
      console.error('Failed to load recommendations:', err);
    }
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  useEffect(() => {
    fetchSummary();
    fetchRecommendations();
    fetchDoctorMessages();
  }, [fetchSummary, fetchRecommendations, fetchDoctorMessages]);

  const handleRefreshAll = () => {
    fetchAppointments();
    fetchSummary();
    fetchDoctorMessages();
  };

  // Actions
  const handleOpenBookModal = (specialty?: string, doctor?: DoctorItem) => {
    setInitialBookingSpecialty(specialty || 'General Physician');
    setSelectedDoctorForBooking(doctor || null);
    setIsBookOpen(true);
  };

  const handleViewDetails = (apt: AppointmentItem) => {
    setSelectedAppointment(apt);
    setIsDetailsOpen(true);
  };

  const handleOpenReschedule = (apt: AppointmentItem) => {
    setSelectedAppointment(apt);
    setIsRescheduleOpen(true);
  };

  const handleOpenCancel = (apt: AppointmentItem) => {
    setSelectedAppointment(apt);
    setIsCancelOpen(true);
  };

  const handleOpenSendMessage = (doctorName?: string, appointmentId?: string) => {
    setMessageTargetDoctor(doctorName);
    setMessageTargetAptId(appointmentId);
    setIsSendMessageOpen(true);
  };

  const handleMarkMessageRead = async (messageId: string) => {
    try {
      await appointmentsService.markMessageRead(messageId);
      fetchDoctorMessages();
    } catch (e) {
      console.error('Failed to mark message read:', e);
    }
  };

  const handleOpenRecordViewer = async (recordId: string) => {
    try {
      const rec = await recordsService.getRecordById(recordId);
      setViewerRecord(rec);
      setIsViewerOpen(true);
    } catch (e) {
      console.error('Failed to load record details:', e);
    }
  };

  const handleBookRecommendation = (rec: RecommendationItem) => {
    handleOpenBookModal(rec.specialty);
  };

  const activeFilterCount =
    (selectedSpecialty !== 'All' ? 1 : 0) +
    (selectedDoctorFilter !== 'All' ? 1 : 0) +
    (selectedHospitalFilter !== 'All' ? 1 : 0);

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* 1. Header Tabs + CTA Button */}
      <AppointmentTabs
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          setSelectedDate(null);
        }}
        onBookAppointment={() => handleOpenBookModal()}
      />

      {/* 2. Summary Statistics (4 Cards) */}
      <AppointmentSummaryCards summary={summary} loading={summaryLoading} />

      {/* 3. Main Content Grid (8 Col Left / 4 Col Right on Desktop) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 8 Columns (Toolbar, Appointments List, Doctor Health Messages, Recommendations, Health Tip) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Main Appointment Section */}
          <div className="space-y-4">
            <AppointmentToolbar
              activeTab={activeTab}
              sort={sort}
              onSortChange={setSort}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              onOpenFilter={() => setIsFilterOpen(true)}
              activeFilterCount={activeFilterCount}
            />

            <AppointmentList
              appointments={appointments}
              loading={loading}
              error={error}
              activeTab={activeTab}
              viewMode={viewMode}
              onRetry={fetchAppointments}
              onBookAppointment={() => handleOpenBookModal()}
              onViewDetails={handleViewDetails}
              onReschedule={handleOpenReschedule}
              onCancel={handleOpenCancel}
              onDateClick={(dateStr) => setSelectedDate(dateStr)}
              totalCount={totalCount}
            />
          </div>

          {/* Doctor's Health Advice & Care Instructions Section */}
          <DoctorMessagesSection
            messages={doctorMessages}
            loading={messagesLoading}
            onOpenSendMessage={(doc) => handleOpenSendMessage(doc)}
            onMarkRead={handleMarkMessageRead}
          />

          {/* Recommended for You Section */}
          <RecommendationsSection
            recommendations={recommendations}
            onBookRecommendation={handleBookRecommendation}
          />

          {/* Health Tip Banner */}
          <HealthTipBanner />
        </div>

        {/* Right 4 Columns (Calendar, Quick Actions, Support) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Calendar Panel */}
          <CalendarPanel
            selectedDate={selectedDate}
            onSelectDate={(date) => setSelectedDate(date)}
          />

          {/* Quick Actions */}
          <QuickActionsCard
            onBookAppointment={() => handleOpenBookModal()}
            onFindDoctor={() => setIsFindDoctorOpen(true)}
            onViewHospitals={() => setIsHospitalListOpen(true)}
            onManageReminders={() => setIsRemindersOpen(true)}
          />

          {/* Support Panel (Important Note & Need Help?) */}
          <SupportPanel />
        </div>
      </div>

      {/* MODALS */}
      {/* 1. Book Appointment Wizard */}
      <BookAppointmentModal
        isOpen={isBookOpen}
        onClose={() => {
          setIsBookOpen(false);
          setSelectedDoctorForBooking(null);
        }}
        onSuccess={handleRefreshAll}
        initialSpecialty={initialBookingSpecialty}
        initialDoctor={selectedDoctorForBooking}
      />

      {/* 2. Appointment Details Modal */}
      <AppointmentDetailsModal
        appointment={selectedAppointment}
        isOpen={isDetailsOpen}
        onClose={() => {
          setIsDetailsOpen(false);
          setSelectedAppointment(null);
        }}
        onReschedule={handleOpenReschedule}
        onCancel={handleOpenCancel}
        onOpenRecord={handleOpenRecordViewer}
        onOpenSendMessage={handleOpenSendMessage}
      />

      {/* 3. Reschedule Modal */}
      <RescheduleAppointmentModal
        appointment={selectedAppointment}
        isOpen={isRescheduleOpen}
        onClose={() => {
          setIsRescheduleOpen(false);
          setSelectedAppointment(null);
        }}
        onSuccess={handleRefreshAll}
      />

      {/* 4. Cancel Appointment Confirmation Modal */}
      <CancelAppointmentModal
        appointment={selectedAppointment}
        isOpen={isCancelOpen}
        onClose={() => {
          setIsCancelOpen(false);
          setSelectedAppointment(null);
        }}
        onSuccess={handleRefreshAll}
      />

      {/* 5. Filter Modal */}
      <FilterAppointmentsModal
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        selectedSpecialty={selectedSpecialty}
        selectedDoctor={selectedDoctorFilter}
        selectedHospital={selectedHospitalFilter}
        onApply={(spec, doc, hosp) => {
          setSelectedSpecialty(spec);
          setSelectedDoctorFilter(doc);
          setSelectedHospitalFilter(hosp);
        }}
        onReset={() => {
          setSelectedSpecialty('All');
          setSelectedDoctorFilter('All');
          setSelectedHospitalFilter('All');
        }}
      />

      {/* 6. Find Doctor Directory */}
      <FindDoctorModal
        isOpen={isFindDoctorOpen}
        onClose={() => setIsFindDoctorOpen(false)}
        onSelectDoctorToBook={(doc) => {
          handleOpenBookModal(doc.specialty, doc);
        }}
      />

      {/* 7. Hospital List Directory */}
      <HospitalListModal
        isOpen={isHospitalListOpen}
        onClose={() => setIsHospitalListOpen(false)}
      />

      {/* 8. Appointment Reminders Config */}
      <AppointmentRemindersModal
        isOpen={isRemindersOpen}
        onClose={() => setIsRemindersOpen(false)}
      />

      {/* 9. Send Doctor Message Modal */}
      <SendDoctorMessageModal
        isOpen={isSendMessageOpen}
        onClose={() => setIsSendMessageOpen(false)}
        onSuccess={() => {
          fetchDoctorMessages();
          fetchAppointments();
        }}
        initialDoctorName={messageTargetDoctor}
        appointmentId={messageTargetAptId}
      />

      {/* 10. Record Viewer Modal */}
      {viewerRecord && (
        <RecordViewerModal
          isOpen={isViewerOpen}
          onClose={() => {
            setIsViewerOpen(false);
            setViewerRecord(null);
          }}
          record={viewerRecord}
        />
      )}
    </div>
  );
};
