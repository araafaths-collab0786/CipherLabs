import React, { useRef, useState } from 'react';
import {
  Archive,
  RefreshCw,
  CheckCircle2,
  FolderDown,
} from 'lucide-react';
import { invoke, isTauri } from '@tauri-apps/api/core';
import { RecoveryCopyRecord } from '../types';
import { StorageService } from '../services/storage';
import { getFileTypeInfo } from './SecureErasure';

interface FileRecoveryProps {
  isDark: boolean;
  recoveryCopies: RecoveryCopyRecord[];
  onRefreshCopies: () => void;
}

export const FileRecovery: React.FC<FileRecoveryProps> = ({
  isDark,
  recoveryCopies,
  onRefreshCopies,
}) => {
  const [restoringCopyId, setRestoringCopyId] = useState<string | null>(null);
  const [restorationError, setRestorationError] = useState<string | null>(null);
  const [copyNeedingSource, setCopyNeedingSource] = useState<string | null>(null);
  const recoveryFileInputRef = useRef<HTMLInputElement>(null);
  const [restorationAlert, setRestorationAlert] = useState<{
    fileName: string;
    destination: string;
  } | null>(null);

  const saveRestoredFile = async (
    copy: RecoveryCopyRecord,
    file: Blob
  ): Promise<{ auditPath: string; displayDestination: string }> => {
    if (isTauri()) {
      const fileBytes = Array.from(new Uint8Array(await file.arrayBuffer()));
      const destinations = await invoke<string[]>('restore_file_to_device', {
        fileName: copy.originalFileName,
        fileBytes,
      });
      return {
        auditPath: destinations.join(' and '),
        displayDestination: `/app-data/restored-output/${copy.originalFileName} (and internal Downloads + User Downloads)`,
      };
    }

    const downloadUrl = URL.createObjectURL(file);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = copy.originalFileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
    return {
      auditPath: 'Browser Downloads (download initiated)',
      displayDestination: 'Browser Downloads (download initiated)',
    };
  };

  const handleRestoreCopy = async (copy: RecoveryCopyRecord) => {
    setRestoringCopyId(copy.id);
    setRestorationError(null);
    setRestorationAlert(null);
    try {
      const result = await StorageService.restoreFileFromRecoveryCopy(copy.id);
      if (!result.isIntegrityVerified) {
        throw new Error('The recovered file did not pass SHA-256 verification.');
      }

      const savedFile = await saveRestoredFile(result.copyRecord, result.fileBlob);
      await StorageService.completeFileRestoration(copy.id, savedFile.auditPath, result.restoredSha256);

      onRefreshCopies();
      setRestorationAlert({
        fileName: result.copyRecord.originalFileName,
        destination: savedFile.displayDestination,
      });
      setCopyNeedingSource(null);
    } catch (error) {
      setRestorationError(error instanceof Error ? error.message : 'The file could not be restored.');
      setCopyNeedingSource(copy.id);
    } finally {
      setRestoringCopyId(null);
    }
  };

  const handleChooseRecoverySource = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    const copy = recoveryCopies.find((item) => item.id === copyNeedingSource);
    event.target.value = '';
    if (!file || !copy) return;

    try {
      await StorageService.saveRecoveryFileForCopy(copy.id, file);
      await handleRestoreCopy(copy);
    } catch (error) {
      setRestorationError(error instanceof Error ? error.message : 'The selected file could not be verified.');
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          File Recovery Lab
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
          Recover files preserved in Recently Deleted.
        </p>
      </div>

      {/* RECENTLY DELETED SECTION */}
      <div className="space-y-4">
        {/* Explanation Banner */}
        <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/20 text-xs text-purple-900 dark:text-purple-300 flex items-start gap-3">
          <Archive className="w-4 h-4 text-purple-600 dark:text-purple-400 mt-0.5 shrink-0" />
          <div className="space-y-1">
            <p className="font-bold">
              Recently Deleted — Restore & Download Files
            </p>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              When you delete files with <strong>"Save it in File Recovery"</strong> enabled, an isolated encrypted restore point is created here.
              Click <strong>"Restore File"</strong> or <strong>"Re-Restore File"</strong> to immediately download the exact file back to your device with 100% cryptographic SHA-256 verification.
            </p>
          </div>
        </div>

        {restorationError && (
          <div role="alert" className="p-4 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-xs text-rose-900 dark:text-rose-300">
            <p className="font-bold">File was not restored</p>
            <p className="mt-1">{restorationError}</p>
            {copyNeedingSource && (
              <div className="mt-3">
                <p className="mb-2">If you still have the original file, select it to verify its SHA-256 hash and restore it to the app’s internal Downloads folder.</p>
                <button
                  type="button"
                  onClick={() => recoveryFileInputRef.current?.click()}
                  className="px-3 py-2 rounded-lg bg-rose-700 hover:bg-rose-800 text-white font-semibold"
                >
                  Select original file to verify
                </button>
                <input
                  ref={recoveryFileInputRef}
                  type="file"
                  className="hidden"
                  onChange={handleChooseRecoverySource}
                />
              </div>
            )}
          </div>
        )}

        {/* Restoration Alert / Download Notification */}
        {restorationAlert && (
          <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 text-xs text-emerald-900 dark:text-emerald-300 space-y-2 animate-in fade-in">
            <div className="flex items-center justify-between">
              <span className="font-bold flex items-center gap-1.5 text-sm text-emerald-800 dark:text-emerald-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                File Downloaded & Restored to Your Device!
              </span>
              <button
                onClick={() => setRestorationAlert(null)}
                className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 text-xs font-semibold"
              >
                Dismiss
              </button>
            </div>
            <div className="font-mono text-[11px] space-y-1 text-slate-700 dark:text-slate-300 bg-white/60 dark:bg-slate-900/40 p-2.5 rounded-lg border border-emerald-200 dark:border-emerald-500/20">
              <div>
                <span className="text-slate-500">File Downloaded:</span>{' '}
                <strong className="text-emerald-700 dark:text-emerald-300">{restorationAlert.fileName}</strong>
              </div>
              <div>
                <span className="text-slate-500">Destination:</span>{' '}
                <span className="text-cyan-700 dark:text-cyan-400">{restorationAlert.destination}</span>
              </div>
              <div>
                <span className="text-slate-500">Cryptographic Bit-Match:</span>{' '}
                <span className="text-emerald-700 dark:text-emerald-400 font-bold">100% Verified (Exact Pre-Deletion Match)</span>
              </div>
            </div>
          </div>
        )}

        {/* Recently Deleted Table */}
        <div
          className={`rounded-2xl border overflow-hidden shadow-sm ${
            isDark ? 'bg-[#122A4D] border-[#1E3A5F]' : 'bg-white border-slate-200'
          }`}
        >
          <div className="p-4 border-b border-inherit flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Recently Deleted File Replicas ({recoveryCopies.length})
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              Retention Mode: User Managed
            </span>
          </div>

          {recoveryCopies.length === 0 ? (
            <div className="p-8 text-center space-y-2">
              <Archive className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                No Recently Deleted files stored yet.
              </p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Delete files in Secure Erasure with <strong>"Save it in File Recovery"</strong> checked to keep encrypted restoration copies here.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-inherit">
              {recoveryCopies.map((copy, idx) => {
                const isRestored = copy.status === 'VERIFIED' || copy.status === 'RESTORED';
                return (
                  <div
                    key={`${copy.id}-${idx}`}
                    className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/30"
                  >
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {(() => {
                          const info = getFileTypeInfo(copy.originalFileName);
                          return (
                            <span
                              className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-bold border shrink-0 ${info.badgeBg} ${info.badgeText} ${info.badgeBorder}`}
                              title={info.name}
                            >
                              {info.extension}
                            </span>
                          );
                        })()}
                        <span className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">
                          {copy.originalFileName}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isRestored
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30'
                              : 'bg-purple-100 text-purple-800 dark:bg-purple-500/20 dark:text-purple-300 border border-purple-300 dark:border-purple-500/30'
                          }`}
                        >
                          {isRestored ? 'Restored & Downloaded' : 'Recovery Available'}
                        </span>
                        {copy.source === 'device' && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-cyan-100 text-cyan-800 dark:bg-cyan-500/20 dark:text-cyan-300 font-semibold">
                            Device File
                          </span>
                        )}
                      </div>

                      <div className="font-mono text-[11px] text-slate-600 dark:text-slate-400 space-y-0.5">
                        {copy.sizeBytes && (
                          <div>
                            <span className="text-slate-500">Size:</span> {formatBytes(copy.sizeBytes)}
                          </div>
                        )}
                        <div>
                          <span className="text-slate-500">Deleted:</span>{' '}
                          {new Date(copy.createdAt).toLocaleString()}
                        </div>
                        <div>
                          <span className="text-slate-500">Recorded SHA:</span>{' '}
                          {copy.originalSha256.substring(0, 24)}...
                        </div>
                        {copy.restoredOutputPath && (
                          <div className="text-emerald-700 dark:text-emerald-400">
                            <span className="text-slate-500">Restored To:</span>{' '}
                            {copy.restoredOutputPath.startsWith('Browser Downloads')
                              ? copy.restoredOutputPath
                              : `/app-data/restored-output/${copy.originalFileName}`}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 shrink-0">
                      <button
                        disabled={restoringCopyId === copy.id}
                        onClick={() => handleRestoreCopy(copy)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-[0.98] ${
                          isRestored
                            ? 'bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        }`}
                      >
                        {restoringCopyId === copy.id ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <FolderDown className="w-3.5 h-3.5" />
                        )}
                        <span>{isRestored ? 'Re-Restore & Download' : 'Restore & Download'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
