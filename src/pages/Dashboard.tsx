/**
 * Cipher Labs - Dashboard View (PART 3 Specification)
 * 4 metric cards, mandatory simulation disclaimer line, quick actions, recent activity, latest reports.
 */

import React from 'react';
import {
  Activity,
  ShieldCheck,
  Laptop,
  FileSearch,
  Plus,
  Eraser,
  CheckCircle,
  AlertTriangle,
  FolderOpen,
  ArrowRight,
  Download,
  Clock,
  Shield,
  FileText,
  Inbox,
  Lock,
} from 'lucide-react';
import { OperationRecord, ReportRecord, UserProfile } from '../types';
import { NavTab } from '../components/Sidebar';

interface DashboardProps {
  operations: OperationRecord[];
  reports: ReportRecord[];
  profile: UserProfile;
  isDark: boolean;
  onNavigate: (tab: NavTab) => void;
  onOpenBrowseFiles: () => void;
  onViewReport: (report: ReportRecord) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  operations,
  reports,
  profile,
  isDark,
  onNavigate,
  onOpenBrowseFiles,
  onViewReport,
}) => {
  // Metric calculations strictly per specifications:
  // TOTAL OPERATIONS: all operations (simulations included)
  const totalOperations = operations.length;

  // VERIFIED OPERATIONS: ONLY operations whose verification_status is VERIFIED; simulations are EXCLUDED!
  const verifiedOperations = operations.filter(
    (op) => op.verificationStatus === 'VERIFIED'
  ).length;

  // DEVICES ASSESSED: registered devices (1 local registered workstation)
  const devicesAssessed = 1;

  // RECOVERY SCANS: forensic scans
  const recoveryScans = operations.filter((op) => op.operationType === 'RECOVERY_TEST').length;

  // Simulation checks passed count
  const simulationChecksPassed = operations.filter(
    (op) => op.verificationStatus === 'SIMULATION_CHECK_PASSED'
  ).length;

  const recentOperations = operations.slice(0, 8);
  const latestReports = reports.slice(0, 3);

  const getVerificationChip = (op: OperationRecord) => {
    switch (op.verificationStatus) {
      case 'SIMULATION_CHECK_PASSED':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
            Simulation check passed
          </span>
        );
      case 'SIMULATION_CHECK_FAILED':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
            Simulation check failed
          </span>
        );
      case 'VERIFIED':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#DCFCE7] text-[#16A34A] dark:bg-[#16A34A]/20 dark:text-[#16A34A] border border-[#16A34A]/30">
            Verified
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            Unverified
          </span>
        );
    }
  };

  const getExecutionChip = (status: string) => {
    switch (status) {
      case 'SIMULATION_COMPLETED':
      case 'RECOVERY_COMPLETED':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            Completed
          </span>
        );
      case 'RUNNING':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 animate-pulse">
            Running
          </span>
        );
      case 'INTERRUPTED':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-500/10 text-slate-500">
            Interrupted
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-red-500/10 text-red-500">
            Failed
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-slate-400 mt-1">
          Welcome back, <strong className="text-cyan-500">{profile.firstName}</strong>. Here's your
          forensic operation overview.
        </p>
      </div>

      {/* Four Metric Cards (PART 3) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Operations */}
        <div
          className={`p-5 rounded-xl border transition-all hover:translate-y-[-2px] shadow-sm ${
            isDark ? 'bg-[#122A4D] border-[#1E3A5F]' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              TOTAL OPERATIONS
            </span>
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-500 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tracking-tight">{totalOperations}</span>
            <span className="text-xs text-slate-400">recorded</span>
          </div>
        </div>

        {/* Verified Operations (simulations excluded per rule!) */}
        <div
          className={`p-5 rounded-xl border transition-all hover:translate-y-[-2px] shadow-sm ${
            isDark ? 'bg-[#122A4D] border-[#1E3A5F]' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              VERIFIED OPERATIONS
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#DCFCE7] text-[#16A34A] dark:bg-[#16A34A]/20 dark:text-[#16A34A] flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tracking-tight text-[#16A34A]">
              {verifiedOperations}
            </span>
            <span className="text-xs text-slate-400">hardware validated</span>
          </div>
        </div>

        {/* Devices Assessed */}
        <div
          className={`p-5 rounded-xl border transition-all hover:translate-y-[-2px] shadow-sm ${
            isDark ? 'bg-[#122A4D] border-[#1E3A5F]' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              DEVICES ASSESSED
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <Laptop className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tracking-tight">{devicesAssessed}</span>
            <span className="text-xs text-slate-400">workstation</span>
          </div>
        </div>

        {/* Recovery Scans */}
        <div
          className={`p-5 rounded-xl border transition-all hover:translate-y-[-2px] shadow-sm ${
            isDark ? 'bg-[#122A4D] border-[#1E3A5F]' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              RECOVERY SCANS
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center">
              <FileSearch className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tracking-tight">{recoveryScans}</span>
            <span className="text-xs text-slate-400">disk fixtures</span>
          </div>
        </div>
      </div>

      {/* Mandatory Under-Card Disclaimer Line (PART 3) */}
      <div
        className={`px-4 py-2.5 rounded-lg border text-xs flex items-center gap-2 ${
          isDark
            ? 'bg-[#122A4D]/60 border-[#1E3A5F] text-slate-300'
            : 'bg-slate-100 border-slate-200 text-slate-700'
        }`}
      >
        <Shield className="w-4 h-4 text-cyan-500 shrink-0" />
        <span>
          Simulation checks passed:{' '}
          <strong className="text-cyan-500 font-bold">{simulationChecksPassed}</strong>. Simulations
          confirm that targets were not changed. They do not erase data.
        </span>
      </div>

      {/* Two-Column Row: Quick Actions & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions (1 column) */}
        <div
          className={`p-6 rounded-xl border flex flex-col justify-between shadow-sm ${
            isDark ? 'bg-[#122A4D] border-[#1E3A5F]' : 'bg-white border-slate-200'
          }`}
        >
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">
              Quick Actions
            </h3>
            <div className="space-y-2.5">
              <button
                onClick={() => onNavigate('erasure')}
                className="w-full flex items-center justify-between p-3 rounded-lg text-left bg-[#06B6D4] hover:bg-[#0891B2] text-white font-semibold text-xs transition-transform active:scale-[0.98] shadow-sm"
              >
                <div className="flex items-center space-x-2.5">
                  <Eraser className="w-4 h-4" />
                  <span>New Erasure Simulation</span>
                </div>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => onNavigate('recovery')}
                className={`w-full flex items-center justify-between p-3 rounded-lg text-left text-xs font-semibold border transition-all ${
                  isDark
                    ? 'border-purple-500/30 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20'
                    : 'border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <FileSearch className="w-4 h-4 text-purple-400" />
                  <span>Forensic Recovery Lab</span>
                </div>
                <ArrowRight className="w-4 h-4 text-purple-400" />
              </button>

              <button
                onClick={onOpenBrowseFiles}
                className={`w-full flex items-center justify-between p-3 rounded-lg text-left text-xs font-semibold border transition-all ${
                  isDark
                    ? 'border-slate-700 hover:bg-slate-800 text-slate-200'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <FolderOpen className="w-4 h-4 text-cyan-500" />
                  <span>Browse Test Files</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">5 items</span>
              </button>

              <button
                onClick={() => onNavigate('verification')}
                className={`w-full flex items-center justify-between p-3 rounded-lg text-left text-xs font-semibold border transition-all ${
                  isDark
                    ? 'border-slate-700 hover:bg-slate-800 text-slate-200'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span>Verify Operation</span>
                </div>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="pt-6 border-t border-inherit mt-4 text-[11px] text-slate-400 space-y-1">
            <div className="flex items-center justify-between">
              <span>Simulation Safety Guard</span>
              <span className="text-emerald-500 font-semibold">100% Enforced</span>
            </div>
            <p className="text-[10px] text-slate-500">
              App operates solely on synthetic test objects within /app-data/.
            </p>
          </div>
        </div>

        {/* Recent Activity (2 columns) */}
        <div
          className={`lg:col-span-2 p-6 rounded-xl border flex flex-col justify-between shadow-sm ${
            isDark ? 'bg-[#122A4D] border-[#1E3A5F]' : 'bg-white border-slate-200'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
                Recent Activity
              </h3>
              <button
                onClick={() => onNavigate('reports')}
                className="text-xs text-cyan-500 hover:underline font-semibold"
              >
                View all
              </button>
            </div>

            {recentOperations.length === 0 ? (
              /* Empty state from PART 3 */
              <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-slate-800/40 border border-slate-700 flex items-center justify-center text-slate-400">
                  <Inbox className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold">No operations yet</h4>
                <p className="text-xs text-slate-400 max-w-sm">
                  Start your first secure erasure simulation or recovery scan to see activity here.
                </p>
                <button
                  onClick={() => onNavigate('erasure')}
                  className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-[#06B6D4] hover:bg-[#0891B2] text-white text-xs font-semibold shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ New operation</span>
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {recentOperations.map((op) => (
                  <div
                    key={op.id}
                    className={`p-3 rounded-lg border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
                      isDark
                        ? 'bg-[#0B1F3A]/60 border-[#1E3A5F] hover:bg-[#0B1F3A]'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100/80'
                    }`}
                  >
                    <div className="flex items-start sm:items-center space-x-3">
                      <div className="w-7 h-7 rounded bg-cyan-500/10 text-cyan-400 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
                        {op.operationType === 'ERASURE_SIMULATION' ? (
                          <Eraser className="w-3.5 h-3.5" />
                        ) : (
                          <FileSearch className="w-3.5 h-3.5" />
                        )}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-200 dark:text-slate-200">
                          {op.method}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5 truncate max-w-xs">
                          {op.targetReference}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      {getExecutionChip(op.executionStatus)}
                      {getVerificationChip(op)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-inherit mt-4 flex items-center justify-between text-[11px] text-slate-400">
            <span>Audit Trail Ledger</span>
            <span className="font-mono text-cyan-500">Chained SHA-256 HMAC</span>
          </div>
        </div>
      </div>

      {/* Latest Reports Card (PART 3) */}
      <div
        className={`p-6 rounded-xl border shadow-sm ${
          isDark ? 'bg-[#122A4D] border-[#1E3A5F]' : 'bg-white border-slate-200'
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <FileText className="w-4 h-4 text-cyan-500" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
              Latest Reports
            </h3>
          </div>
          <button
            onClick={() => onNavigate('reports')}
            className="text-xs text-cyan-500 hover:underline font-semibold"
          >
            View all reports
          </button>
        </div>

        {latestReports.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center">No reports generated yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {latestReports.map((rep) => (
              <div
                key={rep.id}
                className={`p-4 rounded-xl border flex flex-col justify-between ${
                  isDark
                    ? 'bg-[#0B1F3A]/70 border-[#1E3A5F]'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="font-semibold text-cyan-400 truncate">
                      {rep.reportJson.method}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400">
                      {rep.reportStatus}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-2">
                    {rep.reportJson.simulationDisclaimer}
                  </p>
                  <p className="text-[10px] font-mono text-slate-500 mt-2">
                    Hash: {rep.reportSha256.substring(0, 16)}...
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-inherit flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">
                    {new Date(rep.createdAt).toLocaleDateString()}
                  </span>
                  <button
                    onClick={() => onViewReport(rep)}
                    className="inline-flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 font-semibold"
                  >
                    <Download className="w-3 h-3" />
                    <span>View / Export</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
