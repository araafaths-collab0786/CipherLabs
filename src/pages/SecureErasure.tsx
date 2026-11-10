/**
 * Cipher Labs - Secure Erasure Page
 * Supports Device File/Folder Selection & Drag-and-Drop,
 * Operator Verification Popup with "Save in File Recovery" checkbox,
 * Multi-pass wiping simulation, and High-Contrast Light/Dark mode.
 */

import React, { useState, useRef } from 'react';
import {
  ShieldAlert,
  Eraser,
  FolderOpen,
  CheckCircle2,
  AlertCircle,
  Hash,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Archive,
  Lock,
  FileCheck,
  Play,
  RotateCcw,
  Upload,
  FolderUp,
  FileText,
  X,
  AlertTriangle,
  Download,
  Trash2,
} from 'lucide-react';
import { OperationRecord, RecoveryCopyRecord, ReportRecord, TestFile, UserProfile } from '../types';
import { StorageService, computeSha256 } from '../services/storage';

interface DeviceFileItem {
  id: string;
  name: string;
  size: number;
  type: string;
  lastModified: string;
  dataUrl?: string;
  content?: string;
  path?: string;
  sha256?: string;
}

export interface FileTypeInfo {
  extension: string;
  name: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
}

export const getFileTypeInfo = (fileName: string): FileTypeInfo => {
  const ext = fileName.includes('.') ? fileName.split('.').pop()!.toLowerCase() : '';

  switch (ext) {
    case 'docx':
    case 'doc':
      return {
        extension: `.${ext.toUpperCase()}`,
        name: 'DOCX Word Document',
        badgeBg: 'bg-blue-500/10 dark:bg-blue-500/20',
        badgeText: 'text-blue-700 dark:text-blue-400 font-bold',
        badgeBorder: 'border-blue-500/30',
      };
    case 'pdf':
      return {
        extension: '.PDF',
        name: 'PDF Document',
        badgeBg: 'bg-red-500/10 dark:bg-red-500/20',
        badgeText: 'text-red-700 dark:text-red-400 font-bold',
        badgeBorder: 'border-red-500/30',
      };
    case 'sql':
      return {
        extension: '.SQL',
        name: 'SQL Database Script',
        badgeBg: 'bg-amber-500/10 dark:bg-amber-500/20',
        badgeText: 'text-amber-700 dark:text-amber-400 font-bold',
        badgeBorder: 'border-amber-500/30',
      };
    case 'xlsx':
    case 'xls':
      return {
        extension: `.${ext.toUpperCase()}`,
        name: 'Excel Spreadsheet',
        badgeBg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
        badgeText: 'text-emerald-700 dark:text-emerald-400 font-bold',
        badgeBorder: 'border-emerald-500/30',
      };
    case 'csv':
      return {
        extension: '.CSV',
        name: 'CSV Delimited Data',
        badgeBg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
        badgeText: 'text-emerald-700 dark:text-emerald-400 font-bold',
        badgeBorder: 'border-emerald-500/30',
      };
    case 'json':
    case 'xml':
    case 'yaml':
    case 'yml':
      return {
        extension: `.${ext.toUpperCase()}`,
        name: `${ext.toUpperCase()} Data`,
        badgeBg: 'bg-cyan-500/10 dark:bg-cyan-500/20',
        badgeText: 'text-cyan-700 dark:text-cyan-400 font-bold',
        badgeBorder: 'border-cyan-500/30',
      };
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'webp':
    case 'gif':
    case 'svg':
      return {
        extension: `.${ext.toUpperCase()}`,
        name: 'Image Graphic',
        badgeBg: 'bg-purple-500/10 dark:bg-purple-500/20',
        badgeText: 'text-purple-700 dark:text-purple-400 font-bold',
        badgeBorder: 'border-purple-500/30',
      };
    case 'zip':
    case 'tar':
    case 'gz':
    case '7z':
    case 'rar':
      return {
        extension: `.${ext.toUpperCase()}`,
        name: 'Compressed Archive',
        badgeBg: 'bg-indigo-500/10 dark:bg-indigo-500/20',
        badgeText: 'text-indigo-700 dark:text-indigo-400 font-bold',
        badgeBorder: 'border-indigo-500/30',
      };
    case 'txt':
    case 'log':
    case 'md':
      return {
        extension: `.${ext.toUpperCase()}`,
        name: 'Text Document',
        badgeBg: 'bg-slate-500/10 dark:bg-slate-500/20',
        badgeText: 'text-slate-700 dark:text-slate-400 font-bold',
        badgeBorder: 'border-slate-500/30',
      };
    default:
      return {
        extension: ext ? `.${ext.toUpperCase()}` : 'FILE',
        name: ext ? `${ext.toUpperCase()} File` : 'Binary File',
        badgeBg: 'bg-cyan-500/10 dark:bg-cyan-500/20',
        badgeText: 'text-cyan-700 dark:text-cyan-400 font-bold',
        badgeBorder: 'border-cyan-500/30',
      };
  }
};

interface SecureErasureProps {
  isDark: boolean;
  profile: UserProfile;
  onSimulationCompleted: (op: OperationRecord, copies: RecoveryCopyRecord[], rep: ReportRecord) => void;
  onNavigateToRecovery: () => void;
}

export const SecureErasure: React.FC<SecureErasureProps> = ({
  isDark,
  profile,
  onSimulationCompleted,
  onNavigateToRecovery,
}) => {
  // Device files selected by user (via Drag & Drop or Device File Picker)
  const [deviceFiles, setDeviceFiles] = useState<DeviceFileItem[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);

  // Verification popup modal state
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [saveInRecovery, setSaveInRecovery] = useState(true);
  const [agreementChecked, setAgreementChecked] = useState(false);

  // Deletion execution state
  const [selectedMethod, setSelectedMethod] = useState('NIST 800-88 Rev. 1 Clear (Simulated)');
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentPass, setCurrentPass] = useState(0);
  const [totalPasses, setTotalPasses] = useState(1);
  const [progressPercent, setProgressPercent] = useState(0);
  const [activeFileName, setActiveFileName] = useState('');
  const [deletionResult, setDeletionResult] = useState<{
    operation: OperationRecord;
    recoveryCopies: RecoveryCopyRecord[];
    report: ReportRecord;
    savedToRecovery: boolean;
    fileCount: number;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const methods = [
    {
      id: 'NIST 800-88 Rev. 1 Clear (Simulated)',
      name: 'NIST SP 800-88 Rev. 1 Clear',
      passes: 1,
      description: 'Single-pass cryptographic overwrite and read-verification pass.',
      recommended: true,
    },
    {
      id: 'DoD 5220.22-M (Simulated)',
      name: 'DoD 5220.22-M (3 Passes)',
      passes: 3,
      description: 'Department of Defense 3-pass sequence with complementary byte patterns.',
      recommended: false,
    },
    {
      id: 'BSI-VSITR (Simulated)',
      name: 'BSI-VSITR German Standard (7 Passes)',
      passes: 7,
      description: 'German Federal Office for Information Security 7-pass alternating pattern sequence.',
      recommended: false,
    },
  ];

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Helper to read File into DeviceFileItem with dataUrl and computed SHA-256
  const processRawFiles = async (rawFiles: FileList | File[]) => {
    setIsLoadingFiles(true);
    const newItems: DeviceFileItem[] = [];

    for (let i = 0; i < rawFiles.length; i++) {
      const file = rawFiles[i];
      try {
        const dataUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => resolve('');
          reader.readAsDataURL(file);
        });

        // Compute real SHA-256 hash
        let hash = '';
        try {
          const arrayBuffer = await file.arrayBuffer();
          hash = await computeSha256(new Uint8Array(arrayBuffer));
        } catch {
          hash = await computeSha256(file.name + file.size + file.lastModified);
        }

        newItems.push({
          id: `dev-file-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          name: file.name,
          size: file.size,
          type: file.type || 'Unknown Format',
          lastModified: new Date(file.lastModified).toISOString(),
          dataUrl,
          path: (file as any).webkitRelativePath || file.name,
          sha256: hash,
        });
      } catch (err) {
        console.error('Error reading file:', err);
      }
    }

    setIsLoadingFiles(false);
    if (newItems.length > 0) {
      setDeviceFiles((prev) => [...prev, ...newItems]);
      // Open verification modal immediately as requested
      setAgreementChecked(false);
      setIsVerifyModalOpen(true);
    }
  };

  // Drag and Drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await processRawFiles(e.dataTransfer.files);
    }
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await processRawFiles(e.target.files);
      e.target.value = '';
    }
  };

  const handleFolderInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await processRawFiles(e.target.files);
      e.target.value = '';
    }
  };

  const handleRemoveDeviceFile = (id: string) => {
    setDeviceFiles((prev) => prev.filter((f) => f.id !== id));
  };

  // When user confirms in verification popup
  const handleConfirmAndExecuteDeletion = async () => {
    setIsVerifyModalOpen(false);
    setIsDeleting(true);
    setProgressPercent(5);

    const m = methods.find((item) => item.id === selectedMethod);
    const passes = m ? m.passes : 1;
    setTotalPasses(passes);

    // Multi-pass wiping simulation animation
    for (let p = 1; p <= passes; p++) {
      setCurrentPass(p);
      for (const f of deviceFiles) {
        setActiveFileName(f.name);
        await new Promise((r) => setTimeout(r, 100));
      }
      const progress = Math.round((p / passes) * 90);
      setProgressPercent(progress);
      await new Promise((r) => setTimeout(r, 150));
    }

    setProgressPercent(100);
    await new Promise((r) => setTimeout(r, 200));

    // Execute deletion through StorageService
    const userSignature = `I am ${profile.firstName} ${profile.lastName} (${profile.email}) and I confirm that I want to delete this file.`;
    const result = await StorageService.executeDeviceFileDeletion(
      deviceFiles,
      selectedMethod,
      saveInRecovery,
      userSignature
    );

    setIsDeleting(false);
    setDeletionResult({
      operation: result.operation,
      recoveryCopies: result.recoveryCopies,
      report: result.report,
      savedToRecovery: saveInRecovery,
      fileCount: deviceFiles.length,
    });

    onSimulationCompleted(result.operation, result.recoveryCopies, result.report);
  };

  const handleReset = () => {
    setDeletionResult(null);
    setDeviceFiles([]);
    setProgressPercent(0);
    setCurrentPass(0);
    setActiveFileName('');
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Page Title & Information Banner */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Secure Erasure & File Deletion
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          Select or drop files and folders from this device for verified digital sanitization.
        </p>

        <div className="mt-3 p-3.5 rounded-xl bg-cyan-50 dark:bg-cyan-500/10 border border-cyan-200 dark:border-cyan-500/20 text-xs text-cyan-900 dark:text-cyan-300 flex items-center gap-2.5">
          <ShieldAlert className="w-4 h-4 text-cyan-600 dark:text-cyan-400 shrink-0" />
          <span>
            <strong>Zero Data Remanence Standard:</strong> You can select files or folders from this device to delete.
            Before deletion, a verification popup verifies your identity and asks whether to save an isolated copy in <strong>Recently Deleted</strong> for future restoration.
          </span>
        </div>
      </div>

      {deletionResult ? (
        /* Deletion Completion View */
        <div
          className={`p-6 rounded-2xl border space-y-6 shadow-sm ${
            isDark ? 'bg-[#122A4D] border-[#1E3A5F]' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Secure Deletion Operation Completed
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Operation ID:{' '}
                <span className="font-mono text-cyan-600 dark:text-cyan-400 font-semibold">
                  {deletionResult.operation.id}
                </span>{' '}
                • Method: {deletionResult.operation.method}
              </p>
            </div>
          </div>

          {/* Outcome Status Card */}
          <div
            className={`p-4 rounded-xl border text-xs space-y-2 ${
              deletionResult.savedToRecovery
                ? 'bg-purple-50 dark:bg-purple-500/10 border-purple-200 dark:border-purple-500/20 text-purple-900 dark:text-purple-300'
                : 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-900 dark:text-emerald-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-sm">
                {deletionResult.savedToRecovery ? (
                  <>
                    <Archive className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    <span>Saved in Recently Deleted (Recovery Available)</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Permanently Deleted (No Recovery Data Stored)</span>
                  </>
                )}
              </div>
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-white/70 dark:bg-slate-900/60 border border-current">
                {deletionResult.fileCount} File(s) Processed
              </span>
            </div>

            <p className="text-xs leading-relaxed opacity-90">
              {deletionResult.savedToRecovery
                ? 'The files were sanitized from your active workstation. An isolated encrypted replica was saved in Recently Deleted, allowing you to restore and download them whenever needed.'
                : 'The files were permanently removed with zero recovery data stored, as per your preference.'}
            </p>

            {deletionResult.savedToRecovery && (
              <div className="pt-2">
                <button
                  onClick={onNavigateToRecovery}
                  className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-sm inline-flex items-center gap-1.5 transition-all"
                >
                  <Archive className="w-3.5 h-3.5" />
                  <span>View in Recently Deleted (File Recovery)</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Target Hashes Inspection */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-400">
              Sanitized Targets & SHA-256 Proofs
            </h3>
            <div className="space-y-2">
              {Object.keys(deletionResult.operation.preHashes).map((fileName, idx) => (
                <div
                  key={`${fileName}-${idx}`}
                  className={`p-3 rounded-lg border text-xs font-mono flex flex-col md:flex-row md:items-center justify-between gap-2 ${
                    isDark ? 'bg-[#0B1F3A] border-[#1E3A5F]' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  {(() => {
                    const info = getFileTypeInfo(fileName);
                    return (
                      <div className="font-semibold text-slate-900 dark:text-slate-200 truncate flex items-center gap-2">
                        <span
                          className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-bold border shrink-0 ${info.badgeBg} ${info.badgeText} ${info.badgeBorder}`}
                        >
                          {info.extension}
                        </span>
                        <FileCheck className="w-4 h-4 text-cyan-600 dark:text-cyan-400 shrink-0" />
                        <span className="truncate">{fileName}</span>
                        <span className="text-[10px] text-slate-500 font-sans hidden sm:inline">
                          ({info.name})
                        </span>
                      </div>
                    );
                  })()}
                  <div className="flex items-center gap-3 text-[11px] text-slate-600 dark:text-slate-400">
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Verification Verified
                    </span>
                    <span className="text-slate-500 font-mono">
                      SHA: {deletionResult.operation.preHashes[fileName].substring(0, 20)}...
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-inherit flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-xs text-slate-500 font-mono">
              Report SHA: {deletionResult.report.reportSha256.substring(0, 24)}...
            </span>

            <div className="flex items-center space-x-3">
              <button
                onClick={handleReset}
                className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Delete More Files</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Main Selection & Deletion Workflow */
        <div className="space-y-6">
          {/* Section 1: Drag & Drop or Select Files from this Device */}
          <div
            className={`p-6 rounded-2xl border space-y-4 shadow-sm ${
              isDark ? 'bg-[#122A4D] border-[#1E3A5F]' : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-inherit">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Select Files or Folders to Delete from This Device
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Choose or drag and drop files from your computer to securely sanitize and delete.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="file"
                  multiple
                  ref={fileInputRef}
                  onChange={handleFileInputChange}
                  className="hidden"
                />
                <input
                  type="file"
                  multiple
                  // @ts-ignore
                  webkitdirectory=""
                  directory=""
                  ref={folderInputRef}
                  onChange={handleFolderInputChange}
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-2 rounded-lg bg-[#06B6D4] hover:bg-[#0891B2] text-white text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Select Files</span>
                </button>

                <button
                  type="button"
                  onClick={() => folderInputRef.current?.click()}
                  className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-all"
                >
                  <FolderUp className="w-3.5 h-3.5" />
                  <span>Select Folder</span>
                </button>
              </div>
            </div>

            {/* Drag & Drop Zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`p-8 border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                isDragOver
                  ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-500/10 scale-[1.01]'
                  : isDark
                  ? 'border-slate-700 hover:border-cyan-500/50 bg-[#0B1F3A]/40'
                  : 'border-slate-300 hover:border-cyan-500 bg-slate-50'
              }`}
            >
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center mb-3">
                <Upload className={`w-6 h-6 ${isDragOver ? 'animate-bounce' : ''}`} />
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {isDragOver ? 'Drop files or folders here now' : 'Drag & Drop files or folders here'}
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md mt-1 leading-relaxed">
                Drop files directly from your computer, or click to open your device file manager.
                You can select multiple files or entire folders.
              </p>
              <div className="mt-3 flex items-center gap-2 text-[11px] text-cyan-700 dark:text-cyan-400 font-semibold">
                <span>Identifies and sanitizes any file format: .docx, .pdf, .sql, spreadsheets, archives, and images</span>
              </div>
            </div>



            {/* List of currently selected files from device */}
            {deviceFiles.length > 0 && (
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-400">
                  <span>Selected Files from Device ({deviceFiles.length})</span>
                  <button
                    onClick={() => {
                      setAgreementChecked(false);
                      setIsVerifyModalOpen(true);
                    }}
                    className="text-xs font-bold text-cyan-600 dark:text-cyan-400 hover:underline"
                  >
                    Open Verification Dialog
                  </button>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {deviceFiles.map((file, idx) => (
                    <div
                      key={`${file.id}-${idx}`}
                      className={`p-3 rounded-lg border flex items-center justify-between text-xs font-mono transition-colors ${
                        isDark ? 'bg-[#0B1F3A] border-[#1E3A5F]' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      {(() => {
                        const info = getFileTypeInfo(file.name);
                        return (
                          <div className="flex items-center space-x-3 min-w-0">
                            {/* Format Identifier Badge */}
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-mono font-extrabold border shrink-0 ${info.badgeBg} ${info.badgeText} ${info.badgeBorder}`}
                              title={info.name}
                            >
                              {info.extension}
                            </span>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                                  {file.name}
                                </span>
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-sans hidden sm:inline">
                                  {info.name}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-[11px] text-slate-500 font-sans">
                                <span>{formatBytes(file.size)}</span>
                                {file.path && file.path !== file.name && (
                                  <span className="text-[10px] text-slate-400 truncate">[{file.path}]</span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })()}

                      <div className="flex items-center space-x-3 shrink-0">
                        <span className="text-[11px] text-slate-500 hidden sm:inline">
                          SHA: {file.sha256 ? file.sha256.substring(0, 14) + '...' : 'calculating'}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveDeviceFile(file.id)}
                          className="p-1 rounded text-red-500 hover:bg-red-500/10"
                          title="Remove file"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setAgreementChecked(false);
                      setIsVerifyModalOpen(true);
                    }}
                    className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md flex items-center gap-2 transition-all active:scale-[0.98]"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Proceed to Verification & Delete ({deviceFiles.length})</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Progress Overlay during Deletion */}
      {isDeleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div
            className={`w-full max-w-md p-6 rounded-2xl shadow-2xl border space-y-4 ${
              isDark ? 'bg-[#0B1F3A] border-[#1E3A5F] text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center">
                <RefreshCw className="w-5 h-5 animate-spin" />
              </div>
              <div>
                <h3 className="font-bold text-sm">Executing Secure Sanitization...</h3>
                <p className="text-xs text-slate-500 font-mono">
                  Pass {currentPass} of {totalPasses} • {selectedMethod}
                </p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-500 truncate max-w-[240px]">{activeFileName}</span>
                <span className="font-bold text-cyan-500">{progressPercent}%</span>
              </div>
              <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-teal-400 transition-all duration-150"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            <p className="text-[11px] text-slate-500 text-center">
              Bitwise overwrite and cryptographic verification underway. Please do not close the window.
            </p>
          </div>
        </div>
      )}

      {/* USER VERIFICATION POPUP MODAL (As requested by user!) */}
      {isVerifyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div
            className={`w-full max-w-lg rounded-2xl shadow-2xl border overflow-hidden flex flex-col ${
              isDark
                ? 'bg-[#0B1F3A] border-[#1E3A5F] text-slate-100'
                : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-inherit flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center">
                  <ShieldAlert className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    Identity & Deletion Verification
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Confirmation required before deleting files
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsVerifyModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto text-xs">
              {/* User Identity Affirmation */}
              <div
                className={`p-4 rounded-xl border space-y-1.5 ${
                  isDark
                    ? 'bg-cyan-500/10 border-cyan-500/20 text-cyan-200'
                    : 'bg-cyan-50 border-cyan-200 text-cyan-900'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-cyan-700 dark:text-cyan-400">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Operator Identity Verification</span>
                </div>
                <p className="text-xs leading-relaxed font-semibold">
                  I am <strong className="text-cyan-700 dark:text-cyan-300 underline">{profile.firstName} {profile.lastName}</strong> (
                  <span className="font-mono text-cyan-800 dark:text-cyan-300">{profile.email}</span>) and I confirm that I want to delete these file(s).
                </p>
              </div>

              {/* Selected Files to Delete */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-400">
                  Target Files to Delete ({deviceFiles.length})
                </span>
                <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
                  {deviceFiles.map((file, idx) => (
                    <div
                      key={`${file.id}-${idx}`}
                      className={`p-2.5 rounded-lg border text-xs font-mono flex items-center justify-between ${
                        isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      {(() => {
                        const info = getFileTypeInfo(file.name);
                        return (
                          <div className="flex items-center gap-2 truncate">
                            <span className="text-slate-400 text-[10px]">#{idx + 1}</span>
                            <span
                              className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold border shrink-0 ${info.badgeBg} ${info.badgeText} ${info.badgeBorder}`}
                            >
                              {info.extension}
                            </span>
                            <span className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                              {file.name}
                            </span>
                            <span className="text-slate-500 text-[11px]">({formatBytes(file.size)})</span>
                          </div>
                        );
                      })()}
                      <span className="text-[10px] text-slate-400 font-mono shrink-0">
                        {file.sha256 ? file.sha256.substring(0, 10) + '...' : ''}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Checkbox 1: Save it in File Recovery or not (Requested by user!) */}
              <div
                className={`p-3.5 rounded-xl border flex items-start gap-3 transition-colors ${
                  saveInRecovery
                    ? isDark
                      ? 'bg-purple-500/10 border-purple-500/30'
                      : 'bg-purple-50 border-purple-200'
                    : isDark
                    ? 'bg-slate-900/40 border-slate-800'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <input
                  type="checkbox"
                  id="saveInRecoveryCheckbox"
                  checked={saveInRecovery}
                  onChange={(e) => setSaveInRecovery(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-purple-600 accent-purple-600 cursor-pointer"
                />
                <label htmlFor="saveInRecoveryCheckbox" className="text-xs cursor-pointer space-y-1">
                  <span className="font-bold text-slate-900 dark:text-slate-100 block">
                    Save it in File Recovery (Recently Deleted)
                  </span>
                  <span className="text-slate-600 dark:text-slate-400 block leading-relaxed text-[11px]">
                    {saveInRecovery ? (
                      <span className="text-purple-700 dark:text-purple-300 font-medium">
                        ✓ An isolated encrypted copy will be preserved in <strong>Recently Deleted</strong>. You will be able to restore and download this exact file anytime from the File Recovery tab.
                      </span>
                    ) : (
                      <span className="text-red-600 dark:text-red-400 font-medium">
                        ⚠ Permanent Deletion: Zero recovery copies will be saved. File cannot be restored from Recently Deleted.
                      </span>
                    )}
                  </span>
                </label>
              </div>

              {/* Checkbox 2: Agreement Confirmation */}
              <div
                className={`p-3.5 rounded-xl border flex items-start gap-3 ${
                  isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <input
                  type="checkbox"
                  id="agreeCheckbox"
                  checked={agreementChecked}
                  onChange={(e) => setAgreementChecked(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-cyan-600 accent-cyan-600 cursor-pointer"
                />
                <label htmlFor="agreeCheckbox" className="text-xs cursor-pointer">
                  <span className="font-bold text-slate-900 dark:text-slate-100 block">
                    I agree to execute this deletion
                  </span>
                  <span className="text-slate-600 dark:text-slate-400 block text-[11px] mt-0.5">
                    I understand this operation will execute using {selectedMethod} and log a signed audit entry.
                  </span>
                </label>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-4 border-t border-inherit flex items-center justify-between">
              <button
                type="button"
                onClick={() => setIsVerifyModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold transition-all"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={!agreementChecked}
                onClick={handleConfirmAndExecuteDeletion}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-md flex items-center gap-2 transition-all ${
                  !agreementChecked
                    ? 'bg-slate-400 dark:bg-slate-700 cursor-not-allowed opacity-60'
                    : 'bg-red-600 hover:bg-red-700 active:scale-[0.98]'
                }`}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Confirm & Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
