/**
 * Cipher Labs - Reports & Cryptographic Audit Ledger (PART 3 & 5)
 * PDF/JSON report exports, idempotent reports, hash-chained audit log with interactive chain verifier.
 */

import React, { useState } from 'react';
import {
  FileText,
  ShieldCheck,
  Download,
  CheckCircle2,
  AlertOctagon,
  RefreshCw,
  Hash,
  Eye,
  Lock,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { AuditLogEntry, ReportRecord } from '../types';
import { StorageService } from '../services/storage';

interface ReportsAuditProps {
  isDark: boolean;
  reports: ReportRecord[];
  auditLog: AuditLogEntry[];
  onRefreshAudit: () => void;
  activeReportToView?: ReportRecord | null;
  onCloseReportModal: () => void;
}

export const ReportsAudit: React.FC<ReportsAuditProps> = ({
  isDark,
  reports,
  auditLog,
  onRefreshAudit,
  activeReportToView,
  onCloseReportModal,
}) => {
  const [activeTab, setActiveTab] = useState<'reports' | 'audit'>('reports');
  const [selectedReport, setSelectedReport] = useState<ReportRecord | null>(
    activeReportToView || null
  );
  const [isVerifyingChain, setIsVerifyingChain] = useState(false);
  const [chainVerificationResult, setChainVerificationResult] = useState<{
    isValid: boolean;
    totalEntries: number;
    brokenEntryId?: number;
    errorReason?: string;
  } | null>(null);

  // Update selected report if prop changes
  React.useEffect(() => {
    if (activeReportToView) {
      setSelectedReport(activeReportToView);
    }
  }, [activeReportToView]);

  const handleVerifyChain = async () => {
    setIsVerifyingChain(true);
    setChainVerificationResult(null);
    try {
      await new Promise((r) => setTimeout(r, 600));
      const result = await StorageService.verifyAuditChain();
      setChainVerificationResult(result);
    } finally {
      setIsVerifyingChain(false);
    }
  };

  const handleExportJson = (report: ReportRecord) => {
    const dataStr =
      'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(report, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `cipherlabs_report_${report.id}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handlePrintPdf = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reports & Audit Trail</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Tamper-proof cryptographic ledger and formal sanitization reports.
          </p>
        </div>

        <div
          className={`flex p-1 rounded-xl border ${
            isDark ? 'bg-[#122A4D] border-[#1E3A5F]' : 'bg-slate-100 border-slate-200'
          }`}
        >
          <button
            onClick={() => setActiveTab('reports')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'reports'
                ? isDark
                  ? 'bg-[#123A55] text-[#67E8F9] shadow-sm'
                  : 'bg-white text-[#0E7490] shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Formal Reports ({reports.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'audit'
                ? isDark
                  ? 'bg-[#123A55] text-[#67E8F9] shadow-sm'
                  : 'bg-white text-[#0E7490] shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Audit Hash Chain ({auditLog.length})</span>
          </button>
        </div>
      </div>

      {/* TAB 1: REPORTS */}
      {activeTab === 'reports' && (
        <div className="space-y-4">
          <div
            className={`rounded-2xl border overflow-hidden shadow-sm ${
              isDark ? 'bg-[#122A4D] border-[#1E3A5F]' : 'bg-white border-slate-200'
            }`}
          >
            <div className="p-4 border-b border-inherit flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Generated Reports (Idempotency Enforced)
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Formats: PDF (Print-Ready) & Canonical JSON
              </span>
            </div>

            {reports.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                <FileText className="w-8 h-8 mx-auto text-slate-500 mb-2" />
                No reports generated yet. Execute a secure simulation or recovery scan.
              </div>
            ) : (
              <div className="divide-y divide-inherit">
                {reports.map((rep) => (
                  <div
                    key={rep.id}
                    className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs transition-colors hover:bg-slate-800/20"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-200">
                          {rep.reportJson.method}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {rep.reportStatus}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {rep.reportJson.simulationDisclaimer}
                      </div>
                      <div className="font-mono text-[10px] text-slate-500 space-x-3">
                        <span>Report SHA: {rep.reportSha256.substring(0, 18)}...</span>
                        <span>•</span>
                        <span>Idempotency Key: {rep.idempotencyKey}</span>
                        <span>•</span>
                        <span>Date: {new Date(rep.createdAt).toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      <button
                        onClick={() => setSelectedReport(rep)}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5"
                      >
                        <Eye className="w-3.5 h-3.5 text-cyan-400" />
                        <span>View Dossier</span>
                      </button>

                      <button
                        onClick={() => handleExportJson(rep)}
                        className="px-3 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-medium flex items-center gap-1.5"
                      >
                        <Download className="w-3.5 h-3.5 text-cyan-400" />
                        <span>JSON</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: AUDIT HASH CHAIN */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          {/* Audit Chain Verifier Card */}
          <div
            className={`p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm ${
              isDark ? 'bg-[#122A4D] border-[#1E3A5F]' : 'bg-white border-slate-200'
            }`}
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm">Cryptographic Audit Chain Integrity</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 font-mono">
                  SHA-256 HMAC
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Each entry cryptographically binds: previous_hash || action || operation_id ||
                canonical JSON details.
              </p>
            </div>

            <button
              disabled={isVerifyingChain}
              onClick={handleVerifyChain}
              className="px-5 py-2.5 rounded-xl bg-[#06B6D4] hover:bg-[#0891B2] text-white text-xs font-bold shadow-md flex items-center gap-2 transition-all active:scale-[0.98]"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isVerifyingChain ? 'animate-spin' : ''}`} />
              <span>{isVerifyingChain ? 'Verifying Hashes...' : 'Verify Audit Chain'}</span>
            </button>
          </div>

          {/* Verification Result Notification */}
          {chainVerificationResult && (
            <div
              className={`p-4 rounded-xl text-xs font-medium flex items-center gap-3 animate-in fade-in ${
                chainVerificationResult.isValid
                  ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                  : 'bg-red-500/10 border border-red-500/30 text-red-400'
              }`}
            >
              {chainVerificationResult.isValid ? (
                <CheckCircle2 className="w-5 h-5 shrink-0" />
              ) : (
                <AlertOctagon className="w-5 h-5 shrink-0" />
              )}
              <div>
                <p className="font-bold text-sm">
                  {chainVerificationResult.isValid
                    ? `Audit Chain Intact (${chainVerificationResult.totalEntries} entries verified)`
                    : `Audit Chain Integrity Broken at Entry #${chainVerificationResult.brokenEntryId}`}
                </p>
                <p className="opacity-90 mt-0.5 font-mono text-[11px]">
                  {chainVerificationResult.isValid
                    ? 'All sequential previous_hash references and canonical SHA-256 signatures validated against GENESIS.'
                    : chainVerificationResult.errorReason}
                </p>
              </div>
            </div>
          )}

          {/* Audit Chain Ledger Table */}
          <div
            className={`rounded-2xl border overflow-hidden shadow-sm ${
              isDark ? 'bg-[#122A4D] border-[#1E3A5F]' : 'bg-white border-slate-200'
            }`}
          >
            <div className="p-4 border-b border-inherit flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Chained Event Ledger ({auditLog.length} Entries)
              </span>
              <span className="text-xs text-slate-400 font-mono">Genesis: 0xGENESIS</span>
            </div>

            <div className="divide-y divide-inherit">
              {auditLog.map((entry) => (
                <div key={entry.id} className="p-4 font-mono text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 rounded bg-slate-800 text-cyan-400 font-bold">
                        #{entry.id}
                      </span>
                      <span className="font-bold text-slate-200">{entry.action}</span>
                      {entry.operationId && (
                        <span className="text-[10px] text-slate-500">[{entry.operationId}]</span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-500">
                      {new Date(entry.createdAt).toLocaleTimeString()}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] text-slate-400 bg-slate-900/40 p-2.5 rounded-lg border border-slate-800">
                    <div>
                      <span className="text-slate-500">Previous Hash:</span>{' '}
                      <span
                        className={entry.previousHash === 'GENESIS' ? 'text-amber-400' : 'text-slate-300'}
                      >
                        {entry.previousHash.substring(0, 24)}...
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500">Entry Hash:</span>{' '}
                      <span className="text-emerald-400">{entry.entryHash.substring(0, 24)}...</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Report Modal / Dossier Viewer */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div
            className={`w-full max-w-3xl rounded-2xl shadow-2xl flex flex-col border overflow-hidden ${
              isDark
                ? 'bg-[#0B1F3A] border-[#1E3A5F] text-slate-100'
                : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="p-5 border-b border-inherit flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold">Forensic Sanitization Certificate</h3>
                  <p className="text-xs text-slate-400 font-mono">ID: {selectedReport.id}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedReport(null);
                  onCloseReportModal();
                }}
                className="text-slate-400 hover:text-slate-200 p-1"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto text-xs font-mono">
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                <div className="flex justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-400">ORGANIZATION:</span>
                  <span className="font-bold text-white">Cipher Labs Digital Forensics</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">STANDARD METHOD:</span>
                  <span className="text-cyan-400">{selectedReport.reportJson.method}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">EXECUTION STATUS:</span>
                  <span className="text-emerald-400">{selectedReport.reportJson.executionStatus}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">VERIFICATION VERDICT:</span>
                  <span className="text-cyan-400">{selectedReport.reportJson.verificationStatus}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">DEVICE ID:</span>
                  <span className="text-slate-300">
                    {selectedReport.reportJson.deviceInfo.appDeviceId}
                  </span>
                </div>
              </div>

              {/* Exact Simulation Disclaimer (PART 2.1) */}
              <div className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-[11px] leading-relaxed">
                <strong>Mandatory Audit Disclaimer:</strong>{' '}
                {selectedReport.reportJson.simulationDisclaimer}
              </div>

              {/* Targets Summary */}
              <div className="space-y-1.5">
                <span className="font-bold text-slate-400 uppercase text-[10px]">Target Proofs</span>
                {selectedReport.reportJson.targets.map((t, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded bg-slate-900/40 border border-slate-800 flex justify-between items-center text-[11px]"
                  >
                    <span>{t.name}</span>
                    <span className="text-emerald-400">{t.sha256.substring(0, 16)}...</span>
                  </div>
                ))}
              </div>

              <div className="pt-2 text-[10px] text-slate-500">
                Cryptographic Report SHA-256: {selectedReport.reportSha256}
              </div>
            </div>

            <div className="p-4 border-t border-inherit flex items-center justify-between">
              <span className="text-xs text-slate-400">Ready for regulatory compliance file</span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleExportJson(selectedReport)}
                  className="px-4 py-2 rounded-lg border border-slate-700 hover:bg-slate-800 text-xs font-semibold"
                >
                  Download JSON
                </button>
                <button
                  onClick={handlePrintPdf}
                  className="px-4 py-2 rounded-lg bg-[#06B6D4] hover:bg-[#0891B2] text-white text-xs font-bold"
                >
                  Print / Save PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
