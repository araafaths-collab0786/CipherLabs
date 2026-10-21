/**
 * Cipher Labs - Forensic Hex Viewer Modal
 * High-fidelity byte-level inspection for carved test disk images & signatures
 */

import React from 'react';
import { X, Binary, CheckCircle2, ShieldCheck, FileText } from 'lucide-react';
import { RecoveryCandidate } from '../types';

interface HexViewerModalProps {
  candidate: RecoveryCandidate | null;
  onClose: () => void;
  isDark: boolean;
}

export const HexViewerModal: React.FC<HexViewerModalProps> = ({
  candidate,
  onClose,
  isDark,
}) => {
  if (!candidate) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className={`w-full max-w-3xl rounded-2xl shadow-2xl flex flex-col border overflow-hidden ${
          isDark
            ? 'bg-[#0B1F3A] border-[#1E3A5F] text-slate-100'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Header */}
        <div className="p-5 border-b border-inherit flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-500">
              <Binary className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold">Forensic Byte Inspector</h3>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  {candidate.fileType}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Cluster Offset: 0x{candidate.byteOffset.toString(16).toUpperCase()} ({candidate.byteOffset} bytes)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Validation Checks Banner */}
        <div className="p-4 border-b border-inherit bg-slate-900/40 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-300">Confidence Breakdown:</span>
            <span className="font-bold text-cyan-400">{candidate.confidence} / 100</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
            <div className="p-2 rounded bg-slate-800/60 border border-slate-700/50">
              <span className="text-slate-400 block text-[10px]">MAGIC HEADER</span>
              <span className="font-mono text-emerald-400 flex items-center gap-1 mt-0.5">
                <CheckCircle2 className="w-3 h-3" /> +30 pts
              </span>
            </div>
            <div className="p-2 rounded bg-slate-800/60 border border-slate-700/50">
              <span className="text-slate-400 block text-[10px]">FOOTER MARKER</span>
              <span
                className={`font-mono flex items-center gap-1 mt-0.5 ${
                  candidate.confidenceComponents.footerFound ? 'text-emerald-400' : 'text-amber-400'
                }`}
              >
                {candidate.confidenceComponents.footerFound ? <CheckCircle2 className="w-3 h-3" /> : '—'}
                {candidate.confidenceComponents.footerFound ? '+30 pts' : 'Missing (0)'}
              </span>
            </div>
            <div className="p-2 rounded bg-slate-800/60 border border-slate-700/50">
              <span className="text-slate-400 block text-[10px]">STRUCTURE CRC</span>
              <span className="font-mono text-emerald-400 flex items-center gap-1 mt-0.5">
                <CheckCircle2 className="w-3 h-3" /> +30 pts
              </span>
            </div>
            <div className="p-2 rounded bg-slate-800/60 border border-slate-700/50">
              <span className="text-slate-400 block text-[10px]">OUTPUT RE-PARSE</span>
              <span
                className={`font-mono flex items-center gap-1 mt-0.5 ${
                  candidate.confidenceComponents.reparsePassed ? 'text-emerald-400' : 'text-slate-400'
                }`}
              >
                {candidate.confidenceComponents.reparsePassed ? '+10 pts' : 'Pending Save'}
              </span>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 font-mono pt-1 space-y-0.5">
            <div>
              <span className="text-slate-500">Header:</span> {candidate.validationChecks.signatureHeader}
            </div>
            <div>
              <span className="text-slate-500">Footer:</span> {candidate.validationChecks.signatureFooter}
            </div>
          </div>
        </div>

        {/* Hex Dump Container */}
        <div className="p-5 font-mono text-xs overflow-x-auto bg-slate-950 text-emerald-400 max-h-[360px] space-y-1 select-all">
          <div className="text-slate-500 pb-1 text-[11px] border-b border-slate-800">
            OFFSET&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;00 01 02 03 04 05 06 07  08 09 0A 0B 0C 0D 0E 0F  &nbsp;ASCII
          </div>
          {candidate.hexPreview.map((line, idx) => (
            <div key={idx} className="tracking-wide hover:bg-slate-900/60 py-0.5 px-1 rounded">
              {line}
            </div>
          ))}
          <div className="text-slate-600 pt-2 text-[10px] italic">
            [... synthetic disk fixture slice from /app-data/test-workspace/cipher_test_disk_v1.raw ...]
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-inherit flex items-center justify-between">
          <span className="text-xs text-slate-400">
            Classifier: <strong className="text-cyan-400">{candidate.classifierLabel}</strong>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
