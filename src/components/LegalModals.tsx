import React from 'react';
import { Shield, FileText, CheckCircle2, X } from 'lucide-react';

interface LegalModalProps {
  type: 'privacy' | 'terms' | null;
  onClose: () => void;
  onAccept?: () => void;
  isDark?: boolean;
}

export const LegalModal: React.FC<LegalModalProps> = ({
  type,
  onClose,
  onAccept,
  isDark = true,
}) => {
  if (!type) return null;

  const isPrivacy = type === 'privacy';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div
        className={`w-full max-w-2xl max-h-[85vh] rounded-2xl border flex flex-col shadow-2xl overflow-hidden ${
          isDark ? 'bg-[#0B1F3A] border-[#1E3A5F] text-slate-100' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Header */}
        <div className="p-5 border-b border-inherit flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
              {isPrivacy ? <Shield className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {isPrivacy ? 'Privacy & Data Protection Policy' : 'Terms & Conditions of Service'}
              </h3>
              <p className="text-xs text-slate-500 font-mono">
                Cipher Labs Forensics • Last Updated: October 2026 • Version 2.4
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
          {isPrivacy ? (
            <>
              <div className="p-3.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-900 dark:text-cyan-300 font-medium">
                <strong>Executive Summary:</strong> Cipher Labs operates under a strict Zero-Telemetry, Client-Authoritative model. We do not sell your personal data, profile your browsing activity, or transmit raw file contents to external marketing networks.
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  1. Local-First Processing & Sanitization
                </h4>
                <p>
                  All forensic verification computations, SHA-256 pre/post integrity hashing, and data sanitization algorithms execute exclusively within your local workstation sandbox. Raw file bytes selected for secure deletion are processed in-memory or dispatched to controlled local vaults without unencrypted cloud transmission.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  2. Chained Audit Ledger & Cryptographic Integrity
                </h4>
                <p>
                  To comply with digital forensics audit requirements (NIST SP 800-88 and DoD standards), the application maintains an append-only, SHA-256 hash-chained audit ledger. Each audit record stores cryptographic hashes of actions, timestamp proofs, and operator confirmations.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  3. Cookies and Local Storage
                </h4>
                <p>
                  We utilize strictly necessary local storage cookies solely to maintain active operator authentication sessions, user interface theme preferences (dark/light mode), and local recovery vault state. You may configure optional performance preferences in our Cookie Preferences center.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  4. User Access, Portability & Deletion Rights
                </h4>
                <p>
                  You retain full ownership of all data. You have the right at any time to export canonical JSON audit archives, purge demo records, or permanently wipe local recovery copies.
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="p-3.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-900 dark:text-cyan-300 font-medium">
                <strong>Important Notice:</strong> By accessing Cipher Labs Forensics, you accept these Terms and Conditions in full and affirm that you are authorized to manage and sanitize targeted files.
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  1. Authorized Operator Confirmation
                </h4>
                <p>
                  You certify that you are the lawful owner, authorized administrator, or certified forensic analyst authorized to access, analyze, sanitize, or delete the files and folders selected on this workstation.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  2. Permanent Deletion & Controlled Recovery
                </h4>
                <p>
                  Files deleted without enabling the "Save in File Recovery (Recently Deleted)" option are processed for immediate sanitization. Once purged, data cannot be recovered by standard forensic recovery tools. If the recovery option is enabled, an encrypted restoration copy is retained in Recently Deleted.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  3. Simulation & Non-Destructive Testing
                </h4>
                <p>
                  Cipher Labs provides simulation-certified verification models to safeguard physical storage media from uncommanded destructive overwrites. Verification signatures represent mathematical proof of execution.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  4. Limitation of Liability
                </h4>
                <p>
                  Cipher Labs provides forensic tools "as is". Operators must verify target file selections prior to executing secure erasure workflows. Cipher Labs is not liable for data loss caused by unauthorized operator error.
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-inherit flex items-center justify-between gap-3 bg-slate-50 dark:bg-slate-900/40">
          <span className="text-[11px] text-slate-500 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            Legally Binding Policy Document
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-800 text-xs font-semibold transition-colors"
            >
              Close
            </button>
            {onAccept && (
              <button
                onClick={() => {
                  onAccept();
                  onClose();
                }}
                className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white text-xs font-bold transition-all shadow-sm"
              >
                I Understand & Accept
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
