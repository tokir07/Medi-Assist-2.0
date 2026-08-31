import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { prescriptionsService } from '../services/prescriptionsService';
import { recordsService } from '../services/recordsService';
import type {
  PrescriptionItem,
  PrescriptionSummaryStats,
  MedicationReminderItem,
  PrescriptionTab,
} from '../types/prescriptions';
import type { MedicalRecordItem } from '../types/records';

import { PrescriptionStatusTabs } from '../components/prescriptions/PrescriptionStatusTabs';
import { PrescriptionSummaryCards } from '../components/prescriptions/PrescriptionSummaryCards';
import { PrescriptionToolbar } from '../components/prescriptions/PrescriptionToolbar';
import { PrescriptionList } from '../components/prescriptions/PrescriptionList';
import { PrescriptionPagination } from '../components/prescriptions/PrescriptionPagination';
import { MedicationRemindersCard } from '../components/prescriptions/MedicationRemindersCard';
import { PrescriptionQuickActionsCard } from '../components/prescriptions/PrescriptionQuickActionsCard';
import { PrescriptionImportantNoteCard } from '../components/prescriptions/PrescriptionImportantNoteCard';

import { AddPrescriptionModal } from '../components/prescriptions/AddPrescriptionModal';
import { UploadPrescriptionModal } from '../components/prescriptions/UploadPrescriptionModal';
import { PrescriptionDetailsDrawer } from '../components/prescriptions/PrescriptionDetailsDrawer';
import { AddReminderModal } from '../components/prescriptions/AddReminderModal';
import { RequestRefillModal } from '../components/prescriptions/RequestRefillModal';
import { RequestPrescriptionModal } from '../components/prescriptions/RequestPrescriptionModal';
import { FilterPrescriptionsModal } from '../components/prescriptions/FilterPrescriptionsModal';
import { MedicationListModal } from '../components/prescriptions/MedicationListModal';
import { RecordViewerModal } from '../components/records/RecordViewerModal';

export const PrescriptionsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Filter & Pagination State
  const [activeTab, setActiveTab] = useState<PrescriptionTab>(
    (searchParams.get('tab') as PrescriptionTab) || 'All Prescriptions'
  );
  const [searchQuery, setSearchQuery] = useState<string>(searchParams.get('search') || '');
  const [sort, setSort] = useState<'latest' | 'oldest' | 'name_asc' | 'name_desc'>(
    (searchParams.get('sort') as any) || 'latest'
  );
  const [currentPage, setCurrentPage] = useState<number>(
    Number(searchParams.get('page')) || 1
  );
  const [pageSize, setPageSize] = useState<number>(
    Number(searchParams.get('pageSize')) || 6
  );
  const [doctorFilter, setDoctorFilter] = useState<string>(searchParams.get('doctor') || 'All');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  // Data State
  const [prescriptions, setPrescriptions] = useState<PrescriptionItem[]>([]);
  const [summary, setSummary] = useState<PrescriptionSummaryStats | null>(null);
  const [reminders, setReminders] = useState<MedicationReminderItem[]>([]);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);

  const [loading, setLoading] = useState<boolean>(true);
  const [summaryLoading, setSummaryLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [isAddManualOpen, setIsAddManualOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState<PrescriptionItem | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  
  // Reminders Modal
  const [isAddReminderOpen, setIsAddReminderOpen] = useState(false);
  const [reminderPrescription, setReminderPrescription] = useState<PrescriptionItem | null>(null);
  const [reminderMedName, setReminderMedName] = useState<string>('');
  const [reminderDosage, setReminderDosage] = useState<string>('');

  // Refills & Requests
  const [isRefillOpen, setIsRefillOpen] = useState(false);
  const [refillPrescription, setRefillPrescription] = useState<PrescriptionItem | null>(null);
  const [isRequestPrescriptionOpen, setIsRequestPrescriptionOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isMedListOpen, setIsMedListOpen] = useState(false);

  // Connected Record Viewer Modal
  const [viewerRecord, setViewerRecord] = useState<MedicalRecordItem | null>(null);
  const [isRecordViewerOpen, setIsRecordViewerOpen] = useState(false);

  // Load Prescriptions List
  const fetchPrescriptions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await prescriptionsService.getPrescriptions({
        tab: activeTab,
        search: searchQuery,
        sort,
        page: currentPage,
        page_size: pageSize,
        doctor: doctorFilter !== 'All' ? doctorFilter : undefined,
      });

      setPrescriptions(data.prescriptions);
      setTotalPages(data.total_pages);
      setTotalCount(data.total_count);
      setLoading(false);
    } catch (err: any) {
      console.error('Failed to load prescriptions:', err);
      setError(err?.response?.data?.message || 'Unable to retrieve prescriptions from the server.');
      setLoading(false);
    }
  }, [activeTab, searchQuery, sort, currentPage, pageSize, doctorFilter]);

  // Load Summary Stats
  const fetchSummary = useCallback(async () => {
    try {
      setSummaryLoading(true);
      const sum = await prescriptionsService.getSummary();
      setSummary(sum);
      setSummaryLoading(false);
    } catch (err) {
      console.warn('Failed to load prescription summary:', err);
      setSummaryLoading(false);
    }
  }, []);

  // Load Reminders
  const fetchReminders = useCallback(async () => {
    try {
      const rems = await prescriptionsService.getReminders();
      setReminders(rems);
    } catch (err) {
      console.warn('Failed to load medication reminders:', err);
    }
  }, []);

  useEffect(() => {
    fetchPrescriptions();
  }, [fetchPrescriptions]);

  useEffect(() => {
    fetchSummary();
    fetchReminders();
  }, [fetchSummary, fetchReminders]);

  // Handle reminder check toggles
  const handleToggleReminder = async (id: string) => {
    setReminders((prev) =>
      prev.map((r) => (r.id === id ? { ...r, is_taken: !r.is_taken } : r))
    );
    try {
      await prescriptionsService.toggleReminder(id);
    } catch (err) {
      console.error('Failed to toggle reminder:', err);
      fetchReminders();
    }
  };

  // Actions
  const handleView = (p: PrescriptionItem) => {
    setSelectedPrescription(p);
    setIsDetailsOpen(true);
  };

  const handleOpenRecord = async (recordId: string) => {
    try {
      const rec = await recordsService.getRecordById(recordId);
      setViewerRecord(rec);
      setIsRecordViewerOpen(true);
    } catch (err) {
      console.error('Failed to fetch source record:', err);
    }
  };

  const handleDownload = (p: PrescriptionItem) => {
    if (p.document_file_path && p.record_id) {
      window.open(`/api/records/${p.record_id}/file`, '_blank');
    } else {
      const medsList = (p.medications || []).map(
        (m) => `• ${m.medication_name}: ${m.dosage} (${m.frequency}) - ${m.duration}\n  Instructions: ${m.instructions || 'N/A'}`
      ).join('\n');

      const content =
        `MEDIASSIST PRESCRIPTION RECORD\n` +
        `========================================\n` +
        `Prescription: ${p.title || p.medication_name}\n` +
        `Doctor: ${p.doctor_name} (${p.doctor_specialty})\n` +
        `Facility: ${p.hospital}\n` +
        `Date: ${p.prescribed_date}\n` +
        `Status: ${p.status}\n` +
        `Provenance: ${p.provenance}\n\n` +
        `PRESCRIBED MEDICATIONS:\n${medsList || p.medication_name}\n\n` +
        `Clinical Notes: ${p.notes || 'None'}\n`;

      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Prescription_${p.doctor_name.replace(/\s+/g, '_')}_${p.prescribed_date.replace(/[/\\?%*:|"<>]/g, '_')}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleSetReminder = (p: PrescriptionItem, medName?: string, dosage?: string) => {
    setReminderPrescription(p);
    setReminderMedName(medName || p.medication_name);
    setReminderDosage(dosage || p.dosage);
    setIsAddReminderOpen(true);
  };

  const handleRequestRefill = (p: PrescriptionItem) => {
    setRefillPrescription(p);
    setIsRefillOpen(true);
  };

  const handleShare = (p: PrescriptionItem) => {
    setSelectedPrescription(p);
    setIsDetailsOpen(true);
  };

  const handleDelete = async (p: PrescriptionItem) => {
    if (window.confirm(`Are you sure you want to remove prescription from ${p.doctor_name}?`)) {
      try {
        await prescriptionsService.deletePrescription(p.id);
        fetchPrescriptions();
        fetchSummary();
      } catch (err) {
        console.error('Failed to delete prescription:', err);
      }
    }
  };

  return (
    <div className="space-y-6 pb-10 animate-fadeIn">
      {/* 1. Category / Status Tabs + Add & Upload Actions */}
      <PrescriptionStatusTabs
        activeTab={activeTab}
        onSelectTab={(t) => {
          setActiveTab(t);
          setCurrentPage(1);
        }}
        onOpenAddManual={() => setIsAddManualOpen(true)}
        onOpenUpload={() => setIsUploadOpen(true)}
      />

      {/* 2. Top Summary Stat Cards */}
      <PrescriptionSummaryCards summary={summary} loading={summaryLoading} />

      {/* 3. Main 2-Column Desktop Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 8 Columns: Prescriptions Workspace */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-4">
          {/* Header Toolbar */}
          <PrescriptionToolbar
            sort={sort}
            onSelectSort={(s) => setSort(s)}
            viewMode={viewMode}
            onToggleViewMode={(m) => setViewMode(m)}
            onOpenFilter={() => setIsFilterOpen(true)}
            hasActiveFilters={doctorFilter !== 'All' || activeTab !== 'All Prescriptions'}
          />

          {/* Prescriptions List */}
          <PrescriptionList
            prescriptions={prescriptions}
            loading={loading}
            error={error}
            onRetry={fetchPrescriptions}
            onView={handleView}
            onOpenRecord={handleOpenRecord}
            onDownload={handleDownload}
            onSetReminder={handleSetReminder}
            onRequestRefill={handleRequestRefill}
            onShare={handleShare}
            onDelete={handleDelete}
            onOpenUpload={() => setIsUploadOpen(true)}
            onOpenAddManual={() => setIsAddManualOpen(true)}
          />

          {/* Pagination */}
          {!loading && prescriptions.length > 0 && (
            <PrescriptionPagination
              currentPage={currentPage}
              totalPages={totalPages}
              pageSize={pageSize}
              onPageChange={(p) => setCurrentPage(p)}
              onPageSizeChange={(ps) => {
                setPageSize(ps);
                setCurrentPage(1);
              }}
            />
          )}
        </div>

        {/* Right 4 Columns: Utility Panel */}
        <div className="lg:col-span-4 space-y-5">
          {/* 1. Medication Reminders */}
          <MedicationRemindersCard
            reminders={reminders}
            onToggleReminder={handleToggleReminder}
            onAddReminder={() => {
              setReminderPrescription(null);
              setReminderMedName('');
              setReminderDosage('');
              setIsAddReminderOpen(true);
            }}
            onViewAll={() => setIsMedListOpen(true)}
          />

          {/* 2. Quick Actions */}
          <PrescriptionQuickActionsCard
            onUploadNew={() => setIsUploadOpen(true)}
            onRequestPrescription={() => setIsRequestPrescriptionOpen(true)}
            onRequestRefill={() => {
              if (prescriptions.length > 0) {
                setRefillPrescription(prescriptions[0]);
                setIsRefillOpen(true);
              }
            }}
            onViewMedicationList={() => setIsMedListOpen(true)}
          />

          {/* 3. Important Safety Note */}
          <PrescriptionImportantNoteCard />
        </div>
      </div>

      {/* Manual Prescription Modal */}
      <AddPrescriptionModal
        isOpen={isAddManualOpen}
        onClose={() => setIsAddManualOpen(false)}
        onPrescriptionAdded={(newP) => {
          fetchPrescriptions();
          fetchSummary();
          setSelectedPrescription(newP);
          setIsDetailsOpen(true);
        }}
      />

      {/* Upload Prescription Modal */}
      <UploadPrescriptionModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onSuccess={() => {
          fetchPrescriptions();
          fetchSummary();
        }}
      />

      {/* Prescription Details Drawer */}
      <PrescriptionDetailsDrawer
        prescription={selectedPrescription}
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        onOpenRecord={handleOpenRecord}
        onDownload={handleDownload}
        onShare={handleShare}
        onSetReminder={(p, medName, dosage) => handleSetReminder(p, medName, dosage)}
        onRequestRefill={handleRequestRefill}
        onUpdated={(updated) => {
          setSelectedPrescription(updated);
          fetchPrescriptions();
          fetchSummary();
        }}
      />

      {/* Add Reminder Modal */}
      <AddReminderModal
        isOpen={isAddReminderOpen}
        initialPrescription={reminderPrescription}
        initialMedicationName={reminderMedName}
        initialDosage={reminderDosage}
        onClose={() => setIsAddReminderOpen(false)}
        onSuccess={() => {
          fetchReminders();
        }}
      />

      {/* Request Refill Modal */}
      <RequestRefillModal
        prescription={refillPrescription}
        isOpen={isRefillOpen}
        onClose={() => setIsRefillOpen(false)}
        onSuccess={() => {
          fetchPrescriptions();
          fetchSummary();
        }}
      />

      {/* Request Prescription Modal */}
      <RequestPrescriptionModal
        isOpen={isRequestPrescriptionOpen}
        onClose={() => setIsRequestPrescriptionOpen(false)}
        onSuccess={() => {
          fetchPrescriptions();
          fetchSummary();
        }}
      />

      {/* Filter Modal */}
      <FilterPrescriptionsModal
        isOpen={isFilterOpen}
        selectedDoctor={doctorFilter}
        onSelectDoctor={(doc) => {
          setDoctorFilter(doc);
          setCurrentPage(1);
        }}
        selectedTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          setCurrentPage(1);
        }}
        onReset={() => {
          setActiveTab('All Prescriptions');
          setDoctorFilter('All');
          setCurrentPage(1);
        }}
        onClose={() => setIsFilterOpen(false)}
      />

      {/* Master Medication List Modal */}
      <MedicationListModal
        isOpen={isMedListOpen}
        prescriptions={prescriptions}
        onClose={() => setIsMedListOpen(false)}
        onSelectPrescription={(p) => handleView(p)}
      />

      {/* Connected Source Medical Record Viewer Modal */}
      {isRecordViewerOpen && viewerRecord && (
        <RecordViewerModal
          record={viewerRecord}
          isOpen={isRecordViewerOpen}
          onClose={() => setIsRecordViewerOpen(false)}
          onRecordUpdated={(updated) => {
            setViewerRecord(updated);
            fetchPrescriptions();
          }}
        />
      )}
    </div>
  );
};
