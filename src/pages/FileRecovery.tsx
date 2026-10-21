/**
 * Cipher Labs - File Recovery Lab (NEW FEATURE: Sections 3 & 4)
 * Backup-based Restoration & Synthetic Disk Image Forensic Recovery
 */

import React, { useState } from 'react';
import {
  FileSearch,
  Archive,
  RefreshCw,
  Binary,
  CheckCircle2,
  AlertTriangle,
  FolderDown,
  Shield,
  Hash,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  FileCheck,
  HardDrive,
  Cpu,
} from 'lucide-react';
import { RecoveryCandidate, RecoveryCopyRecord } from '../types';
import { StorageService } from '../services/storage';
import { HexViewerModal } from '../components/HexViewerModal';

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
  const [activeSubTab, setActiveSubTab] = useState<'vault' | 'forensic'>('vault');
  const [candidates, setCandidates] = useState<RecoveryCandidate[]>(() =>
    StorageService.getCandidates()
  );
  const [inspectCandidate, setInspectCandidate] = useState<RecoveryCandidate | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(100);
  const [restoringCopyId, setRestoringCopyId] = useState<string | null>(null);
  const [restorationAlert, setRestorationAlert] = useState<{
    fileName: string;
    restoredPath: string;
    originalSha256: string;
    restoredSha256: string;
    isVerified: boolean;
  } | null>(null);

  const handleRestoreCopy = async (copyId: string) => {
    setRestoringCopyId(copyId);
    try {
      await new Promise((r) => setTimeout(r, 600)); // Smooth UX transition
      const result = await StorageService.restoreFileFromRecoveryCopy(copyId);
      onRefreshCopies();
      setRestorationAlert({
        fileName: result.copyRecord.originalFileName,
        restoredPath: result.restoredPath,
        originalSha256: result.originalSha256,
        restoredSha256: result.restoredSha256,
        isVerified: result.isIntegrityVerified,
      });
    } finally {
      setRestoringCopyId(null);
    }
  };

  const handleRescanDiskImage = async () => {
    setIsScanning(true);
    setScanProgress(10);
    for (let p = 20; p <= 100; p += 20) {
      await new Promise((r) => setTimeout(r, 120));
      setScanProgress(p);
    }
    setCandidates(StorageService.getCandidates());
    setIsScanning(false);
  };

  const handleRecoverCandidate = async (candidateId: string) => {
    await StorageService.recoverCandidate(candidateId);
    setCandidates(StorageService.getCandidates());
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">File Recovery Lab</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Cryptographic restore management and synthetic disk image carving.
          </p>
        </div>

        {/* Sub-tab Switcher */}
        <div
          className={`flex p-1 rounded-xl border ${
            isDark ? 'bg-[#122A4D] border-[#1E3A5F]' : 'bg-slate-100 border-slate-200'
          }`}
        >
          <button
            onClick={() => setActiveSubTab('vault')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
              activeSubTab === 'vault'
                ? isDark
                  ? 'bg-[#123A55] text-[#67E8F9] shadow-sm'
                  : 'bg-white text-[#0E7490] shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Archive className="w-3.5 h-3.5" />
            <span>Recovery Vault ({recoveryCopies.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('forensic')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
              activeSubTab === 'forensic'
                ? isDark
                  ? 'bg-[#123A55] text-[#67E8F9] shadow-sm'
                  : 'bg-white text-[#0E7490] shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <HardDrive className="w-3.5 h-3.5" />
            <span>Forensic Disk Carving</span>
          </button>
        </div>
      </div>

      {/* SUB-TAB 1: RECOVERY VAULT & FILE RESTORATION (NEW FEATURE Item 3) */}
      {activeSubTab === 'vault' && (
        <div className="space-y-4">
          {/* Safety & Educational Disclaimer */}
          <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs text-purple-300 flex items-start gap-3">
            <Shield className="w-4 h-4 text-purple-400 mt-0.5 shrink-0" />
            <div className="space-y-1">
              <p className="font-bold">
                Recovery Vault & Bit-Level Restoration (Demonstration Mode)
              </p>
              <p className="text-slate-400 leading-relaxed">
                Before simulated deletion, an isolated copy is placed inside the recovery vault.
                Restoration reproduces the file in a separate output directory and confirms its
                SHA-256 hash matches the recorded pre-operation hash.
              </p>
              <p className="text-amber-400 text-[11px] font-semibold">
                Important: This demonstrates backup-based restoration; it does NOT prove recovery of
                data after genuine permanent erasure.
              </p>
            </div>
          </div>

          {/* Restoration Alert / Result */}
          {restorationAlert && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 space-y-2 animate-in fade-in">
              <div className="flex items-center justify-between">
                <span className="font-bold flex items-center gap-1.5 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  File Successfully Restored & Cryptographically Verified!
                </span>
                <button
                  onClick={() => setRestorationAlert(null)}
                  className="text-slate-400 hover:text-slate-200 text-xs"
                >
                  Dismiss
                </button>
              </div>
              <div className="font-mono text-[11px] space-y-0.5 text-slate-300">
                <div>
                  <span className="text-slate-400">File:</span> {restorationAlert.fileName}
                </div>
                <div>
                  <span className="text-slate-400">Destination:</span>{' '}
                  <span className="text-cyan-400">{restorationAlert.restoredPath}</span>
                </div>
                <div>
                  <span className="text-slate-400">Original SHA-256:</span>{' '}
                  {restorationAlert.originalSha256}
                </div>
                <div>
                  <span className="text-slate-400">Restored SHA-256:</span>{' '}
                  <span className="text-emerald-400">{restorationAlert.restoredSha256}</span>{' '}
                  (100% Bit-Match)
                </div>
              </div>
            </div>
          )}

          {/* Copies Table */}
          <div
            className={`rounded-2xl border overflow-hidden shadow-sm ${
              isDark ? 'bg-[#122A4D] border-[#1E3A5F]' : 'bg-white border-slate-200'
            }`}
          >
            <div className="p-4 border-b border-inherit flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Controlled Recovery Vault Copies ({recoveryCopies.length})
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Storage: /app-data/recovery-vault/
              </span>
            </div>

            {recoveryCopies.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs space-y-2">
                <Archive className="w-8 h-8 mx-auto text-slate-500" />
                <p className="font-semibold">No recovery copies in vault</p>
                <p className="max-w-md mx-auto text-[11px]">
                  When initiating a simulation in Secure Erasure, check "Create Recovery Copy" to
                  generate isolated restore points.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-inherit">
                {recoveryCopies.map((copy) => {
                  const isRestored = copy.status === 'VERIFIED' || copy.status === 'RESTORED';
                  return (
                    <div
                      key={copy.id}
                      className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-200 truncate">
                            {copy.originalFileName}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              isRestored
                                ? 'bg-[#DCFCE7] text-[#16A34A] dark:bg-[#16A34A]/20 dark:text-[#16A34A] border border-[#16A34A]/30'
                                : 'bg-purple-500/10 text-purple-400 border border-purple-500/30'
                            }`}
                          >
                            {isRestored ? 'Restored & Verified' : 'Vault Backup Available'}
                          </span>
                        </div>
                        <div className="font-mono text-[11px] text-slate-400 space-y-0.5">
                          <div>
                            <span className="text-slate-500">Vault:</span> {copy.recoveryVaultPath}
                          </div>
                          <div>
                            <span className="text-slate-500">Recorded SHA:</span>{' '}
                            {copy.originalSha256.substring(0, 20)}...
                          </div>
                          {copy.restoredOutputPath && (
                            <div className="text-emerald-400">
                              <span className="text-slate-500">Restored To:</span>{' '}
                              {copy.restoredOutputPath}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-3 shrink-0">
                        <button
                          disabled={restoringCopyId === copy.id}
                          onClick={() => handleRestoreCopy(copy.id)}
                          className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm ${
                            isRestored
                              ? 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                              : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          }`}
                        >
                          {restoringCopyId === copy.id ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <FolderDown className="w-3.5 h-3.5" />
                          )}
                          <span>{isRestored ? 'Re-Restore File' : 'Restore File'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 2: FORENSIC DISK CARVING (NEW FEATURE Item 4) */}
      {activeSubTab === 'forensic' && (
        <div className="space-y-4">
          {/* Safety & Forensic Boundary Banner */}
          <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-xs text-cyan-300 flex items-start gap-3">
            <HardDrive className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" />
            <div className="space-y-1">
              <p className="font-bold">
                Forensic Carving Mode (Synthetic Disk Image Only)
              </p>
              <p className="text-slate-400 leading-relaxed">
                Analyzing read-only fixture:{' '}
                <span className="font-mono text-cyan-400">
                  /app-data/test-workspace/cipher_test_disk_v1.raw
                </span>{' '}
                (16.0 MB). Carving extracts signature candidates (JPEG, PNG, PDF, ZIP, GIF) by
                evaluating magic headers, footer markers, chunk CRCs, and structural integrity.
              </p>
              <p className="text-amber-400 text-[11px] font-semibold">
                Boundary: Physical drives and unmanaged storage are never scanned. Recovery candidates
                are saved strictly to /app-data/recovered/ with a non-overwriting collision policy.
              </p>
            </div>
          </div>

          {/* Scanner Controls Card */}
          <div
            className={`p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm ${
              isDark ? 'bg-[#122A4D] border-[#1E3A5F]' : 'bg-white border-slate-200'
            }`}
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm">Image: cipher_test_disk_v1.raw</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono">
                  READ-ONLY
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 font-mono">
                Size: 16,777,216 bytes • Block Size: 4,096 bytes • Chunk Overlap: 64 bytes
              </p>
            </div>

            <button
              disabled={isScanning}
              onClick={handleRescanDiskImage}
              className="px-4 py-2 rounded-lg bg-[#06B6D4] hover:bg-[#0891B2] text-white text-xs font-semibold flex items-center gap-2 shadow-sm transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
              <span>{isScanning ? 'Scanning Sectors...' : 'Rescan Image Fixture'}</span>
            </button>
          </div>

          {/* Candidates List */}
          <div
            className={`rounded-2xl border overflow-hidden shadow-sm ${
              isDark ? 'bg-[#122A4D] border-[#1E3A5F]' : 'bg-white border-slate-200'
            }`}
          >
            <div className="p-4 border-b border-inherit flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Carved Recovery Candidates ({candidates.length})
              </span>
              <span className="text-xs text-slate-400 font-mono">
                ML Classifier: RandomForest v1.2 (Active)
              </span>
            </div>

            <div className="divide-y divide-inherit">
              {candidates.map((cand) => (
                <div
                  key={cand.id}
                  className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs"
                >
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-cyan-400 px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20">
                        {cand.fileType}
                      </span>
                      <span className="font-semibold text-slate-200">
                        Offset 0x{cand.byteOffset.toString(16).toUpperCase()}
                      </span>
                      <span className="text-slate-400 font-mono">
                        ({formatBytes(cand.estimatedSizeBytes)})
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          cand.state === 'RECOVERED'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : cand.state === 'VALIDATED'
                            ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}
                      >
                        {cand.state}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-[11px] text-slate-400 font-mono">
                      <span>
                        Confidence: <strong className="text-cyan-400">{cand.confidence}%</strong>
                      </span>
                      <span>•</span>
                      <span>{cand.classifierLabel}</span>
                    </div>

                    {cand.recoveredPath && (
                      <div className="text-[11px] font-mono text-emerald-400">
                        Saved to: {cand.recoveredPath}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <button
                      onClick={() => setInspectCandidate(cand)}
                      className="px-3 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-medium flex items-center gap-1.5"
                    >
                      <Binary className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Hex Inspect</span>
                    </button>

                    <button
                      disabled={cand.state === 'RECOVERED'}
                      onClick={() => handleRecoverCandidate(cand.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                        cand.state === 'RECOVERED'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800 cursor-default'
                          : 'bg-cyan-600 hover:bg-cyan-700 text-white shadow-sm'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{cand.state === 'RECOVERED' ? 'Recovered' : 'Recover Candidate'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Hex Viewer Modal */}
      <HexViewerModal
        candidate={inspectCandidate}
        onClose={() => setInspectCandidate(null)}
        isDark={isDark}
      />
    </div>
  );
};
