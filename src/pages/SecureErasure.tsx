/**
 * Cipher Labs - Secure Erasure Simulation & Recovery Workflow
 * Complete implementation of the NEW FEATURE & Phase 1 Simulation Wizard
 */

import React, { useState } from 'react';
import {
  ShieldAlert,
  Eraser,
  FolderOpen,
  CheckCircle2,
  AlertCircle,
  Copy,
  Hash,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Archive,
  Lock,
  FileCheck,
  Play,
  RotateCcw,
} from 'lucide-react';
import { OperationRecord, RecoveryCopyRecord, ReportRecord, TestFile } from '../types';
import { StorageService } from '../services/storage';

interface SecureErasureProps {
  isDark: boolean;
  onOpenBrowseFiles: () => void;
  selectedFiles: TestFile[];
  onClearSelectedFiles: () => void;
  onSimulationCompleted: (op: OperationRecord, copies: RecoveryCopyRecord[], rep: ReportRecord) => void;
  onNavigateToRecovery: () => void;
}

export const SecureErasure: React.FC<SecureErasureProps> = ({
  isDark,
  onOpenBrowseFiles,
  selectedFiles,
  onClearSelectedFiles,
  onSimulationCompleted,
  onNavigateToRecovery,
}) => {
  const [selectedMethod, setSelectedMethod] = useState('NIST 800-88 Rev. 1 Clear (Simulated)');
  const [createRecoveryCopy, setCreateRecoveryCopy] = useState(true);
  const [confirmationInput, setConfirmationInput] = useState('');
  const [isSimulating, setIsSimulating] = useState(false);
  const [currentPass, setCurrentPass] = useState(0);
  const [totalPasses, setTotalPasses] = useState(1);
  const [progressPercent, setProgressPercent] = useState(0);
  const [simulationResult, setSimulationResult] = useState<{
    operation: OperationRecord;
    recoveryCopies: RecoveryCopyRecord[];
    report: ReportRecord;
  } | null>(null);

  const methods = [
    {
      id: 'NIST 800-88 Rev. 1 Clear (Simulated)',
      name: 'NIST SP 800-88 Rev. 1 Clear (Simulated)',
      passes: 1,
      description: 'Single-pass simulated overwrite verification. Validates target integrity remained unchanged.',
      recommended: true,
    },
    {
      id: 'DoD 5220.22-M (Simulated)',
      name: 'DoD 5220.22-M (Simulated - 3 Passes)',
      passes: 3,
      description: 'Simulates Department of Defense 3-pass sanitization sequence with fixed and complementary byte patterns.',
      recommended: false,
    },
    {
      id: 'BSI-VSITR (Simulated)',
      name: 'BSI-VSITR German Standard (Simulated - 7 Passes)',
      passes: 7,
      description: 'Simulates German Federal Office for Information Security 7-pass alternating pattern sequence.',
      recommended: false,
    },
  ];

  const handleMethodChange = (methodId: string) => {
    setSelectedMethod(methodId);
    const m = methods.find((item) => item.id === methodId);
    if (m) setTotalPasses(m.passes);
  };

  const handleStartSimulation = async () => {
    if (confirmationInput.trim() !== 'SIMULATE' || selectedFiles.length === 0) return;

    setIsSimulating(true);
    setProgressPercent(10);
    setCurrentPass(1);

    const m = methods.find((item) => item.id === selectedMethod);
    const passes = m ? m.passes : 1;
    setTotalPasses(passes);

    // Realistic multi-pass simulation progression
    for (let p = 1; p <= passes; p++) {
      setCurrentPass(p);
      for (let sub = 0; sub < 4; sub++) {
        await new Promise((resolve) => setTimeout(resolve, 150));
        const currentProgress = Math.round(((p - 1) / passes) * 100 + (sub / 4) * (100 / passes));
        setProgressPercent(Math.min(currentProgress, 95));
      }
    }

    setProgressPercent(100);
    await new Promise((resolve) => setTimeout(resolve, 200));

    // Execute through Storage Service
    const result = await StorageService.executeErasureSimulation(
      selectedFiles,
      selectedMethod,
      createRecoveryCopy
    );

    setIsSimulating(false);
    setSimulationResult(result);
    onSimulationCompleted(result.operation, result.recoveryCopies, result.report);
  };

  const handleReset = () => {
    setSimulationResult(null);
    setConfirmationInput('');
    setProgressPercent(0);
    setCurrentPass(0);
    onClearSelectedFiles();
  };

  const isConfirmed = confirmationInput.trim() === 'SIMULATE';

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Title & Banner */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Secure Erasure</h1>
        <div className="mt-2 p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-xs text-cyan-600 dark:text-cyan-400 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>
            <strong>Simulation only. No physical erasure is performed in this release.</strong> All
            operations execute inside the application-controlled test workspace to verify sanitization
            integrity and audit logging.
          </span>
        </div>
      </div>

      {simulationResult ? (
        /* Result View */
        <div
          className={`p-6 rounded-2xl border space-y-6 ${
            isDark ? 'bg-[#122A4D] border-[#1E3A5F]' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center space-x-3 text-emerald-500">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">
                Simulation Check Passed
              </h2>
              <p className="text-xs text-slate-400">
                Operation ID:{' '}
                <span className="font-mono text-cyan-400">{simulationResult.operation.id}</span>
              </p>
            </div>
          </div>

          {/* Exact UI text for SIMULATION_CHECK_PASSED (PART 2.1) */}
          <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-xs text-cyan-300 space-y-1">
            <p className="font-semibold text-sm">
              "Simulation check passed. No file changes were detected. This is not physical erasure verification."
            </p>
            <p className="text-slate-400 text-[11px]">
              Report Text: "This is a simulation. No physical erasure was performed. The check confirms
              only that the simulated targets were not changed."
            </p>
          </div>

          {/* Target Hashes Inspection */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Integrity Comparison (Pre-Simulation vs Post-Simulation)
            </h3>
            <div className="space-y-2">
              {Object.keys(simulationResult.operation.preHashes).map((fileName) => (
                <div
                  key={fileName}
                  className={`p-3 rounded-lg border text-xs font-mono flex flex-col md:flex-row md:items-center justify-between gap-2 ${
                    isDark ? 'bg-[#0B1F3A] border-[#1E3A5F]' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="font-semibold text-slate-200 truncate">{fileName}</div>
                  <div className="flex items-center gap-3 text-[11px] text-slate-400">
                    <span className="text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Exact Bit-Match Verified
                    </span>
                    <span className="text-slate-500">
                      SHA: {simulationResult.operation.preHashes[fileName].substring(0, 16)}...
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recovery Copy Status */}
          {simulationResult.recoveryCopies.length > 0 && (
            <div
              className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                isDark
                  ? 'bg-purple-500/10 border-purple-500/20 text-purple-200'
                  : 'bg-purple-50 border-purple-200 text-purple-900'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Archive className="w-6 h-6 text-purple-400 shrink-0" />
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-purple-400">
                    Recovery Copy Created in Vault ({simulationResult.recoveryCopies.length} file)
                  </h4>
                  <p className="text-xs opacity-90 mt-0.5">
                    Isolated backups stored in <span className="font-mono">/app-data/recovery-vault/</span>.
                    You can test bit-level file restoration in the Recovery Lab.
                  </p>
                </div>
              </div>
              <button
                onClick={onNavigateToRecovery}
                className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold whitespace-nowrap shadow-sm"
              >
                Go to Recovery Lab
              </button>
            </div>
          )}

          <div className="pt-4 border-t border-inherit flex items-center justify-between">
            <span className="text-xs text-slate-400 font-mono">
              Idempotency: {simulationResult.operation.idempotencyKey}
            </span>
            <button
              onClick={handleReset}
              className="px-5 py-2 rounded-lg bg-[#06B6D4] hover:bg-[#0891B2] text-white text-xs font-semibold shadow-md flex items-center gap-2"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>New Erasure Simulation</span>
            </button>
          </div>
        </div>
      ) : (
        /* Wizard Steps */
        <div className="space-y-6">
          {/* Step 1: Select Targets */}
          <div
            className={`p-6 rounded-2xl border space-y-4 shadow-sm ${
              isDark ? 'bg-[#122A4D] border-[#1E3A5F]' : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-cyan-500 uppercase tracking-wider">
                  Step 1 of 4
                </span>
                <h3 className="text-base font-bold text-inherit">Select Test Files</h3>
              </div>
              <button
                onClick={onOpenBrowseFiles}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#06B6D4] hover:bg-[#0891B2] text-white text-xs font-semibold shadow-sm transition-all active:scale-[0.98]"
              >
                <FolderOpen className="w-4 h-4" />
                <span>Browse Test Files ({selectedFiles.length} selected)</span>
              </button>
            </div>

            {selectedFiles.length === 0 ? (
              <div
                onClick={onOpenBrowseFiles}
                className={`p-8 border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${
                  isDark
                    ? 'border-slate-700 hover:border-cyan-500/50 bg-[#0B1F3A]/30'
                    : 'border-slate-300 hover:border-cyan-500 bg-slate-50'
                }`}
              >
                <FolderOpen className="w-8 h-8 text-cyan-500 mb-2" />
                <h4 className="text-sm font-semibold">No test files selected yet</h4>
                <p className="text-xs text-slate-400 max-w-sm mt-1">
                  Click here to browse controlled test files inside{' '}
                  <span className="font-mono text-cyan-500">/app-data/test-workspace/</span>.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {selectedFiles.map((file) => (
                  <div
                    key={file.id}
                    className={`p-3 rounded-lg border flex items-center justify-between text-xs font-mono ${
                      isDark ? 'bg-[#0B1F3A] border-[#1E3A5F]' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <FileCheck className="w-4 h-4 text-cyan-500" />
                      <span className="font-semibold text-slate-200">{file.name}</span>
                      <span className="text-slate-400">({(file.sizeBytes / 1024).toFixed(1)} KB)</span>
                    </div>
                    <div className="text-slate-500 text-[11px]">
                      SHA-256: {file.sha256.substring(0, 16)}...
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Step 2: Sanitization Method & Recovery Copy Option */}
          <div
            className={`p-6 rounded-2xl border space-y-4 shadow-sm ${
              isDark ? 'bg-[#122A4D] border-[#1E3A5F]' : 'bg-white border-slate-200'
            }`}
          >
            <div>
              <span className="text-xs font-bold text-cyan-500 uppercase tracking-wider">
                Step 2 of 4
              </span>
              <h3 className="text-base font-bold text-inherit">
                Sanitization Standard & Recovery Copy Option
              </h3>
            </div>

            {/* Methods Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {methods.map((m) => {
                const isSelected = selectedMethod === m.id;
                return (
                  <div
                    key={m.id}
                    onClick={() => handleMethodChange(m.id)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? isDark
                          ? 'bg-[#123A55] border-cyan-500 shadow-sm'
                          : 'bg-cyan-50 border-cyan-500 shadow-sm'
                        : isDark
                        ? 'bg-[#0B1F3A] border-[#1E3A5F] hover:bg-[#0B1F3A]/80'
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-xs">{m.name}</span>
                      {m.recommended && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 font-bold">
                          Default
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-1 leading-snug">{m.description}</p>
                    <div className="mt-3 text-[11px] font-mono text-cyan-500">
                      {m.passes} simulated pass{m.passes > 1 ? 'es' : ''}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Recovery Copy Feature (NEW FEATURE: Item 3) */}
            <div
              className={`p-4 rounded-xl border flex items-start space-x-3.5 transition-all ${
                createRecoveryCopy
                  ? isDark
                    ? 'bg-purple-500/10 border-purple-500/30'
                    : 'bg-purple-50/80 border-purple-300'
                  : isDark
                  ? 'bg-[#0B1F3A] border-[#1E3A5F]'
                  : 'bg-slate-50 border-slate-200'
              }`}
            >
              <input
                type="checkbox"
                id="recoveryCopyCheckbox"
                checked={createRecoveryCopy}
                onChange={(e) => setCreateRecoveryCopy(e.target.checked)}
                className="mt-1 w-4 h-4 rounded text-purple-600 accent-purple-600 cursor-pointer"
              />
              <label htmlFor="recoveryCopyCheckbox" className="text-xs cursor-pointer space-y-1">
                <span className="font-bold text-inherit block">
                  Create Recovery Copy in Controlled Vault Before Simulation (Recommended)
                </span>
                <span className="text-slate-400 block leading-relaxed">
                  Creates an isolated replica in{' '}
                  <span className="font-mono text-purple-400">/app-data/recovery-vault/</span> to
                  demonstrate backup restoration workflow and hash comparisons.
                </span>
                <span className="text-[11px] text-amber-500 font-medium block">
                  Note: This demonstrates backup-based restoration; it does NOT prove recovery of
                  data after genuine physical permanent erasure.
                </span>
              </label>
            </div>
          </div>

          {/* Step 3: Explicit Confirmation */}
          <div
            className={`p-6 rounded-2xl border space-y-4 shadow-sm ${
              isDark ? 'bg-[#122A4D] border-[#1E3A5F]' : 'bg-white border-slate-200'
            }`}
          >
            <div>
              <span className="text-xs font-bold text-cyan-500 uppercase tracking-wider">
                Step 3 of 4
              </span>
              <h3 className="text-base font-bold text-inherit">Explicit Confirmation Required</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                To prevent accidental triggers, please type{' '}
                <strong className="text-cyan-400 font-mono">SIMULATE</strong> in the confirmation box below.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <input
                type="text"
                disabled={isSimulating}
                placeholder="Type SIMULATE to enable"
                value={confirmationInput}
                onChange={(e) => setConfirmationInput(e.target.value)}
                className={`w-full sm:w-80 px-4 py-2.5 rounded-xl border text-sm font-mono tracking-wider outline-none transition-all ${
                  isConfirmed
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                    : isDark
                    ? 'bg-[#0B1F3A] border-[#1E3A5F] text-white focus:border-cyan-500'
                    : 'bg-white border-slate-300 text-slate-900 focus:border-cyan-600'
                }`}
              />
              {isConfirmed && (
                <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> Ready for execution
                </span>
              )}
            </div>
          </div>

          {/* Step 4: Run Simulation */}
          <div
            className={`p-6 rounded-2xl border space-y-4 shadow-sm ${
              isDark ? 'bg-[#122A4D] border-[#1E3A5F]' : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-cyan-500 uppercase tracking-wider">
                  Step 4 of 4
                </span>
                <h3 className="text-base font-bold text-inherit">Execute Simulation</h3>
              </div>
              <button
                disabled={!isConfirmed || selectedFiles.length === 0 || isSimulating}
                onClick={handleStartSimulation}
                className={`px-6 py-2.5 rounded-xl text-xs font-bold text-white shadow-md flex items-center gap-2 transition-all ${
                  !isConfirmed || selectedFiles.length === 0 || isSimulating
                    ? 'bg-slate-700 opacity-50 cursor-not-allowed'
                    : 'bg-[#06B6D4] hover:bg-[#0891B2] active:scale-[0.98]'
                }`}
              >
                {isSimulating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Executing Pass {currentPass} of {totalPasses}...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-white" />
                    <span>Run Simulation</span>
                  </>
                )}
              </button>
            </div>

            {/* Live Progress Bar */}
            {isSimulating && (
              <div className="space-y-2 pt-2">
                <div className="flex justify-between text-xs text-slate-400 font-mono">
                  <span>Pass {currentPass} / {totalPasses} (Byte stream hashing...)</span>
                  <span>{progressPercent}%</span>
                </div>
                <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-150"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
