import React, { useState, useEffect } from 'react';
import {
  X,
  Download,
  Share2,
  Calendar,
  User,
  Building2,
  FileText,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Edit3,
  Sparkles,
  ShieldCheck,
  ZoomIn,
  ZoomOut,
  Clock,
  Pill,
  Activity,
  Save,
  RotateCcw,
  Loader2,
  Filter,
  Eye,
  BookOpen,
  Info,
  TrendingUp,
  Copy,
  Check,
  RefreshCw,
  Stethoscope
} from 'lucide-react';
import { api } from '../../services/api';
import { recordsService } from '../../services/recordsService';
import { generateMedicalReportPdf } from '../../utils/pdfExport';
import type { MedicalRecordItem, StructuredExtractedData, ExtractedParameter } from '../../types/records';

interface RecordViewerModalProps {
  record: MedicalRecordItem | null;
  isOpen: boolean;
  onClose: () => void;
  onRecordUpdated?: (updated: MedicalRecordItem) => void;
  onShare?: (record: MedicalRecordItem) => void;
  onOpenTrend?: (parameterName: string) => void;
}

export const RecordViewerModal: React.FC<RecordViewerModalProps> = ({
  record,
  isOpen,
  onClose,
  onRecordUpdated,
  onShare,
  onOpenTrend
}) => {
  if (!isOpen || !record) return null;

  const [currentRecord, setCurrentRecord] = useState<MedicalRecordItem>(record);
  const [zoom, setZoom] = useState<number>(100);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isActionLoading, setIsActionLoading] = useState<boolean>(false);

  // Authenticated Blob Preview State
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loadingFile, setLoadingFile] = useState<boolean>(true);
  const [fileError, setFileError] = useState<string | null>(null);

  // Navigation Tabs & Filter
  const [filterOutOfRange, setFilterOutOfRange] = useState<boolean>(false);
  const [activeRightTab, setActiveRightTab] = useState<'summary' | 'parameters' | 'observations' | 'explain'>('summary');
  const [sourcePopover, setSourcePopover] = useState<{ name: string; text: string; page?: number } | null>(null);

  // Summary State
  const [summaryQuick, setSummaryQuick] = useState<string>(currentRecord.summary_quick || '');
  const [summaryDetailed, setSummaryDetailed] = useState<string>(currentRecord.summary_detailed || '');
  const [summaryStatus, setSummaryStatus] = useState<string>(currentRecord.summary_status || 'NOT_GENERATED');
  const [summaryVersion, setSummaryVersion] = useState<number>(currentRecord.summary_version || 1);
  const [loadingSummary, setLoadingSummary] = useState<boolean>(false);
  const [copiedSummary, setCopiedSummary] = useState<boolean>(false);

  // Summary Mode & Patient-Friendly Plain Language State
  const [summaryMode, setSummaryMode] = useState<'plain' | 'clinical'>('plain');
  const [copiedQuestions, setCopiedQuestions] = useState<boolean>(false);

  // Layman AI State
  const [explanation, setExplanation] = useState<string | null>(null);
  const [loadingExplanation, setLoadingExplanation] = useState<boolean>(false);

  // Editable Form State
  const extracted: StructuredExtractedData = currentRecord.extracted_data || {};
  const [editableParams, setEditableParams] = useState<ExtractedParameter[]>(extracted.parameters || []);
  const [editDiagnosis, setEditDiagnosis] = useState<string>(extracted.primary_diagnosis_or_indication || '');
  const [editDoctor, setEditDoctor] = useState<string>(extracted.doctor_name || currentRecord.doctor_name || '');
  const [editHospital, setEditHospital] = useState<string>(extracted.hospital_name || currentRecord.hospital || '');
  const [editDate, setEditDate] = useState<string>(extracted.report_date || currentRecord.record_date || '');

  // Fetch binary file as an authenticated Blob
  useEffect(() => {
    let active = true;
    let createdUrl: string | null = null;

    const fetchDocumentBlob = async () => {
      try {
        setLoadingFile(true);
        setFileError(null);

        const res = await api.get(`/records/${currentRecord.id}/file`, {
          responseType: 'blob'
        });

        if (active) {
          const rawContentType = res.headers['content-type'];
          const contentType = typeof rawContentType === 'string' ? rawContentType : 'application/pdf';
          const blob = new Blob([res.data], { type: contentType });
          createdUrl = URL.createObjectURL(blob);
          setBlobUrl(createdUrl);
        }
      } catch (err: any) {
        console.error('Failed to load file blob:', err);
        if (active) {
          setFileError('Unable to preview source document.');
        }
      } finally {
        if (active) setLoadingFile(false);
      }
    };

    fetchDocumentBlob();

    // Also load summary on mount if not yet generated
    if (!currentRecord.summary_detailed) {
      loadRecordSummary();
    }

    return () => {
      active = false;
      if (createdUrl) {
        URL.revokeObjectURL(createdUrl);
      }
    };
  }, [currentRecord.id]);

  const loadRecordSummary = async (forceRegenerate = false) => {
    try {
      setLoadingSummary(true);
      const res = forceRegenerate
        ? await recordsService.regenerateRecordSummary(currentRecord.id)
        : await recordsService.getRecordSummary(currentRecord.id);

      setSummaryQuick(res.summary_quick);
      setSummaryDetailed(res.summary_detailed);
      setSummaryStatus(res.summary_status);
      setSummaryVersion(res.summary_version);

      const updated = {
        ...currentRecord,
        summary_quick: res.summary_quick,
        summary_detailed: res.summary_detailed,
        summary_status: res.summary_status as any,
        summary_version: res.summary_version
      };
      setCurrentRecord(updated);
      if (onRecordUpdated) onRecordUpdated(updated);
    } catch (err) {
      console.error('Failed to generate record summary:', err);
    } finally {
      setLoadingSummary(false);
    }
  };

  const handleFetchExplanation = async () => {
    if (explanation) {
      setActiveRightTab('explain');
      return;
    }
    try {
      setLoadingExplanation(true);
      setActiveRightTab('explain');
      const res = await recordsService.explainReport(currentRecord.id);
      setExplanation(res.explanation_markdown);
    } catch (err) {
      console.error('Failed to get report explanation:', err);
      setExplanation('Could not load AI explanation at this time. Please review the extracted parameters directly.');
    } finally {
      setLoadingExplanation(false);
    }
  };

  const handleApprove = async () => {
    try {
      setIsActionLoading(true);
      const res = await recordsService.approveRecord(currentRecord.id);
      setCurrentRecord(res);
      if (onRecordUpdated) onRecordUpdated(res);
    } catch (err) {
      console.error('Approval failed:', err);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleReject = async () => {
    try {
      setIsActionLoading(true);
      const res = await recordsService.rejectRecord(currentRecord.id);
      setCurrentRecord(res);
      if (onRecordUpdated) onRecordUpdated(res);
    } catch (err) {
      console.error('Rejection failed:', err);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleMarkClinicianReviewed = async () => {
    try {
      setIsActionLoading(true);
      const res = await recordsService.markClinicianReviewed(currentRecord.id);
      setCurrentRecord(res);
      if (onRecordUpdated) onRecordUpdated(res);
    } catch (err) {
      console.error('Clinician review failed:', err);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleSaveEdit = async () => {
    try {
      setIsActionLoading(true);
      const updatedData: StructuredExtractedData = {
        ...extracted,
        doctor_name: editDoctor,
        hospital_name: editHospital,
        report_date: editDate,
        primary_diagnosis_or_indication: editDiagnosis,
        parameters: editableParams,
        provenance: 'PATIENT_EDITED'
      };

      const res = await recordsService.editExtraction(currentRecord.id, updatedData, 'APPROVE');
      setCurrentRecord(res);
      setSummaryStatus('OUTDATED');
      setIsEditing(false);
      if (onRecordUpdated) onRecordUpdated(res);
    } catch (err) {
      console.error('Save edits failed:', err);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleCopySummary = () => {
    if (summaryDetailed) {
      navigator.clipboard.writeText(summaryDetailed);
      setCopiedSummary(true);
      setTimeout(() => setCopiedSummary(false), 2000);
    }
  };

  const [downloadingPdf, setDownloadingPdf] = useState<boolean>(false);

  const handleDownloadSummary = async () => {
    if (!summaryDetailed && !plainExp) return;

    try {
      setDownloadingPdf(true);
      await generateMedicalReportPdf({
        record: currentRecord,
        summaryDetailed,
        summaryQuick,
        plainExp,
        rawParams,
        summaryVersion
      });
    } catch (err) {
      console.error('Failed to generate PDF summary:', err);
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleDownload = () => {
    if (blobUrl) {
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = currentRecord.file_name || `${currentRecord.title}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  // Group detected parameters dynamically by category
  const rawParams = extracted.parameters || [];
  const filteredParams = filterOutOfRange
    ? rawParams.filter((p) => p.status !== 'NORMAL')
    : rawParams;

  const groupedParams: Record<string, ExtractedParameter[]> = {};
  filteredParams.forEach((p) => {
    const cat = p.category || 'OTHER_CLINICAL';
    if (!groupedParams[cat]) groupedParams[cat] = [];
    groupedParams[cat].push(p);
  });

  const outOfRangeCount = rawParams.filter((p) => p.status !== 'NORMAL').length;

  // Parse structured summary for plain language explanation
  let plainExp: any = null;
  try {
    const parsedStruct = typeof currentRecord.summary_structured === 'string'
      ? JSON.parse(currentRecord.summary_structured)
      : currentRecord.summary_structured;
    plainExp = parsedStruct?.plain_language_explanation;
  } catch (e) {
    plainExp = null;
  }

  // Fallback plain language glossary generator if not in backend cache yet
  const getPlainGlossary = () => {
    if (plainExp?.parameter_glossary && plainExp.parameter_glossary.length > 0) {
      return plainExp.parameter_glossary;
    }
    return rawParams.map(p => ({
      parameter_name: p.parameter_name,
      display_name: p.display_name,
      value: `${p.value} ${p.unit || ''}`.trim(),
      status: p.status,
      reference_range: p.reference_range || 'Normal laboratory range',
      what_is_it: `A standard diagnostic test measuring ${p.display_name}.`,
      what_your_result_means: p.status === 'NORMAL'
        ? `Your result of ${p.value} ${p.unit || ''} is within the healthy reference range.`
        : `Your result of ${p.value} ${p.unit || ''} is outside the standard reference limits (${p.status.toLowerCase()}).`
    }));
  };

  const plainGlossary = getPlainGlossary();
  const goodNewsList = plainExp?.good_news || rawParams
    .filter(p => p.status === 'NORMAL')
    .map(p => `**${p.display_name} (${p.value} ${p.unit || ''})**: Result is within the optimal healthy target range.`);
  const needsAttentionList = plainExp?.needs_attention || rawParams
    .filter(p => p.status !== 'NORMAL')
    .map(p => `**${p.display_name} (${p.value} ${p.unit || ''})**: Result is ${p.status.toLowerCase()} compared to standard laboratory reference ranges.`);
  const doctorQuestions = plainExp?.questions_for_doctor || [
    "What are the most impactful lifestyle changes to optimize my results?",
    "When do you recommend repeating these tests to track my progress?"
  ];

  const handleCopyQuestions = () => {
    const text = doctorQuestions.map((q: string, i: number) => `${i + 1}. ${q}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopiedQuestions(true);
    setTimeout(() => setCopiedQuestions(false), 2000);
  };

  const getStatusBadge = () => {
    const status = currentRecord.approval_status;
    if (status === 'APPROVED') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-semibold">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          Patient Approved
        </span>
      );
    }
    if (status === 'EDITED') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-sky-50 text-sky-700 border border-sky-200 rounded-full text-xs font-semibold">
          <Edit3 className="w-3.5 h-3.5 text-sky-600" />
          Patient Corrected
        </span>
      );
    }
    if (status === 'REJECTED') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-full text-xs font-semibold">
          <XCircle className="w-3.5 h-3.5 text-rose-600" />
          Rejected
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-xs font-semibold">
        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
        Review Required
      </span>
    );
  };

  const getClinicianBadge = () => {
    if (currentRecord.clinician_review_status === 'CLINICIAN_REVIEWED') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full text-xs font-semibold">
          <Stethoscope className="w-3.5 h-3.5 text-indigo-600" />
          Clinician Verified
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[11px]">
        Clinician: Not Reviewed
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-7xl h-[94vh] flex flex-col overflow-hidden">
        {/* Top Header */}
        <div className="flex flex-wrap items-center justify-between px-6 py-3 border-b border-slate-100 bg-slate-50/70 gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-700 font-bold text-xs uppercase flex-shrink-0">
              {currentRecord.file_type || 'PDF'}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-bold text-slate-900 truncate max-w-[280px] sm:max-w-md">{currentRecord.title}</h2>
                {getStatusBadge()}
                {getClinicianBadge()}
              </div>
              <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5 flex-wrap">
                <span>Session: <strong>{currentRecord.session_name}</strong></span>
                <span>•</span>
                <span className="truncate max-w-[160px]">{currentRecord.file_name}</span>
                <span>•</span>
                <span>{currentRecord.file_size_formatted}</span>
              </p>
            </div>
          </div>

          {/* Header Controls */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {currentRecord.clinician_review_status !== 'CLINICIAN_REVIEWED' && (
              <button
                onClick={handleMarkClinicianReviewed}
                disabled={isActionLoading}
                className="px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition flex items-center gap-1.5"
                title="Mark as verified by attending physician"
              >
                <Stethoscope className="w-3.5 h-3.5 text-indigo-600" />
                <span>Mark Clinician Reviewed</span>
              </button>
            )}
            {onShare && (
              <button
                onClick={() => onShare(currentRecord)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition flex items-center gap-1.5"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Share</span>
              </button>
            )}
            {summaryDetailed && (
              <button
                onClick={handleDownloadSummary}
                disabled={downloadingPdf}
                className="px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition flex items-center gap-1.5 shadow-xs disabled:opacity-60"
                title="Download AI-Generated Structured Summary as PDF"
              >
                {downloadingPdf ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                )}
                <span>{downloadingPdf ? 'Generating PDF...' : 'Download PDF Summary'}</span>
              </button>
            )}
            <button
              onClick={handleDownload}
              className="px-3 py-1.5 text-xs font-semibold text-teal-700 hover:text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg transition flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download File</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Two-Panel Body */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-slate-100/50">
          {/* LEFT PANEL: Source Document Viewer */}
          <div className="flex-1 flex flex-col border-r border-slate-200 bg-slate-200/50 overflow-hidden relative">
            {/* Viewer Zoom Toolbar */}
            <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-slate-200 text-xs text-slate-600">
              <span className="font-semibold flex items-center gap-1.5 text-slate-700">
                <FileText className="w-4 h-4 text-teal-600" /> Source Document Preview
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setZoom((z) => Math.max(50, z - 15))}
                  className="p-1.5 hover:bg-slate-100 rounded text-slate-600"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="px-2 font-mono text-[11px]">{zoom}%</span>
                <button
                  onClick={() => setZoom((z) => Math.min(180, z + 15))}
                  className="p-1.5 hover:bg-slate-100 rounded text-slate-600"
                  title="Zoom In"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setZoom(100)}
                  className="p-1.5 hover:bg-slate-100 rounded text-slate-600 ml-1"
                  title="Reset Zoom"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Document Content Frame */}
            <div className="flex-1 overflow-auto p-4 flex items-center justify-center">
              {loadingFile ? (
                <div className="flex flex-col items-center justify-center gap-2 text-slate-500 text-xs py-16">
                  <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
                  <span>Loading source document...</span>
                </div>
              ) : fileError ? (
                <div className="p-6 bg-white rounded-xl border border-slate-200 text-center max-w-sm">
                  <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-slate-800">{fileError}</p>
                  <p className="text-[11px] text-slate-500 mt-1">Please try downloading the original document directly.</p>
                </div>
              ) : blobUrl ? (
                currentRecord.file_type.toUpperCase() === 'PDF' ? (
                  <iframe
                    src={`${blobUrl}#view=FitH&zoom=${zoom}`}
                    title={currentRecord.title}
                    className="w-full h-full rounded-lg shadow-sm border border-slate-300 bg-white"
                    style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
                  />
                ) : (
                  <img
                    src={blobUrl}
                    alt={currentRecord.title}
                    className="max-w-full max-h-full object-contain rounded-lg shadow-md border border-slate-300 transition-transform"
                    style={{ transform: `scale(${zoom / 100})` }}
                  />
                )
              ) : null}
            </div>

            {/* Source Traceability Popover */}
            {sourcePopover && (
              <div className="absolute bottom-4 left-4 right-4 p-3 bg-slate-900/90 text-white rounded-xl shadow-xl backdrop-blur-md text-xs border border-slate-700 animate-slideUp">
                <div className="flex items-center justify-between pb-1 mb-1 border-b border-slate-700">
                  <span className="font-semibold text-teal-300 flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5" /> Source Line: {sourcePopover.name}
                  </span>
                  <button onClick={() => setSourcePopover(null)} className="text-slate-400 hover:text-white">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="font-mono text-[11px] text-slate-200">
                  "{sourcePopover.text}"
                </p>
                <div className="flex items-center justify-between mt-1 text-[10px] text-slate-400">
                  <span>Page {sourcePopover.page || 1}</span>
                  <span className="text-emerald-400">Matched from verified document text block</span>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT PANEL: Report Summary & Structured Clinical Intelligence */}
          <div className="w-full md:w-[500px] lg:w-[540px] flex flex-col bg-white overflow-hidden">
            {/* Navigation Tabs Header */}
            <div className="px-5 py-2.5 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setActiveRightTab('summary')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                    activeRightTab === 'summary'
                      ? 'bg-teal-600 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-200/50'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Report Summary</span>
                </button>

                <button
                  onClick={() => setActiveRightTab('parameters')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    activeRightTab === 'parameters'
                      ? 'bg-white text-teal-700 shadow-sm border border-slate-200'
                      : 'text-slate-600 hover:bg-slate-200/50'
                  }`}
                >
                  Parameters ({rawParams.length})
                </button>

                <button
                  onClick={() => setActiveRightTab('observations')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    activeRightTab === 'observations'
                      ? 'bg-white text-teal-700 shadow-sm border border-slate-200'
                      : 'text-slate-600 hover:bg-slate-200/50'
                  }`}
                >
                  Findings & Rx
                </button>

                <button
                  onClick={handleFetchExplanation}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                    activeRightTab === 'explain'
                      ? 'bg-purple-50 text-purple-700 border border-purple-200'
                      : 'text-purple-700 hover:bg-purple-50'
                  }`}
                >
                  <BookOpen className="w-3 h-3" /> Layman AI
                </button>
              </div>

              {!isEditing && activeRightTab === 'parameters' && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-2.5 py-1 text-xs font-medium text-teal-700 hover:text-teal-900 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-md transition flex items-center gap-1"
                >
                  <Edit3 className="w-3 h-3" /> Edit
                </button>
              )}
            </div>

            {/* Tab Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
              {/* TAB 1: DEDICATED REPORT SUMMARIZER */}
              {activeRightTab === 'summary' && (
                <div className="space-y-4">
                  {/* Summary Status Header Banner */}
                  <div className="flex items-center justify-between p-3 bg-teal-50/70 border border-teal-100 rounded-xl">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-teal-600" />
                      <div>
                        <span className="font-bold text-slate-900 text-xs block">
                          AI Report Summary (v{summaryVersion})
                        </span>
                        <span className="text-[10px] text-slate-500">
                          Generated from this uploaded report • Based on extracted source data
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {summaryDetailed && (
                        <button
                          onClick={handleDownloadSummary}
                          disabled={downloadingPdf}
                          className="px-2.5 py-1 bg-teal-600 hover:bg-teal-700 text-white font-bold text-[11px] rounded-lg transition flex items-center gap-1.5 shadow-xs disabled:opacity-60"
                          title="Download AI Generated Summary as PDF"
                        >
                          {downloadingPdf ? (
                            <Loader2 className="w-3 h-3 animate-spin text-white" />
                          ) : (
                            <Download className="w-3 h-3" />
                          )}
                          <span>{downloadingPdf ? 'Generating PDF...' : 'Download PDF Summary'}</span>
                        </button>
                      )}

                      <button
                        onClick={handleCopySummary}
                        className="p-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-600 transition"
                        title="Copy Summary"
                      >
                        {copiedSummary ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>

                      <button
                        onClick={() => loadRecordSummary(true)}
                        disabled={loadingSummary}
                        className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-teal-700 font-semibold text-[11px] transition flex items-center gap-1"
                        title="Regenerate Summary"
                      >
                        <RefreshCw className={`w-3 h-3 ${loadingSummary ? 'animate-spin' : ''}`} />
                        <span>Regenerate</span>
                      </button>
                    </div>
                  </div>

                  {/* Outdated Warning Banner if fields were corrected */}
                  {summaryStatus === 'OUTDATED' && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                        <span>Parameters were updated. Summary is ready to be refreshed.</span>
                      </div>
                      <button
                        onClick={() => loadRecordSummary(true)}
                        className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-[11px] transition"
                      >
                        Regenerate Now
                      </button>
                    </div>
                  )}

                  {/* DOCTOR'S EXECUTIVE BRIEFING / 30-SECOND HIGHLIGHT */}
                  {summaryQuick && (
                    <div className="p-3.5 bg-gradient-to-br from-indigo-50/90 via-sky-50/50 to-white border border-indigo-200/80 rounded-xl shadow-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 bg-indigo-600 text-white rounded text-[10px] font-bold uppercase tracking-wider">
                            🩺 Doctor's Briefing
                          </span>
                          <span className="text-[11px] font-bold text-indigo-950">
                            30-Second Clinical Digest
                          </span>
                        </div>
                        <span className="text-[10px] font-semibold text-indigo-700">
                          {outOfRangeCount > 0 ? `${outOfRangeCount} Flagged Parameters` : 'All Parameters Normal'}
                        </span>
                      </div>

                      <p className="text-[11.5px] text-slate-800 font-medium leading-relaxed">
                        {summaryQuick}
                      </p>

                      {/* Quick Badges for Flagged Parameters */}
                      {outOfRangeCount > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1 border-t border-indigo-100/60">
                          {rawParams.filter(p => p.status !== 'NORMAL').map((p, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded text-[10px] font-semibold"
                            >
                              <AlertTriangle className="w-3 h-3 text-rose-500" />
                              <span>{p.display_name}: <strong>{p.value} {p.unit || ''}</strong> ({p.status})</span>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Summary Mode Switcher: Plain Language (For Normal Humans) vs Clinical Digest */}
                  <div className="flex items-center p-1 bg-slate-100/90 rounded-xl border border-slate-200 shadow-inner">
                    <button
                      onClick={() => setSummaryMode('plain')}
                      className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 ${
                        summaryMode === 'plain'
                          ? 'bg-white text-teal-800 shadow-sm border border-slate-200/80'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                      <span>💡 Explained for Normal Humans</span>
                    </button>
                    <button
                      onClick={() => setSummaryMode('clinical')}
                      className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 ${
                        summaryMode === 'clinical'
                          ? 'bg-white text-indigo-800 shadow-sm border border-slate-200/80'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <Stethoscope className="w-3.5 h-3.5 text-indigo-600" />
                      <span>🩺 Clinical Digest</span>
                    </button>
                  </div>

                  {loadingSummary ? (
                    <div className="flex flex-col items-center justify-center py-16 text-slate-500 gap-2">
                      <Loader2 className="w-7 h-7 animate-spin text-teal-600" />
                      <span className="text-xs">Generating report-specific explanation...</span>
                    </div>
                  ) : summaryMode === 'plain' ? (
                    /* ========================================================================= */
                    /* MODE A: EXPLAINED FOR NORMAL HUMANS (PLAIN ENGLISH PATIENT GUIDE)        */
                    /* ========================================================================= */
                    <div className="space-y-4 animate-fadeIn">
                      {/* 1. IN A NUTSHELL */}
                      <div className="p-4 bg-gradient-to-br from-teal-50/80 via-emerald-50/40 to-white border border-teal-200/70 rounded-2xl shadow-sm space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="p-1 rounded-lg bg-teal-600 text-white">
                            <Sparkles className="w-3.5 h-3.5" />
                          </span>
                          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                            In A Nutshell (Plain Language Summary)
                          </h3>
                        </div>
                        <p className="text-xs text-slate-800 leading-relaxed font-medium">
                          {plainExp?.nutshell || summaryQuick || "This medical report contains laboratory test results that have been converted into easy-to-read explanations below."}
                        </p>
                      </div>

                      {/* 2. THE GOOD NEWS (NORMAL MARKERS) */}
                      {goodNewsList.length > 0 && (
                        <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2">
                          <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                            <span>The Good News ({goodNewsList.length} Normal Markers)</span>
                          </div>
                          <div className="space-y-1.5 pl-6">
                            {goodNewsList.map((item: string, idx: number) => (
                              <p key={idx} className="text-[11px] text-slate-700 leading-relaxed">
                                • {item.replace(/\*\*/g, '')}
                              </p>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 3. WHAT NEEDS ATTENTION (OUT OF RANGE) */}
                      {needsAttentionList.length > 0 && (
                        <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-xl space-y-2">
                          <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                            <span>What Needs Attention ({needsAttentionList.length} Flagged Values)</span>
                          </div>
                          <div className="space-y-1.5 pl-6">
                            {needsAttentionList.map((item: string, idx: number) => (
                              <p key={idx} className="text-[11px] text-slate-800 leading-relaxed font-medium">
                                • {item.replace(/\*\*/g, '')}
                              </p>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 4. INTERACTIVE TEST-BY-TEST TRANSLATOR GLOSSARY */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                            <BookOpen className="w-3.5 h-3.5 text-teal-600" />
                            <span>Test-by-Test Plain English Breakdown</span>
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {plainGlossary.length} Tests Tested
                          </span>
                        </div>

                        <div className="space-y-2.5">
                          {plainGlossary.map((item: any, idx: number) => (
                            <div
                              key={idx}
                              className="p-3.5 bg-white border border-slate-200/90 rounded-xl shadow-xs hover:border-teal-300 transition space-y-2"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-slate-900 text-xs">
                                  {item.display_name}
                                </span>
                                <div className="flex items-center gap-1.5">
                                  <span className="font-mono text-xs font-bold text-slate-900">
                                    {item.value}
                                  </span>
                                  <span
                                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                      item.status === 'HIGH'
                                        ? 'bg-rose-100 text-rose-800'
                                        : item.status === 'LOW'
                                        ? 'bg-amber-100 text-amber-800'
                                        : 'bg-emerald-100 text-emerald-800'
                                    }`}
                                  >
                                    {item.status}
                                  </span>
                                </div>
                              </div>

                              <div className="text-[11px] text-slate-600 bg-slate-50/80 p-2.5 rounded-lg border border-slate-100 space-y-1.5">
                                <div>
                                  <strong className="text-slate-700">🔍 What this test checks: </strong>
                                  <span>{item.what_is_it}</span>
                                </div>
                                <div>
                                  <strong className="text-slate-700">💬 What your result means: </strong>
                                  <span className="text-slate-800">{item.what_your_result_means}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* 5. QUESTIONS YOU CAN ASK YOUR DOCTOR */}
                      <div className="p-3.5 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-2.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-indigo-900 font-bold text-xs">
                            <Info className="w-4 h-4 text-indigo-600" />
                            <span>Questions You Can Ask Your Doctor</span>
                          </div>
                          <button
                            onClick={handleCopyQuestions}
                            className="px-2 py-1 bg-white hover:bg-indigo-100/70 border border-indigo-200 rounded-lg text-indigo-700 text-[10px] font-semibold transition flex items-center gap-1"
                          >
                            {copiedQuestions ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                            <span>{copiedQuestions ? 'Copied!' : 'Copy Questions'}</span>
                          </button>
                        </div>
                        <ul className="space-y-1.5 pl-4 list-disc text-[11px] text-slate-800 leading-relaxed">
                          {doctorQuestions.map((q: string, idx: number) => (
                            <li key={idx}>{q}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ) : (
                    /* ========================================================================= */
                    /* MODE B: CLINICAL DIGEST (FULL MEDICAL/LAB SPECIFICATION VIEW)            */
                    /* ========================================================================= */
                    <div className="space-y-4 animate-fadeIn">
                      {/* QUICK SUMMARY CARD */}
                      {summaryQuick && (
                        <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-sm space-y-1">
                          <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider block">
                            Clinical Overview
                          </span>
                          <p className="text-xs text-slate-800 leading-relaxed font-medium">
                            {summaryQuick}
                          </p>
                        </div>
                      )}

                      {/* KEY DETECTED RESULTS SUMMARY TABLE */}
                      {rawParams.length > 0 && (
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                              Key Parameters & Reference Ranges
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {outOfRangeCount > 0 ? `${outOfRangeCount} outside range` : 'All normal'}
                            </span>
                          </div>

                          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-white">
                            <table className="w-full text-left text-[11px]">
                              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                                <tr>
                                  <th className="py-2 px-3">Parameter</th>
                                  <th className="py-2 px-2">Result</th>
                                  <th className="py-2 px-2">Reference</th>
                                  <th className="py-2 px-2">Status</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {rawParams.map((p, idx) => (
                                  <tr key={idx} className="hover:bg-slate-50/50">
                                    <td className="py-2 px-3 font-medium text-slate-800">{p.display_name}</td>
                                    <td className="py-2 px-2 font-mono font-bold text-slate-900">
                                      {p.value} <span className="font-normal text-slate-500 text-[10px]">{p.unit || ''}</span>
                                    </td>
                                    <td className="py-2 px-2 text-slate-500 font-mono text-[10px]">
                                      {p.reference_range || '-'}
                                    </td>
                                    <td className="py-2 px-2">
                                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                        p.status === 'HIGH' ? 'bg-rose-100 text-rose-700' :
                                        p.status === 'LOW' ? 'bg-amber-100 text-amber-700' :
                                        'bg-emerald-50 text-emerald-700'
                                      }`}>
                                        {p.status}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* DETAILED MARKDOWN SUMMARY */}
                      <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200 text-xs leading-relaxed text-slate-800 whitespace-pre-line font-sans shadow-sm">
                        {summaryDetailed || 'Summary being generated...'}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: DETECTED PARAMETERS */}
              {activeRightTab === 'parameters' && (
                <>
                  {isEditing ? (
                    /* EDIT MODE FORM */
                    <div className="space-y-3.5">
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs">
                        Modifying fields marks this document as <strong>Patient Corrected & Verified</strong> and marks summary for refresh.
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">Doctor Name</label>
                          <input
                            type="text"
                            value={editDoctor}
                            onChange={(e) => setEditDoctor(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:border-teal-500 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">Facility / Lab</label>
                          <input
                            type="text"
                            value={editHospital}
                            onChange={(e) => setEditHospital(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:border-teal-500 outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">Report Date</label>
                        <input
                          type="text"
                          value={editDate}
                          onChange={(e) => setEditDate(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:border-teal-500 outline-none"
                        />
                      </div>

                      {/* Editable Parameters List */}
                      <div className="space-y-2 pt-2">
                        <label className="block text-[11px] font-bold text-slate-700 uppercase">
                          Detected Parameter Values
                        </label>
                        {editableParams.map((p, idx) => (
                          <div key={idx} className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-slate-800">{p.display_name}</span>
                              <span className="text-[10px] text-slate-400 font-mono">{p.category}</span>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              <div>
                                <label className="block text-[10px] text-slate-500">Value</label>
                                <input
                                  type="text"
                                  value={p.value}
                                  onChange={(e) => {
                                    const next = [...editableParams];
                                    next[idx].value = e.target.value;
                                    setEditableParams(next);
                                  }}
                                  className="w-full px-2 py-1 border border-slate-300 rounded text-xs bg-white"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] text-slate-500">Unit</label>
                                <input
                                  type="text"
                                  value={p.unit || ''}
                                  onChange={(e) => {
                                    const next = [...editableParams];
                                    next[idx].unit = e.target.value;
                                    setEditableParams(next);
                                  }}
                                  className="w-full px-2 py-1 border border-slate-300 rounded text-xs bg-white"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] text-slate-500">Status</label>
                                <select
                                  value={p.status}
                                  onChange={(e) => {
                                    const next = [...editableParams];
                                    next[idx].status = e.target.value as any;
                                    setEditableParams(next);
                                  }}
                                  className="w-full px-2 py-1 border border-slate-300 rounded text-xs bg-white"
                                >
                                  <option value="NORMAL">NORMAL</option>
                                  <option value="HIGH">HIGH</option>
                                  <option value="LOW">LOW</option>
                                  <option value="ABNORMAL">ABNORMAL</option>
                                  <option value="CRITICAL">CRITICAL</option>
                                </select>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center gap-2 pt-3">
                        <button
                          onClick={handleSaveEdit}
                          disabled={isActionLoading}
                          className="flex-1 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg flex items-center justify-center gap-1.5 transition"
                        >
                          <Save className="w-3.5 h-3.5" /> Save & Verify
                        </button>
                        <button
                          onClick={() => setIsEditing(false)}
                          className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* READ / REVIEW CLINICAL VIEW */
                    <div className="space-y-4">
                      {/* Filter Sub-toolbar */}
                      <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                        <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                          Detected Parameters ({rawParams.length})
                        </span>
                        {outOfRangeCount > 0 && (
                          <button
                            onClick={() => setFilterOutOfRange(!filterOutOfRange)}
                            className={`px-2 py-0.5 rounded text-[11px] font-semibold border flex items-center gap-1 transition ${
                              filterOutOfRange
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            <Filter className="w-3 h-3" />
                            {filterOutOfRange ? 'Show All' : `Out of Range (${outOfRangeCount})`}
                          </button>
                        )}
                      </div>

                      {/* DYNAMIC CATEGORY GROUPS */}
                      {Object.keys(groupedParams).length === 0 ? (
                        <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 text-slate-500">
                          <Activity className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                          <p className="font-semibold text-xs text-slate-700">No matching parameters</p>
                        </div>
                      ) : (
                        Object.entries(groupedParams).map(([categoryName, params]) => (
                          <div key={categoryName} className="space-y-1.5">
                            <div className="flex items-center justify-between pt-1">
                              <h4 className="text-[11px] font-bold text-slate-700 tracking-wider uppercase flex items-center gap-1.5">
                                <Activity className="w-3 h-3 text-teal-600" />
                                {categoryName.replace('_', ' ')}
                              </h4>
                              <span className="text-[10px] font-mono text-slate-400">{params.length} parameters</span>
                            </div>

                            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-white">
                              <table className="w-full text-left text-[11px]">
                                <thead className="bg-slate-50/90 text-slate-600 border-b border-slate-200 font-semibold">
                                  <tr>
                                    <th className="py-2 px-3">Parameter</th>
                                    <th className="py-2 px-2">Result</th>
                                    <th className="py-2 px-2">Reference</th>
                                    <th className="py-2 px-2">Status</th>
                                    <th className="py-2 px-2 text-right">Source</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {params.map((p, idx) => (
                                    <tr key={idx} className="hover:bg-teal-50/30 transition-colors">
                                      <td className="py-2.5 px-3">
                                        <div className="flex items-center gap-1.5">
                                          <span className="font-medium text-slate-800">{p.display_name}</span>
                                          {onOpenTrend && (
                                            <button
                                              onClick={() => onOpenTrend(p.parameter_name)}
                                              title="View Trend"
                                              className="text-slate-400 hover:text-teal-600 transition"
                                            >
                                              <TrendingUp className="w-3 h-3" />
                                            </button>
                                          )}
                                        </div>
                                      </td>
                                      <td className="py-2.5 px-2 font-mono font-bold text-slate-900">
                                        {p.value} <span className="font-normal text-slate-500 text-[10px]">{p.unit || ''}</span>
                                      </td>
                                      <td className="py-2.5 px-2 text-slate-500 font-mono text-[10px]">
                                        {p.reference_range ? p.reference_range : <span className="italic text-slate-400">Not provided</span>}
                                      </td>
                                      <td className="py-2.5 px-2">
                                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                          p.status === 'HIGH' ? 'bg-rose-100 text-rose-700 border border-rose-200' :
                                          p.status === 'LOW' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                                          p.status === 'CRITICAL' ? 'bg-red-600 text-white font-extrabold' :
                                          'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                        }`}>
                                          {p.status}
                                        </span>
                                      </td>
                                      <td className="py-2.5 px-2 text-right">
                                        <button
                                          onClick={() => setSourcePopover({
                                            name: p.display_name,
                                            text: p.source_text || `${p.display_name}: ${p.value} ${p.unit || ''}`,
                                            page: p.page_number || 1
                                          })}
                                          className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-teal-700 transition inline-flex items-center gap-0.5 text-[10px]"
                                          title="View source snippet"
                                        >
                                          <Eye className="w-3 h-3" />
                                          <span>P.{p.page_number || 1}</span>
                                        </button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </>
              )}

              {/* TAB 3: OBSERVATIONS & FINDINGS */}
              {activeRightTab === 'observations' && (
                <div className="space-y-4">
                  {extracted.medications && extracted.medications.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
                        <Pill className="w-3.5 h-3.5 text-teal-600" /> Prescribed Medications ({extracted.medications.length})
                      </h4>
                      <div className="space-y-2">
                        {extracted.medications.map((m, idx) => (
                          <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                            <div>
                              <p className="font-bold text-slate-800 text-xs">{m.medication_name}</p>
                              <p className="text-[11px] text-slate-500">{m.frequency} • {m.duration || 'As directed'}</p>
                            </div>
                            <span className="px-2.5 py-1 bg-teal-50 text-teal-800 border border-teal-200 rounded-lg text-xs font-semibold">
                              {m.dosage}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" /> Clinical Observations & Findings
                    </h4>
                    <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-slate-700 text-xs">
                      {extracted.observations_and_findings && extracted.observations_and_findings.length > 0 ? (
                        extracted.observations_and_findings.map((f, idx) => (
                          <p key={idx} className="flex items-start gap-2">
                            <span className="text-teal-600 font-bold">•</span>
                            <span>{f}</span>
                          </p>
                        ))
                      ) : (
                        <p>{currentRecord.description || 'No additional narrative findings annotated.'}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: LAYMAN AI EXPLANATION */}
              {activeRightTab === 'explain' && (
                <div className="space-y-3">
                  <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-purple-900 text-xs flex items-start gap-2">
                    <BookOpen className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <strong>Patient Health Literacy Navigator:</strong> Explains clinical terms in simple language. This is purely educational and does not replace your physician's clinical advice.
                    </div>
                  </div>

                  {loadingExplanation ? (
                    <div className="flex flex-col items-center justify-center py-12 text-slate-500 gap-2">
                      <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
                      <span className="text-xs">Generating easy-to-understand breakdown...</span>
                    </div>
                  ) : (
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs leading-relaxed text-slate-700 whitespace-pre-line font-sans">
                      {explanation}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Bottom Action Bar */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between gap-3">
              {currentRecord.approval_status !== 'APPROVED' ? (
                <>
                  <button
                    onClick={handleReject}
                    disabled={isActionLoading}
                    className="px-3.5 py-2 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-xl transition"
                  >
                    Reject Extraction
                  </button>
                  <button
                    onClick={handleApprove}
                    disabled={isActionLoading}
                    className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm hover:shadow transition flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Approve & Verify Report
                  </button>
                </>
              ) : (
                <div className="w-full flex items-center justify-between text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl px-3.5 py-2">
                  <span className="flex items-center gap-1.5 font-semibold">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" /> Verified Structured Clinical Record
                  </span>
                  <button
                    onClick={() => {
                      setActiveRightTab('parameters');
                      setIsEditing(true);
                    }}
                    className="text-xs font-semibold text-emerald-700 hover:underline"
                  >
                    Edit Fields
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
