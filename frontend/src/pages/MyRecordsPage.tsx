import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText,
  UploadCloud,
  Sparkles,
  Bot,
  Mic,
  Clock,
  Folder,
  Search,
  Filter,
  Trash2,
  Share2,
  RefreshCw,
  Plus,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  GitCompare
} from 'lucide-react';

import { SessionsView } from '../components/records/SessionsView';
import { AIHistoryView } from '../components/records/AIHistoryView';
import { VoiceHistoryView } from '../components/records/VoiceHistoryView';
import { HealthTimelineView } from '../components/records/HealthTimelineView';

import { UploadRecordModal } from '../components/records/UploadRecordModal';
import { RecordViewerModal } from '../components/records/RecordViewerModal';
import { ShareRecordModal } from '../components/records/ShareRecordModal';
import { DeletedRecordsModal } from '../components/records/DeletedRecordsModal';
import { ComprehensiveSummaryModal } from '../components/records/ComprehensiveSummaryModal';
import { ParameterTrendModal } from '../components/records/ParameterTrendModal';
import { ReportComparisonModal } from '../components/records/ReportComparisonModal';
import { StorageUsageCard } from '../components/records/StorageUsageCard';

import { recordsService } from '../services/recordsService';
import type {
  MedicalRecordItem,
  SessionGroupItem,
  RecordSummaryStats,
  RecordsTab
} from '../types/records';

export const MyRecordsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<RecordsTab>('uploaded');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Data State
  const [sessions, setSessions] = useState<SessionGroupItem[]>([]);
  const [summary, setSummary] = useState<RecordSummaryStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [summaryLoading, setSummaryLoading] = useState<boolean>(true);

  // Modals State
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedSessionForUpload, setSelectedSessionForUpload] = useState<string | undefined>();
  const [viewingRecord, setViewingRecord] = useState<MedicalRecordItem | null>(null);
  const [sharingRecord, setSharingRecord] = useState<MedicalRecordItem | null>(null);
  const [trashModalOpen, setTrashModalOpen] = useState(false);
  const [summaryModalOpen, setSummaryModalOpen] = useState(false);
  const [trendModalOpen, setTrendModalOpen] = useState(false);
  const [selectedTrendParam, setSelectedTrendParam] = useState<string>('hba1c');
  const [compareModalOpen, setCompareModalOpen] = useState(false);

  // Fetch Summary & Sessions
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setSummaryLoading(true);
      const [sessionsRes, summaryRes] = await Promise.all([
        recordsService.getSessions(),
        recordsService.getSummary()
      ]);
      setSessions(sessionsRes || []);
      setSummary(summaryRes);
    } catch (err: any) {
      console.error('Failed to load records data:', err);
    } finally {
      setLoading(false);
      setSummaryLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRecordUploaded = (newRecord: MedicalRecordItem) => {
    loadData();
    setViewingRecord(newRecord);
  };

  const handleRecordUpdated = (updated: MedicalRecordItem) => {
    loadData();
    setViewingRecord(updated);
  };

  const handleOpenTrendForParam = (paramName: string) => {
    setSelectedTrendParam(paramName);
    setTrendModalOpen(true);
  };

  const allUploadedRecords = sessions.flatMap((s) => s.records);
  const existingSessionNames = Array.from(new Set(sessions.map((s) => s.session_name)));

  return (
    <div className="min-h-screen bg-slate-50/50 pb-16">
      {/* Top Header Banner */}
      <div className="bg-white border-b border-slate-200/80 px-4 sm:px-8 py-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
              <FileText className="w-6 h-6 text-teal-600" />
              Medical Records
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Dynamic medical report discovery, parameter extraction, and complete health history.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => setTrendModalOpen(true)}
              className="px-3.5 py-2.5 bg-white hover:bg-teal-50 text-teal-700 border border-teal-200 hover:border-teal-300 rounded-xl text-xs font-bold shadow-sm transition flex items-center gap-1.5"
            >
              <TrendingUp className="w-4 h-4 text-teal-600" />
              <span>Biomarker Trends</span>
            </button>

            <button
              onClick={() => setCompareModalOpen(true)}
              className="px-3.5 py-2.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 hover:border-slate-300 rounded-xl text-xs font-bold shadow-sm transition flex items-center gap-1.5"
            >
              <GitCompare className="w-4 h-4 text-slate-600" />
              <span>Compare Reports</span>
            </button>

            <button
              onClick={() => setSummaryModalOpen(true)}
              className="px-4 py-2.5 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-xl text-xs font-bold shadow-sm transition flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-teal-600" />
              <span>Doctor Pre-Consultation Summary</span>
            </button>

            <button
              onClick={() => {
                setSelectedSessionForUpload(undefined);
                setUploadModalOpen(true);
              }}
              className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-sm hover:shadow transition flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Upload Medical Document</span>
            </button>

            <button
              onClick={() => setTrashModalOpen(true)}
              className="p-2.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-500 hover:text-slate-700 transition"
              title="Recycle Bin"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-6 space-y-6">
        {/* Storage Summary Bar */}
        {summary && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Records</p>
                <p className="text-xl font-bold text-slate-900 mt-0.5">{summary.total_records}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
                <FileText className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Patient Verified</p>
                <p className="text-xl font-bold text-emerald-600 mt-0.5">{summary.approved_records || 0}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Review Required</p>
                <p className="text-xl font-bold text-amber-600 mt-0.5">{summary.pending_review_records || 0}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                <AlertTriangle className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Storage Capacity</p>
                <p className="text-xl font-bold text-slate-900 mt-0.5">{summary.storage_percentage}%</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
                <ShieldCheck className="w-5 h-5" />
              </div>
            </div>
          </div>
        )}

        {/* Tab Navigation Controls */}
        <div className="bg-white rounded-2xl p-2 border border-slate-200/80 shadow-sm flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <button
              onClick={() => setActiveTab('uploaded')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                activeTab === 'uploaded'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Folder className="w-4 h-4" />
              <span>Uploaded History by Sessions</span>
            </button>

            <button
              onClick={() => setActiveTab('ai_history')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                activeTab === 'ai_history'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Bot className="w-4 h-4" />
              <span>AI History</span>
            </button>

            <button
              onClick={() => setActiveTab('voice_history')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                activeTab === 'voice_history'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Mic className="w-4 h-4" />
              <span>Voice History</span>
            </button>

            <button
              onClick={() => setActiveTab('timeline')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                activeTab === 'timeline'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>Unified Health Timeline</span>
            </button>
          </div>

          <button
            onClick={loadData}
            disabled={loading}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Tab Content Display */}
        <div>
          {activeTab === 'uploaded' && (
            <SessionsView
              sessions={sessions}
              loading={loading}
              onViewRecord={(record: MedicalRecordItem) => setViewingRecord(record)}
              onUploadToSession={(sessionName: string) => {
                setSelectedSessionForUpload(sessionName);
                setUploadModalOpen(true);
              }}
            />
          )}

          {activeTab === 'ai_history' && <AIHistoryView />}

          {activeTab === 'voice_history' && <VoiceHistoryView />}

          {activeTab === 'timeline' && <HealthTimelineView />}
        </div>
      </div>

      {/* MODALS */}
      {uploadModalOpen && (
        <UploadRecordModal
          isOpen={uploadModalOpen}
          onClose={() => setUploadModalOpen(false)}
          onSuccess={handleRecordUploaded}
          existingSessions={existingSessionNames}
        />
      )}

      {viewingRecord && (
        <RecordViewerModal
          record={viewingRecord}
          isOpen={!!viewingRecord}
          onClose={() => setViewingRecord(null)}
          onRecordUpdated={handleRecordUpdated}
          onShare={(rec) => setSharingRecord(rec)}
          onOpenTrend={handleOpenTrendForParam}
        />
      )}

      {sharingRecord && (
        <ShareRecordModal
          record={sharingRecord}
          isOpen={!!sharingRecord}
          onClose={() => setSharingRecord(null)}
          onSuccess={() => {
            setSharingRecord(null);
            loadData();
          }}
        />
      )}

      {trashModalOpen && (
        <DeletedRecordsModal
          isOpen={trashModalOpen}
          onClose={() => setTrashModalOpen(false)}
          onRefreshParent={loadData}
        />
      )}

      {summaryModalOpen && (
        <ComprehensiveSummaryModal
          isOpen={summaryModalOpen}
          onClose={() => setSummaryModalOpen(false)}
        />
      )}

      {trendModalOpen && (
        <ParameterTrendModal
          initialParameter={selectedTrendParam}
          isOpen={trendModalOpen}
          onClose={() => setTrendModalOpen(false)}
        />
      )}

      {compareModalOpen && (
        <ReportComparisonModal
          records={allUploadedRecords}
          isOpen={compareModalOpen}
          onClose={() => setCompareModalOpen(false)}
        />
      )}
    </div>
  );
};
