import React, { useState, useEffect } from 'react';
import { Cookie, Shield, Check, Settings, X, Lock } from 'lucide-react';

export interface CookiePreferences {
  necessary: boolean; // Always true
  vaultStorage: boolean; // Functional: local storage vault caching
  forensicAnalytics: boolean; // Performance: local benchmark metrics
  hasConsent: boolean;
  updatedAt: string;
}

const STORAGE_KEY = 'cipher_cookie_preferences';

export const getCookiePreferences = (): CookiePreferences => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch {
      // fallback
    }
  }
  return {
    necessary: true,
    vaultStorage: true,
    forensicAnalytics: false,
    hasConsent: false,
    updatedAt: new Date().toISOString(),
  };
};

export const saveCookiePreferences = (prefs: Partial<CookiePreferences>): CookiePreferences => {
  const current = getCookiePreferences();
  const updated: CookiePreferences = {
    ...current,
    ...prefs,
    necessary: true, // strictly necessary is always true
    hasConsent: true,
    updatedAt: new Date().toISOString(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  window.dispatchEvent(new Event('cookie_preferences_updated'));
  return updated;
};

interface CookiePreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark?: boolean;
}

export const CookiePreferencesModal: React.FC<CookiePreferencesModalProps> = ({
  isOpen,
  onClose,
  isDark = true,
}) => {
  const [prefs, setPrefs] = useState<CookiePreferences>(getCookiePreferences);
  const [savedNotice, setSavedNotice] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPrefs(getCookiePreferences());
      setSavedNotice(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    saveCookiePreferences(prefs);
    setSavedNotice(true);
    setTimeout(() => {
      onClose();
    }, 600);
  };

  const handleAcceptAll = () => {
    saveCookiePreferences({
      necessary: true,
      vaultStorage: true,
      forensicAnalytics: true,
    });
    setSavedNotice(true);
    setTimeout(() => {
      onClose();
    }, 600);
  };

  const handleRejectOptional = () => {
    saveCookiePreferences({
      necessary: true,
      vaultStorage: false,
      forensicAnalytics: false,
    });
    setSavedNotice(true);
    setTimeout(() => {
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
      <div
        className={`w-full max-w-xl rounded-2xl border shadow-2xl flex flex-col overflow-hidden ${
          isDark ? 'bg-[#0B1F3A] border-[#1E3A5F] text-slate-100' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Header */}
        <div className="p-5 border-b border-inherit flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
              <Cookie className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Cookie & Storage Preferences
              </h3>
              <p className="text-xs text-slate-500">
                Configure local storage, session state & privacy settings
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 max-h-[65vh] overflow-y-auto text-xs">
          {savedNotice && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 font-semibold flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-500" />
              <span>Cookie preferences successfully saved!</span>
            </div>
          )}

          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
            Cipher Labs Forensics utilizes client-side storage technologies (Local Storage, Session Storage, and Local Cookies) to provide cryptographic verification, maintain operator authentication sessions, and securely preserve recovery vault records.
          </p>

          <div className="space-y-3 pt-2">
            {/* Category 1: Strictly Necessary */}
            <div
              className={`p-4 rounded-xl border flex items-start justify-between gap-4 ${
                isDark ? 'bg-slate-900/40 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-cyan-500" />
                  <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                    Strictly Necessary (Required)
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-100 text-cyan-800 dark:bg-cyan-500/20 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-500/30">
                    Always Active
                  </span>
                </div>
                <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                  Essential for operator authentication, SHA-256 chained audit ledger integrity, idempotency verification, and UI theme preferences. Cannot be deactivated.
                </p>
              </div>
              <div className="text-slate-400 mt-1">
                <Lock className="w-5 h-5" />
              </div>
            </div>

            {/* Category 2: Controlled Recovery Vault & Cache */}
            <div
              className={`p-4 rounded-xl border flex items-start justify-between gap-4 ${
                isDark ? 'bg-slate-900/40 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2">
                  <Settings className="w-4 h-4 text-emerald-500" />
                  <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                    Recovery Vault & Local File Caching
                  </span>
                </div>
                <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                  Allows storing temporary recovery copies in the Recently Deleted vault and preserves file inspection buffers across application reloads.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer mt-1">
                <input
                  type="checkbox"
                  checked={prefs.vaultStorage}
                  onChange={(e) => setPrefs({ ...prefs, vaultStorage: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-500"></div>
              </label>
            </div>

            {/* Category 3: Forensic Analytics & Diagnostics */}
            <div
              className={`p-4 rounded-xl border flex items-start justify-between gap-4 ${
                isDark ? 'bg-slate-900/40 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2">
                  <Cookie className="w-4 h-4 text-purple-500" />
                  <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                    Local Forensic Performance Telemetry
                  </span>
                </div>
                <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                  Computes execution benchmarks (bytes/sec wipe speed) and memory usage strictly on this device. Zero diagnostic data is sent to external servers.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer mt-1">
                <input
                  type="checkbox"
                  checked={prefs.forensicAnalytics}
                  onChange={(e) => setPrefs({ ...prefs, forensicAnalytics: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-500"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-inherit flex flex-wrap items-center justify-between gap-3 bg-slate-50 dark:bg-slate-900/40">
          <button
            type="button"
            onClick={handleRejectOptional}
            className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-800 text-xs font-semibold transition-colors"
          >
            Reject Optional
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 rounded-xl border border-cyan-500/50 hover:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 text-xs font-bold transition-all"
            >
              Save Preferences
            </button>
            <button
              type="button"
              onClick={handleAcceptAll}
              className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white text-xs font-bold transition-all shadow-sm"
            >
              Accept All
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// First-time visit banner
export const CookieConsentBanner: React.FC<{
  onOpenPreferences: () => void;
  isDark?: boolean;
}> = ({ onOpenPreferences, isDark = true }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const prefs = getCookiePreferences();
    if (!prefs.hasConsent) {
      setVisible(true);
    }
    const handleUpdate = () => {
      const p = getCookiePreferences();
      if (p.hasConsent) setVisible(false);
    };
    window.addEventListener('cookie_preferences_updated', handleUpdate);
    return () => window.removeEventListener('cookie_preferences_updated', handleUpdate);
  }, []);

  if (!visible) return null;

  const handleAcceptAll = () => {
    saveCookiePreferences({
      necessary: true,
      vaultStorage: true,
      forensicAnalytics: true,
    });
    setVisible(false);
  };

  const handleRejectOptional = () => {
    saveCookiePreferences({
      necessary: true,
      vaultStorage: false,
      forensicAnalytics: false,
    });
    setVisible(false);
  };

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 p-4 animate-in slide-in-from-bottom duration-300">
      <div
        className={`max-w-4xl mx-auto p-4 sm:p-5 rounded-2xl border shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 backdrop-blur-md ${
          isDark
            ? 'bg-[#0B1F3A]/95 border-[#1E3A5F] text-slate-100'
            : 'bg-white/95 border-slate-200 text-slate-900'
        }`}
      >
        <div className="flex items-start space-x-3.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0 mt-0.5">
            <Cookie className="w-5 h-5" />
          </div>
          <div className="space-y-1 text-xs">
            <h4 className="font-bold text-slate-900 dark:text-slate-100">
              Cookie & Data Privacy Notice
            </h4>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Cipher Labs stores cryptographic hash chains and session data in your browser. We never use advertising trackers or send raw file contents to third parties.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
          <button
            onClick={handleRejectOptional}
            className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-800 text-xs font-semibold transition-colors"
          >
            Only Necessary
          </button>
          <button
            onClick={handleAcceptAll}
            className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white text-xs font-bold transition-all shadow-sm"
          >
            Accept All
          </button>
        </div>
      </div>
    </div>
  );
};
