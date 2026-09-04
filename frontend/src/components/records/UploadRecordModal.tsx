import React, { useState, useRef } from 'react';
import { 
  X, 
  UploadCloud, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  FolderPlus,
  Calendar,
  User,
  Building2,
  Tag
} from 'lucide-react';
import { recordsService } from '../../services/recordsService';
import type { MedicalRecordItem } from '../../types/records';

interface UploadRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (record: MedicalRecordItem) => void;
  existingSessions?: string[];
}

const CATEGORIES = [
  'Lab Report',
  'Radiology',
  'Prescription',
  'Consultation',
  'Discharge Summary',
  'Others'
];

export const UploadRecordModal: React.FC<UploadRecordModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  existingSessions = ['Annual Health Checkup', 'Dr. Sharma Consultation', 'Hospital Visit']
}) => {
  const [files, setFiles] = useState<File[]>([]);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Lab Report');
  const [sessionName, setSessionName] = useState(existingSessions[0] || 'General Records');
  const [isCustomSession, setIsCustomSession] = useState(false);
  const [customSessionName, setCustomSessionName] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [hospital, setHospital] = useState('');
  const [recordDate, setRecordDate] = useState('');
  const [tags, setTags] = useState('Routine');
  const [description, setDescription] = useState('');
  
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndAddFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndAddFiles(Array.from(e.target.files));
    }
  };

  const validateAndAddFiles = (incomingFiles: File[]) => {
    setError(null);
    const validExtensions = ['.pdf', '.jpg', '.jpeg', '.png', '.dicom', '.dcm', '.webp'];
    const valid: File[] = [];

    for (const f of incomingFiles) {
      const ext = f.name.substring(f.name.lastIndexOf('.')).toLowerCase();
      if (!validExtensions.includes(ext)) {
        setError(`File '${f.name}' has unsupported extension. Allowed: ${validExtensions.join(', ')}`);
        return;
      }
      if (f.size > 25 * 1024 * 1024) {
        setError(`File '${f.name}' exceeds maximum allowed size of 25MB.`);
        return;
      }
      valid.push(f);
    }

    setFiles((prev) => {
      const combined = [...prev, ...valid];
      if (!title && combined.length === 1) {
        const cleanName = combined[0].name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ");
        setTitle(cleanName);
      }
      return combined;
    });
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (files.length === 0) {
      setError('Please select or drop at least one file.');
      return;
    }
    if (files.length === 1 && !title.trim()) {
      setError('Please provide a document title.');
      return;
    }

    const finalSession = isCustomSession ? (customSessionName.trim() || 'General Records') : sessionName;

    try {
      setIsUploading(true);
      setError(null);

      const formData = new FormData();
      formData.append('category', category);
      formData.append('session_name', finalSession);
      if (doctorName.trim()) formData.append('doctor_name', doctorName.trim());
      if (hospital.trim()) formData.append('hospital', hospital.trim());
      if (recordDate.trim()) formData.append('record_date', recordDate.trim());
      if (tags.trim()) formData.append('tags', tags.trim());
      if (description.trim()) formData.append('description', description.trim());

      if (files.length === 1) {
        formData.append('title', title.trim() || files[0].name);
        formData.append('file', files[0]);

        const newRecord = await recordsService.uploadRecord(formData, (progress) => {
          setUploadProgress(progress);
        });
        onSuccess(newRecord);
      } else {
        files.forEach((f) => formData.append('files', f));
        const uploadedRecords = await recordsService.uploadMultipleRecords(formData, (progress) => {
          setUploadProgress(progress);
        });
        if (uploadedRecords && uploadedRecords.length > 0) {
          onSuccess(uploadedRecords[0]);
        }
      }

      onClose();
    } catch (err: any) {
      console.error('Upload failed:', err);
      setError(err?.response?.data?.message || 'Failed to upload document(s). Please try again.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Upload Medical Document</h2>
              <p className="text-xs text-slate-500">PDF recommended • Max size 25MB • Secure extraction pipeline</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Drag & Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-200 ${
              isDragging
                ? 'border-teal-500 bg-teal-50/60 scale-[0.99]'
                : files.length > 0
                ? 'border-teal-400 bg-teal-50/20'
                : 'border-slate-300 hover:border-teal-400 hover:bg-slate-50/50'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".pdf,.jpg,.jpeg,.png,.dicom,.dcm,.webp"
              multiple
              className="hidden"
            />
            {files.length > 0 ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1">
                  <span>Selected Reports ({files.length})</span>
                  <span className="text-teal-600 font-semibold hover:underline">+ Add more files</span>
                </div>
                <div className="max-h-36 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl bg-white p-2 text-left">
                  {files.map((f, idx) => (
                    <div key={idx} className="flex items-center justify-between py-1.5 px-2">
                      <div className="flex items-center gap-2.5 truncate">
                        <div className="w-7 h-7 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-[10px] uppercase shrink-0">
                          {f.name.split('.').pop()}
                        </div>
                        <div className="truncate">
                          <p className="text-xs font-semibold text-slate-800 truncate">{f.name}</p>
                          <p className="text-[10px] text-slate-400">{(f.size / (1024 * 1024)).toFixed(2)} MB</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); removeFile(idx); }}
                        className="p-1 text-slate-400 hover:text-rose-600 transition"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="w-12 h-12 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center mx-auto">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <p className="text-sm font-semibold text-slate-800">
                  Drag & drop medical report(s) or <span className="text-teal-600 hover:underline">browse</span>
                </p>
                <p className="text-xs text-slate-400">Supported formats: PDF, JPG, PNG, WEBP, DICOM (Select single or multiple reports)</p>
              </div>
            )}
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Title */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Document Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Complete Blood Count (CBC) Report"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none transition"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none transition"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Session Grouping */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Associate with Session
              </label>
              {isCustomSession ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customSessionName}
                    onChange={(e) => setCustomSessionName(e.target.value)}
                    placeholder="Enter new session name..."
                    className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-teal-500 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setIsCustomSession(false)}
                    className="px-3 py-2 text-xs text-slate-500 hover:text-slate-700 font-medium"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <select
                    value={sessionName}
                    onChange={(e) => {
                      if (e.target.value === '__NEW__') {
                        setIsCustomSession(true);
                      } else {
                        setSessionName(e.target.value);
                      }
                    }}
                    className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-teal-500 outline-none"
                  >
                    {existingSessions.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                    <option value="__NEW__">+ Create New Session</option>
                  </select>
                </div>
              )}
            </div>

            {/* Doctor Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-slate-400" /> Doctor Name
              </label>
              <input
                type="text"
                value={doctorName}
                onChange={(e) => setDoctorName(e.target.value)}
                placeholder="e.g. Dr. Priya Sharma"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-teal-500 outline-none transition"
              />
            </div>

            {/* Hospital / Clinic */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-slate-400" /> Facility / Lab
              </label>
              <input
                type="text"
                value={hospital}
                onChange={(e) => setHospital(e.target.value)}
                placeholder="e.g. City Care Pathology"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-teal-500 outline-none transition"
              />
            </div>

            {/* Document Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" /> Document Date
              </label>
              <input
                type="text"
                value={recordDate}
                onChange={(e) => setRecordDate(e.target.value)}
                placeholder="e.g. 28 Aug 2026"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-teal-500 outline-none transition"
              />
            </div>

            {/* Tags */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-slate-400" /> Tags
              </label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="e.g. Routine, Annual, Follow-up"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-teal-500 outline-none transition"
              />
            </div>

            {/* Description / Notes */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Clinical Notes / Remarks
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional notes regarding this test or consultation..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-teal-500 outline-none transition resize-none"
              />
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50">
          <div className="text-xs text-slate-500">
            {isUploading ? `Uploading and extracting... ${uploadProgress}%` : 'Extracted data requires your review.'}
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isUploading}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isUploading || !title.trim()}
              className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold rounded-xl shadow-sm hover:shadow transition disabled:opacity-50 flex items-center gap-2"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <span>Upload & Extract</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
