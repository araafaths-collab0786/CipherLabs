import React from 'react';
import { Command, X, Keyboard, ArrowRight } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark?: boolean;
}

export const SHORTCUT_GROUPS = [
  {
    category: 'Tab Navigation',
    items: [
      { keyCombo: ['Alt', '1'], label: 'Dashboard', tabId: 'dashboard' },
      { keyCombo: ['Alt', '2'], label: 'Secure Erasure', tabId: 'erasure' },
      { keyCombo: ['Alt', '3'], label: 'File Recovery', tabId: 'recovery' },
      { keyCombo: ['Alt', '4'], label: 'Verification Center', tabId: 'verification' },
      { keyCombo: ['Alt', '5'], label: 'Reports & Audit', tabId: 'reports' },
      { keyCombo: ['Alt', '6'], label: 'Devices', tabId: 'devices' },
      { keyCombo: ['Alt', '7'], label: 'Settings', tabId: 'settings' },
    ],
  },
  {
    category: 'Quick Actions & System',
    items: [
      { keyCombo: ['Shift', '?'], label: 'Open Shortcuts Reference' },
      { keyCombo: ['Alt', '/'], label: 'Toggle Shortcuts Guide' },
      { keyCombo: ['Esc'], label: 'Close Active Modal / Reset Selection' },
    ],
  },
];

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose,
  isDark = true,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div
        className={`w-full max-w-xl rounded-2xl border shadow-2xl flex flex-col overflow-hidden modal-transition ${
          isDark ? 'bg-[#0B1F3A] border-[#1E3A5F] text-slate-100' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Header */}
        <div className="p-5 border-b border-inherit flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>Keyboard Shortcuts Reference</span>
                <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-400 rounded border border-cyan-500/30">
                  Speed Navigation
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Use keyboard key combinations to instantly switch tab views across Cipher Labs
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {SHORTCUT_GROUPS.map((group) => (
            <div key={group.category} className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400 flex items-center gap-1.5">
                <Command className="w-3.5 h-3.5" />
                <span>{group.category}</span>
              </h4>

              <div className="grid grid-cols-1 gap-2">
                {group.items.map((item) => (
                  <div
                    key={item.label}
                    className={`p-3 rounded-xl border flex items-center justify-between text-xs transition-colors ${
                      isDark ? 'bg-[#122A4D]/60 border-[#1E3A5F]' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                      <ArrowRight className="w-3.5 h-3.5 text-cyan-500 opacity-70" />
                      <span>{item.label}</span>
                    </span>

                    <div className="flex items-center space-x-1 font-mono">
                      {item.keyCombo.map((k, idx) => (
                        <React.Fragment key={idx}>
                          <kbd className="px-2 py-1 text-[11px] font-bold rounded bg-slate-800 text-cyan-400 border border-slate-700 shadow-sm">
                            {k}
                          </kbd>
                          {idx < item.keyCombo.length - 1 && (
                            <span className="text-slate-500 text-xs">+</span>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-inherit flex items-center justify-between text-xs text-slate-500">
          <span>Press <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-mono">Esc</kbd> anytime to close</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#06B6D4] hover:bg-[#0891B2] text-white text-xs font-bold transition-all cursor-pointer"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
