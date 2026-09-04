import React, { useState, useEffect } from 'react';
import {
  X,
  Download,
  Share2,
  FileText,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Edit3,
  ZoomIn,
  ZoomOut,
  Pill,
  Activity,
  Save,
  RotateCcw,
  Loader2,
  Filter,
  Eye,
  Info,
  TrendingUp,
  Copy,
  Check,
  RefreshCw,
  Stethoscope,
  MessageSquare
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
  const [fileTextContent, setFileTextContent] = useState<string | null>(null);
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

  // Layman AI / AI Analysis State
  const [explanation, setExplanation] = useState<string | null>(null);
  const [loadingExplanation, setLoadingExplanation] = useState<boolean>(false);

  // Synchronize state whenever record prop changes
  useEffect(() => {
    if (record) {
      setCurrentRecord(record);
      setSummaryQuick(record.summary_quick || '');
      setSummaryDetailed(record.summary_detailed || '');
      setSummaryStatus(record.summary_status || 'NOT_GENERATED');
      setSummaryVersion(record.summary_version || 1);
      setExplanation(null);

      const ext: StructuredExtractedData = record.extracted_data || {};
      setEditableParams(ext.parameters || []);
      setEditDiagnosis(ext.primary_diagnosis_or_indication || '');
      setEditDoctor(ext.doctor_name || record.doctor_name || '');
      setEditHospital(ext.hospital_name || record.hospital || '');
      setEditDate(ext.report_date || record.record_date || '');
    }
  }, [record?.id]);

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

          if (contentType.includes('text/plain') || contentType.includes('text/html')) {
            const text = await res.data.text();
            setFileTextContent(text);
          } else {
            const blob = new Blob([res.data], { type: contentType });
            createdUrl = URL.createObjectURL(blob);
            setBlobUrl(createdUrl);
          }
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
      setExplanation('Could not load AI analysis at this time. Please review the extracted parameters directly.');
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
      what_is_it: `Standard laboratory measurement for ${p.display_name}.`,
      what_your_result_means: p.status === 'NORMAL'
        ? `Result of ${p.value} ${p.unit || ''} is within reported reference ranges.`
        : `Result of ${p.value} ${p.unit || ''} is outside reported reference limits (${p.status.toLowerCase()}).`
    }));
  };

  const plainGlossary = getPlainGlossary();
  const goodNewsList = plainExp?.good_news || rawParams
    .filter(p => p.status === 'NORMAL')
    .map(p => `${p.display_name} (${p.value} ${p.unit || ''}): Within normal reference range.`);
  const needsAttentionList = plainExp?.needs_attention || rawParams
    .filter(p => p.status !== 'NORMAL')
    .map(p => `${p.display_name} (${p.value} ${p.unit || ''}): Flagged ${p.status.toLowerCase()} relative to reference limits.`);
  const doctorQuestions = plainExp?.questions_for_doctor || [
    "What specific dietary or lifestyle adjustments do you recommend based on these findings?",
    "When do you recommend repeating these tests to track progress?"
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
        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded text-xs font-medium">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          Patient Approved
        </span>
      );
    }
    if (status === 'EDITED') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-sky-50 text-sky-800 border border-sky-200 rounded text-xs font-medium">
          <Edit3 className="w-3 h-3 text-sky-600" />
          Patient Corrected
        </span>
      );
    }
    if (status === 'REJECTED') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-50 text-rose-800 border border-rose-200 rounded text-xs font-medium">
          <XCircle className="w-3 h-3 text-rose-600" />
          Rejected
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded text-xs font-medium">
        <AlertTriangle className="w-3 h-3 text-amber-600" />
        Review Required
      </span>
    );
  };

  const getClinicianBadge = () => {
    if (currentRecord.clinician_review_status === 'CLINICIAN_REVIEWED') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-teal-50 text-[#2F7E7A] border border-teal-200 rounded text-xs font-medium">
          <Stethoscope className="w-3 h-3 text-[#2F7E7A]" />
          Clinician Verified
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-600 border border-slate-200 rounded text-xs font-medium">
        Clinician Not Reviewed
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-xl border border-[#E3E7EB] w-full max-w-7xl h-[94vh] flex flex-col overflow-hidden">
        {/* Top Header */}
        <div className="flex flex-wrap items-center justify-between px-6 py-3.5 border-b border-[#E3E7EB] bg-[#F7F8FA] gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-white border border-[#E3E7EB] flex items-center justify-center text-[#2F7E7A] font-semibold text-xs uppercase flex-shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-semibold text-[#24313F] truncate max-w-[280px] sm:max-w-md">{currentRecord.title}</h2>
                {getStatusBadge()}
                {getClinicianBadge()}
              </div>
              <p className="text-xs text-[#6B7785] flex items-center gap-2 mt-0.5 flex-wrap">
                <span>Session: <strong className="text-[#24313F] font-medium">{currentRecord.session_name}</strong></span>
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
                className="px-3 py-1.5 text-xs font-medium text-white bg-[#2F7E7A] hover:bg-[#256B67] rounded-md transition flex items-center gap-1.5 disabled:opacity-60"
              >
                <Stethoscope className="w-3.5 h-3.5" />
                <span>Mark Clinician Reviewed</span>
              </button>
            )}
            {onShare && (
              <button
                onClick={() => onShare(currentRecord)}
                className="px-3 py-1.5 text-xs font-medium text-[#24313F] bg-white hover:bg-[#F7F8FA] border border-[#E3E7EB] rounded-md transition flex items-center gap-1.5"
              >
                <Share2 className="w-3.5 h-3.5 text-[#6B7785]" />
                <span>Share</span>
              </button>
            )}
            <button
              onClick={handleDownload}
              className="px-3 py-1.5 text-xs font-medium text-[#24313F] bg-white hover:bg-[#F7F8FA] border border-[#E3E7EB] rounded-md transition flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5 text-[#6B7785]" />
              <span>Download File</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-[#6B7785] hover:text-[#24313F] hover:bg-slate-200/50 rounded-md transition ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Two-Panel Body */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-[#F7F8FA]">
          {/* LEFT PANEL: Source Document Viewer */}
          <div className="flex-1 flex flex-col border-r border-[#E3E7EB] bg-slate-100/60 overflow-hidden relative">
            {/* Viewer Zoom Toolbar */}
            <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-[#E3E7EB] text-xs text-[#6B7785]">
              <span className="font-medium flex items-center gap-1.5 text-[#24313F]">
                <FileText className="w-4 h-4 text-[#2F7E7A]" /> Source Document Preview
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setZoom((z) => Math.max(50, z - 15))}
                  className="p-1.5 hover:bg-slate-100 rounded text-[#6B7785]"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="px-2 font-mono text-[11px]">{zoom}%</span>
                <button
                  onClick={() => setZoom((z) => Math.min(180, z + 15))}
                  className="p-1.5 hover:bg-slate-100 rounded text-[#6B7785]"
                  title="Zoom In"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setZoom(100)}
                  className="p-1.5 hover:bg-slate-100 rounded text-[#6B7785] ml-1"
                  title="Reset Zoom"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Document Content Frame */}
            <div className="flex-1 overflow-auto p-4 flex items-center justify-center">
              {loadingFile ? (
                <div className="flex flex-col items-center justify-center gap-2 text-[#6B7785] text-xs py-16">
                  <Loader2 className="w-5 h-5 animate-spin text-[#2F7E7A]" />
                  <span>Loading document preview...</span>
                </div>
              ) : fileError ? (
                <div className="p-6 bg-white rounded-lg border border-[#E3E7EB] text-center max-w-sm">
                  <AlertTriangle className="w-7 h-7 text-[#B7791F] mx-auto mb-2" />
                  <p className="text-xs font-medium text-[#24313F]">{fileError}</p>
                  <p className="text-[11px] text-[#6B7785] mt-1">Download the original file to view.</p>
                </div>
              ) : fileTextContent ? (
                <div className="w-full h-full overflow-auto p-4 bg-slate-900 text-slate-100 rounded-md font-mono text-xs leading-relaxed shadow-inner border border-slate-800 whitespace-pre-wrap">
                  {fileTextContent}
                </div>
              ) : blobUrl ? (
                currentRecord.file_type.toUpperCase() === 'PDF' ? (
                  <iframe
                    src={`${blobUrl}#view=FitH&zoom=${zoom}`}
                    title={currentRecord.title}
                    className="w-full h-full rounded-md border border-[#E3E7EB] bg-white"
                    style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
                  />
                ) : (
                  <img
                    src={blobUrl}
                    alt={currentRecord.title}
                    className="max-w-full max-h-full object-contain rounded-md border border-[#E3E7EB] transition-transform"
                    style={{ transform: `scale(${zoom / 100})` }}
                  />
                )
              ) : null}
            </div>

            {/* Source Traceability Popover */}
            {sourcePopover && (
              <div className="absolute bottom-4 left-4 right-4 p-3 bg-[#24313F] text-white rounded-md shadow-md text-xs border border-slate-700">
                <div className="flex items-center justify-between pb-1 mb-1 border-b border-slate-700">
                  <span className="font-medium text-teal-300 flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5" /> Source Match: {sourcePopover.name}
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
                  <span className="text-emerald-400">Verified document source line</span>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT PANEL: Report Summary & Structured Data */}
          <div className="w-full md:w-[500px] lg:w-[540px] flex flex-col bg-white overflow-hidden">
            {/* Horizontal Professional Tab Navigation */}
            <div className="px-6 pt-3 border-b border-[#E3E7EB] bg-white flex items-center justify-between">
              <div className="flex items-center gap-6">
                <button
                  onClick={() => setActiveRightTab('summary')}
                  className={`pb-3 text-xs font-medium transition-colors relative flex items-center gap-1.5 ${
                    activeRightTab === 'summary'
                      ? 'text-[#24313F] font-semibold border-b-2 border-[#2F7E7A]'
                      : 'text-[#6B7785] hover:text-[#24313F]'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Report Summary</span>
                </button>

                <button
                  onClick={() => setActiveRightTab('parameters')}
                  className={`pb-3 text-xs font-medium transition-colors relative ${
                    activeRightTab === 'parameters'
                      ? 'text-[#24313F] font-semibold border-b-2 border-[#2F7E7A]'
                      : 'text-[#6B7785] hover:text-[#24313F]'
                  }`}
                >
                  Parameters ({rawParams.length})
                </button>

                <button
                  onClick={() => setActiveRightTab('observations')}
                  className={`pb-3 text-xs font-medium transition-colors relative ${
                    activeRightTab === 'observations'
                      ? 'text-[#24313F] font-semibold border-b-2 border-[#2F7E7A]'
                      : 'text-[#6B7785] hover:text-[#24313F]'
                  }`}
                >
                  Findings & Rx
                </button>

                <button
                  onClick={handleFetchExplanation}
                  className={`pb-3 text-xs font-medium transition-colors relative flex items-center gap-1.5 ${
                    activeRightTab === 'explain'
                      ? 'text-[#24313F] font-semibold border-b-2 border-[#2F7E7A]'
                      : 'text-[#6B7785] hover:text-[#24313F]'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>AI Analysis</span>
                </button>
              </div>

              {!isEditing && activeRightTab === 'parameters' && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="mb-2 px-2.5 py-1 text-xs font-medium text-[#2F7E7A] hover:text-[#256B67] bg-[#F7F8FA] hover:bg-slate-200/50 border border-[#E3E7EB] rounded transition flex items-center gap-1"
                >
                  <Edit3 className="w-3 h-3" /> Edit
                </button>
              )}
            </div>

            {/* Tab Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
              {/* TAB 1: REPORT SUMMARY */}
              {activeRightTab === 'summary' && (
                <div className="space-y-4">
                  {/* Summary Section Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-[#E3E7EB]">
                    <div>
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-[#2F7E7A]" />
                        <h3 className="font-semibold text-[#24313F] text-sm">Report Summary</h3>
                        <span className="text-[11px] text-[#6B7785] font-normal">(v{summaryVersion})</span>
                      </div>
                      <p className="text-xs text-[#6B7785] mt-0.5">Generated from the uploaded medical report</p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {summaryDetailed && (
                        <button
                          onClick={handleDownloadSummary}
                          disabled={downloadingPdf}
                          className="px-2.5 py-1.5 bg-white hover:bg-[#F7F8FA] border border-[#E3E7EB] text-[#24313F] font-medium text-xs rounded transition flex items-center gap-1.5 disabled:opacity-60"
                          title="Download Summary PDF"
                        >
                          {downloadingPdf ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-[#2F7E7A]" />
                          ) : (
                            <Download className="w-3.5 h-3.5 text-[#2F7E7A]" />
                          )}
                          <span>{downloadingPdf ? 'Generating...' : 'Download Summary'}</span>
                        </button>
                      )}

                      <button
                        onClick={handleCopySummary}
                        className="p-1.5 bg-white hover:bg-[#F7F8FA] border border-[#E3E7EB] rounded text-[#6B7785] transition"
                        title="Copy Summary"
                      >
                        {copiedSummary ? <Check className="w-3.5 h-3.5 text-emerald-700" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>

                      <button
                        onClick={() => loadRecordSummary(true)}
                        disabled={loadingSummary}
                        className="px-2.5 py-1.5 bg-white hover:bg-[#F7F8FA] border border-[#E3E7EB] rounded text-[#2F7E7A] font-medium text-xs transition flex items-center gap-1"
                        title="Regenerate Summary"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${loadingSummary ? 'animate-spin' : ''}`} />
                        <span>Regenerate</span>
                      </button>
                    </div>
                  </div>

                  {/* Outdated Warning Banner if fields were corrected */}
                  {summaryStatus === 'OUTDATED' && (
                    <div className="p-3 bg-[#FEF8EE] border border-[#F6E0B8] rounded-md text-[#B7791F] text-xs flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-[#B7791F] flex-shrink-0" />
                        <span>Parameters were updated. Summary is ready to be refreshed.</span>
                      </div>
                      <button
                        onClick={() => loadRecordSummary(true)}
                        className="px-2.5 py-1 bg-[#B7791F] text-white font-medium rounded text-xs transition hover:bg-[#9C6518]"
                      >
                        Regenerate Now
                      </button>
                    </div>
                  )}

                  {/* Summary Mode Switcher */}
                  <div className="flex items-center border-b border-[#E3E7EB]">
                    <button
                      onClick={() => setSummaryMode('plain')}
                      className={`py-2 px-3 text-xs font-medium border-b-2 transition-colors ${
                        summaryMode === 'plain'
                          ? 'border-[#2F7E7A] text-[#24313F] font-semibold'
                          : 'border-transparent text-[#6B7785] hover:text-[#24313F]'
                      }`}
                    >
                      Patient Overview
                    </button>
                    <button
                      onClick={() => setSummaryMode('clinical')}
                      className={`py-2 px-3 text-xs font-medium border-b-2 transition-colors ${
                        summaryMode === 'clinical'
                          ? 'border-[#2F7E7A] text-[#24313F] font-semibold'
                          : 'border-transparent text-[#6B7785] hover:text-[#24313F]'
                      }`}
                    >
                      Clinical Digest
                    </button>
                  </div>

                  {loadingSummary ? (
                    <div className="flex flex-col items-center justify-center py-12 text-[#6B7785] gap-2">
                      <Loader2 className="w-5 h-5 animate-spin text-[#2F7E7A]" />
                      <span className="text-xs">Generating report summary...</span>
                    </div>
                  ) : summaryMode === 'plain' ? (
                    /* PATIENT SUMMARY MODE */
                    <div className="space-y-4">
                      {/* OVERVIEW */}
                      <div className="space-y-1.5">
                        <h4 className="text-xs font-semibold text-[#6B7785] uppercase tracking-wider">Overview</h4>
                        <p className="text-xs text-[#24313F] leading-relaxed">
                          {plainExp?.nutshell || summaryQuick || "This medical report contains lab test results."}
                        </p>
                      </div>

                      {/* KEY RESULTS TABLE */}
                      {rawParams.length > 0 && (
                        <div className="space-y-2 pt-2 border-t border-[#E3E7EB]">
                          <h4 className="text-xs font-semibold text-[#6B7785] uppercase tracking-wider">Key Results</h4>
                          <div className="border border-[#E3E7EB] rounded-md overflow-hidden bg-white">
                            <table className="w-full text-left text-xs">
                              <thead className="bg-[#F7F8FA] text-[#6B7785] border-b border-[#E3E7EB] font-medium">
                                <tr>
                                  <th className="py-2 px-3">Parameter</th>
                                  <th className="py-2 px-3">Result</th>
                                  <th className="py-2 px-3">Reference</th>
                                  <th className="py-2 px-3">Status</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-[#E3E7EB]">
                                {rawParams.map((p, idx) => (
                                  <tr key={idx} className="hover:bg-[#F7F8FA]">
                                    <td className="py-2 px-3 font-medium text-[#24313F]">{p.display_name}</td>
                                    <td className="py-2 px-3 font-mono font-semibold text-[#24313F]">
                                      {p.value} <span className="font-normal text-[#6B7785] text-[11px]">{p.unit || ''}</span>
                                    </td>
                                    <td className="py-2 px-3 text-[#6B7785] font-mono text-[11px]">
                                      {p.reference_range || '-'}
                                    </td>
                                    <td className="py-2 px-3">
                                      <span className={`text-[11px] font-medium ${
                                        p.status === 'HIGH' || p.status === 'CRITICAL' ? 'text-[#C94A4A]' :
                                        p.status === 'LOW' ? 'text-[#B7791F]' :
                                        'text-[#24313F]'
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

                      {/* CLINICAL OBSERVATIONS */}
                      <div className="space-y-2 pt-2 border-t border-[#E3E7EB]">
                        <h4 className="text-xs font-semibold text-[#6B7785] uppercase tracking-wider">Clinical Observations</h4>
                        <ul className="space-y-1 pl-4 list-disc text-xs text-[#24313F] leading-relaxed">
                          {goodNewsList.map((item: string, idx: number) => (
                            <li key={idx}>{item.replace(/\*\*/g, '')}</li>
                          ))}
                          {needsAttentionList.map((item: string, idx: number) => (
                            <li key={idx} className="text-[#C94A4A] font-medium">{item.replace(/\*\*/g, '')}</li>
                          ))}
                        </ul>
                      </div>

                      {/* QUESTIONS FOR YOUR DOCTOR */}
                      <div className="space-y-2 pt-2 border-t border-[#E3E7EB]">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-semibold text-[#6B7785] uppercase tracking-wider">Questions for Your Doctor</h4>
                          <button
                            onClick={handleCopyQuestions}
                            className="px-2 py-0.5 bg-white hover:bg-slate-100 border border-[#E3E7EB] rounded text-[#6B7785] text-[11px] font-medium transition flex items-center gap-1"
                          >
                            {copiedQuestions ? <Check className="w-3 h-3 text-emerald-700" /> : <Copy className="w-3 h-3" />}
                            <span>{copiedQuestions ? 'Copied' : 'Copy'}</span>
                          </button>
                        </div>
                        <ul className="space-y-1 pl-4 list-disc text-xs text-[#24313F] leading-relaxed">
                          {doctorQuestions.map((q: string, idx: number) => (
                            <li key={idx}>{q}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ) : (
                    /* CLINICAL DIGEST MODE */
                    <div className="space-y-4">
                      {summaryQuick && (
                        <div className="space-y-1">
                          <h4 className="text-xs font-semibold text-[#6B7785] uppercase tracking-wider">Clinical Summary</h4>
                          <p className="text-xs text-[#24313F] leading-relaxed font-medium">
                            {summaryQuick}
                          </p>
                        </div>
                      )}

                      <div className="pt-2 border-t border-[#E3E7EB] space-y-2">
                        <h4 className="text-xs font-semibold text-[#6B7785] uppercase tracking-wider">Full Report Text & Analysis</h4>
                        <div className="p-3 bg-[#F7F8FA] rounded-md border border-[#E3E7EB] text-xs leading-relaxed text-[#24313F] whitespace-pre-line font-sans">
                          {summaryDetailed || 'Summary details loading...'}
                        </div>
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
                    <div className="space-y-4">
                      <div className="p-3 bg-[#FEF8EE] border border-[#F6E0B8] rounded-md text-[#B7791F] text-xs">
                        Modifying parameters will mark this record as <strong>Patient Corrected</strong> and update the summary.
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-medium text-[#6B7785] mb-1">Doctor Name</label>
                          <input
                            type="text"
                            value={editDoctor}
                            onChange={(e) => setEditDoctor(e.target.value)}
                            className="w-full px-2.5 py-1.5 border border-[#E3E7EB] rounded-md text-xs focus:border-[#2F7E7A] outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium text-[#6B7785] mb-1">Facility / Lab</label>
                          <input
                            type="text"
                            value={editHospital}
                            onChange={(e) => setEditHospital(e.target.value)}
                            className="w-full px-2.5 py-1.5 border border-[#E3E7EB] rounded-md text-xs focus:border-[#2F7E7A] outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-medium text-[#6B7785] mb-1">Report Date</label>
                        <input
                          type="text"
                          value={editDate}
                          onChange={(e) => setEditDate(e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-[#E3E7EB] rounded-md text-xs focus:border-[#2F7E7A] outline-none"
                        />
                      </div>

                      {/* Editable Parameters List */}
                      <div className="space-y-2 pt-2">
                        <h4 className="text-xs font-semibold text-[#6B7785] uppercase tracking-wider">
                          Detected Parameters
                        </h4>
                        {editableParams.map((p, idx) => (
                          <div key={idx} className="p-3 bg-[#F7F8FA] border border-[#E3E7EB] rounded-md space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-[#24313F]">{p.display_name}</span>
                              <span className="text-[10px] text-[#6B7785] font-mono">{p.category}</span>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              <div>
                                <label className="block text-[10px] text-[#6B7785]">Value</label>
                                <input
                                  type="text"
                                  value={p.value}
                                  onChange={(e) => {
                                    const next = [...editableParams];
                                    next[idx].value = e.target.value;
                                    setEditableParams(next);
                                  }}
                                  className="w-full px-2 py-1 border border-[#E3E7EB] rounded text-xs bg-white"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] text-[#6B7785]">Unit</label>
                                <input
                                  type="text"
                                  value={p.unit || ''}
                                  onChange={(e) => {
                                    const next = [...editableParams];
                                    next[idx].unit = e.target.value;
                                    setEditableParams(next);
                                  }}
                                  className="w-full px-2 py-1 border border-[#E3E7EB] rounded text-xs bg-white"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] text-[#6B7785]">Status</label>
                                <select
                                  value={p.status}
                                  onChange={(e) => {
                                    const next = [...editableParams];
                                    next[idx].status = e.target.value as any;
                                    setEditableParams(next);
                                  }}
                                  className="w-full px-2 py-1 border border-[#E3E7EB] rounded text-xs bg-white"
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
                          className="flex-1 py-2 bg-[#2F7E7A] hover:bg-[#256B67] text-white font-medium text-xs rounded-md flex items-center justify-center gap-1.5 transition"
                        >
                          <Save className="w-3.5 h-3.5" /> Save Changes
                        </button>
                        <button
                          onClick={() => setIsEditing(false)}
                          className="px-3 py-2 bg-[#F7F8FA] hover:bg-slate-200/50 text-[#24313F] font-medium text-xs border border-[#E3E7EB] rounded-md transition"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* CLINICAL PARAMETERS TABLE */
                    <div className="space-y-4">
                      {/* Filter Sub-toolbar */}
                      <div className="flex items-center justify-between pb-1">
                        <h4 className="text-xs font-semibold text-[#6B7785] uppercase tracking-wider">
                          Extracted Parameters ({rawParams.length})
                        </h4>
                        {outOfRangeCount > 0 && (
                          <button
                            onClick={() => setFilterOutOfRange(!filterOutOfRange)}
                            className={`px-2 py-0.5 rounded text-xs font-medium border transition ${
                              filterOutOfRange
                                ? 'bg-[#FDF2F2] text-[#C94A4A] border-[#F8D7D7]'
                                : 'bg-[#F7F8FA] text-[#6B7785] border-[#E3E7EB] hover:bg-slate-200/50'
                            }`}
                          >
                            <Filter className="w-3 h-3 inline mr-1" />
                            {filterOutOfRange ? 'Show All' : `Flagged Only (${outOfRangeCount})`}
                          </button>
                        )}
                      </div>

                      {/* DYNAMIC CATEGORY GROUPS */}
                      {Object.keys(groupedParams).length === 0 ? (
                        <div className="p-6 text-center bg-[#F7F8FA] rounded-md border border-[#E3E7EB] text-[#6B7785]">
                          <Activity className="w-6 h-6 text-[#6B7785] mx-auto mb-2" />
                          <p className="font-medium text-xs text-[#24313F]">No matching parameters</p>
                        </div>
                      ) : (
                        Object.entries(groupedParams).map(([categoryName, params]) => (
                          <div key={categoryName} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <h5 className="text-xs font-semibold text-[#24313F] uppercase tracking-wider flex items-center gap-1.5">
                                <Activity className="w-3.5 h-3.5 text-[#2F7E7A]" />
                                {categoryName.replace('_', ' ')}
                              </h5>
                              <span className="text-[11px] text-[#6B7785] font-mono">{params.length} items</span>
                            </div>

                            <div className="border border-[#E3E7EB] rounded-md overflow-hidden bg-white">
                              <table className="w-full text-left text-xs">
                                <thead className="bg-[#F7F8FA] text-[#6B7785] border-b border-[#E3E7EB] font-medium">
                                  <tr>
                                    <th className="py-2.5 px-3">Parameter</th>
                                    <th className="py-2.5 px-3">Result</th>
                                    <th className="py-2.5 px-3">Unit</th>
                                    <th className="py-2.5 px-3">Reference Range</th>
                                    <th className="py-2.5 px-3">Status</th>
                                    <th className="py-2.5 px-3 text-right">Source</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-[#E3E7EB]">
                                  {params.map((p, idx) => (
                                    <tr key={idx} className="hover:bg-[#F7F8FA] transition-colors">
                                      <td className="py-2.5 px-3 font-medium text-[#24313F]">
                                        <div className="flex items-center gap-1.5">
                                          <span>{p.display_name}</span>
                                          {onOpenTrend && (
                                            <button
                                              onClick={() => onOpenTrend(p.parameter_name)}
                                              title="View Trend"
                                              className="text-[#6B7785] hover:text-[#2F7E7A] transition"
                                            >
                                              <TrendingUp className="w-3 h-3" />
                                            </button>
                                          )}
                                        </div>
                                      </td>
                                      <td className="py-2.5 px-3 font-mono font-semibold text-[#24313F]">{p.value}</td>
                                      <td className="py-2.5 px-3 text-[#6B7785]">{p.unit || '-'}</td>
                                      <td className="py-2.5 px-3 text-[#6B7785] font-mono text-[11px]">
                                        {p.reference_range ? p.reference_range : '-'}
                                      </td>
                                      <td className="py-2.5 px-3">
                                        <span className={`text-xs font-medium ${
                                          p.status === 'HIGH' || p.status === 'CRITICAL' ? 'text-[#C94A4A]' :
                                          p.status === 'LOW' ? 'text-[#B7791F]' :
                                          'text-[#24313F]'
                                        }`}>
                                          {p.status}
                                        </span>
                                      </td>
                                      <td className="py-2.5 px-3 text-right">
                                        <button
                                          onClick={() => setSourcePopover({
                                            name: p.display_name,
                                            text: p.source_text || `${p.display_name}: ${p.value} ${p.unit || ''}`,
                                            page: p.page_number || 1
                                          })}
                                          className="p-1 hover:bg-[#E3E7EB]/50 rounded text-[#6B7785] hover:text-[#2F7E7A] transition inline-flex items-center gap-1 text-[11px]"
                                          title="View source line"
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

              {/* TAB 3: FINDINGS & RX */}
              {activeRightTab === 'observations' && (
                <div className="space-y-4">
                  {extracted.medications && extracted.medications.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-semibold text-[#6B7785] uppercase tracking-wider flex items-center gap-1.5">
                        <Pill className="w-3.5 h-3.5 text-[#2F7E7A]" /> Prescribed Medications ({extracted.medications.length})
                      </h4>
                      <div className="border border-[#E3E7EB] rounded-md overflow-hidden bg-white divide-y divide-[#E3E7EB]">
                        {extracted.medications.map((m, idx) => (
                          <div key={idx} className="p-3 flex items-center justify-between">
                            <div>
                              <p className="font-medium text-[#24313F] text-xs">{m.medication_name}</p>
                              <p className="text-[11px] text-[#6B7785]">{m.frequency} • {m.duration || 'As directed'}</p>
                            </div>
                            <span className="px-2.5 py-1 bg-[#F7F8FA] border border-[#E3E7EB] rounded text-xs font-medium text-[#24313F]">
                              {m.dosage}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold text-[#6B7785] uppercase tracking-wider flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#2F7E7A]" /> Clinical Observations & Findings
                    </h4>
                    <div className="p-3 bg-[#F7F8FA] border border-[#E3E7EB] rounded-md space-y-1.5 text-[#24313F] text-xs leading-relaxed">
                      {extracted.observations_and_findings && extracted.observations_and_findings.length > 0 ? (
                        extracted.observations_and_findings.map((f, idx) => (
                          <p key={idx} className="flex items-start gap-2">
                            <span className="text-[#2F7E7A] font-bold">•</span>
                            <span>{f}</span>
                          </p>
                        ))
                      ) : (
                        <p className="text-[#6B7785]">{currentRecord.description || 'No additional narrative findings annotated in this report.'}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: AI ANALYSIS */}
              {activeRightTab === 'explain' && (
                <div className="space-y-4">
                  <div className="p-3 bg-[#F7F8FA] border border-[#E3E7EB] rounded-md text-[#6B7785] text-xs flex items-start gap-2">
                    <MessageSquare className="w-4 h-4 text-[#2F7E7A] flex-shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-[#24313F]">AI Clinical Report Analysis:</strong> Educational breakdown generated directly from the extracted report parameters.
                    </div>
                  </div>

                  {loadingExplanation ? (
                    <div className="flex flex-col items-center justify-center py-12 text-[#6B7785] gap-2">
                      <Loader2 className="w-5 h-5 animate-spin text-[#2F7E7A]" />
                      <span className="text-xs">Generating report analysis...</span>
                    </div>
                  ) : (
                    <div className="p-4 bg-white rounded-md border border-[#E3E7EB] text-xs leading-relaxed text-[#24313F] whitespace-pre-line font-sans">
                      {explanation}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Bottom Action Bar */}
            <div className="p-4 border-t border-[#E3E7EB] bg-[#F7F8FA] flex items-center justify-between gap-3">
              {currentRecord.approval_status !== 'APPROVED' ? (
                <>
                  <button
                    onClick={handleReject}
                    disabled={isActionLoading}
                    className="px-4 py-2 text-xs font-medium text-[#C94A4A] hover:bg-[#FDF2F2] border border-[#F8D7D7] rounded-md transition disabled:opacity-60"
                  >
                    Reject Extraction
                  </button>
                  <button
                    onClick={handleApprove}
                    disabled={isActionLoading}
                    className="flex-1 py-2 bg-[#2F7E7A] hover:bg-[#256B67] text-white text-xs font-medium rounded-md transition flex items-center justify-center gap-1.5 disabled:opacity-60"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Approve & Verify Report
                  </button>
                </>
              ) : (
                <div className="w-full flex items-center justify-between text-xs text-[#24313F] bg-white border border-[#E3E7EB] rounded-md px-4 py-2">
                  <span className="flex items-center gap-1.5 font-medium text-emerald-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700" /> Verified Structured Clinical Record
                  </span>
                  <button
                    onClick={() => {
                      setActiveRightTab('parameters');
                      setIsEditing(true);
                    }}
                    className="text-xs font-medium text-[#2F7E7A] hover:underline"
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
