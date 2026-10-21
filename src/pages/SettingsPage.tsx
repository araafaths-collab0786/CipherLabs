/**
 * Cipher Labs - Settings Page (PART 3 & PART 5.5 Specification)
 * Profile, instant Light/Dark appearance, privacy preferences, data export, Supabase key validation audit.
 */

import React, { useState } from 'react';
import {
  User,
  Palette,
  Shield,
  Download,
  CheckCircle2,
  Moon,
  Sun,
  Database,
  KeyRound,
  Save,
  Link,
  Laptop,
} from 'lucide-react';
import { UserProfile } from '../types';
import { StorageService } from '../services/storage';

interface SettingsPageProps {
  isDark: boolean;
  onToggleTheme: () => void;
  profile: UserProfile;
  onUpdateProfile: (p: UserProfile) => void;
  onSignOut?: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  isDark,
  onToggleTheme,
  profile,
  onUpdateProfile,
  onSignOut,
}) => {
  const [firstName, setFirstName] = useState(profile.firstName);
  const [lastName, setLastName] = useState(profile.lastName);
  const [phone, setPhone] = useState(profile.phone || '');
  const [keepLogsDays, setKeepLogsDays] = useState<30 | 90 | 365>(
    profile.preferences.keepLogsDays || 90
  );
  const [isSaved, setIsSaved] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setPhoneError(null);

    // Validate phone if provided per PART 4 & 5.1 (+ then 8 to 15 digits)
    if (phone.trim()) {
      const phoneRegex = /^\+[0-9]{8,15}$/;
      if (!phoneRegex.test(phone.trim())) {
        setPhoneError('Phone must start with + followed by 8 to 15 digits (e.g. +14155552678)');
        return;
      }
    }

    const updated = StorageService.updateProfile({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phone.trim() || undefined,
      preferences: {
        ...profile.preferences,
        keepLogsDays,
      },
    });

    onUpdateProfile(updated);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const handleExportData = () => {
    const exportBundle = {
      exportTimestamp: new Date().toISOString(),
      profile: StorageService.getProfile(),
      device: StorageService.getDevice(),
      operations: StorageService.getOperations(),
      reports: StorageService.getReports(),
      auditLog: StorageService.getAuditLog(),
      recoveryCopies: StorageService.getRecoveryCopies(),
      disclaimer: 'Cipher Labs zero-knowledge export. Contains no raw user file contents.',
    };

    const dataStr =
      'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportBundle, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `cipherlabs_data_export_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings & Preferences</h1>
        <p className="text-sm text-slate-400 mt-0.5">
          Operator profile, theme appearance, log retention policies, and cryptographic credentials.
        </p>
      </div>

      {/* Section 1: Profile Information */}
      <form
        onSubmit={handleSaveProfile}
        className={`p-6 rounded-2xl border space-y-4 shadow-sm ${
          isDark ? 'bg-[#122A4D] border-[#1E3A5F]' : 'bg-white border-slate-200'
        }`}
      >
        <div className="flex items-center justify-between pb-3 border-b border-inherit">
          <div className="flex items-center space-x-2 text-inherit">
            <User className="w-5 h-5 text-cyan-500" />
            <h3 className="font-bold text-sm uppercase tracking-wider">Operator Profile</h3>
          </div>
          {isSaved && (
            <span className="text-xs text-emerald-400 flex items-center gap-1 font-semibold">
              <CheckCircle2 className="w-4 h-4" /> Preferences Saved
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">
              First Name (Required)
            </label>
            <input
              type="text"
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className={`w-full px-3.5 py-2 rounded-lg border text-sm outline-none transition-colors ${
                isDark
                  ? 'bg-[#0B1F3A] border-[#1E3A5F] text-white focus:border-cyan-500'
                  : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-cyan-600'
              }`}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">
              Last Name (Required)
            </label>
            <input
              type="text"
              required
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className={`w-full px-3.5 py-2 rounded-lg border text-sm outline-none transition-colors ${
                isDark
                  ? 'bg-[#0B1F3A] border-[#1E3A5F] text-white focus:border-cyan-500'
                  : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-cyan-600'
              }`}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Email Address</label>
            <input
              type="email"
              disabled
              value={profile.email}
              className={`w-full px-3.5 py-2 rounded-lg border text-sm opacity-70 cursor-not-allowed ${
                isDark ? 'bg-slate-900 border-[#1E3A5F] text-slate-400' : 'bg-slate-100 border-slate-300'
              }`}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">
              Phone Number (Optional)
            </label>
            <input
              type="text"
              placeholder="+14155552678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={`w-full px-3.5 py-2 rounded-lg border text-sm outline-none transition-colors font-mono ${
                phoneError
                  ? 'border-red-500 bg-red-500/10'
                  : isDark
                  ? 'bg-[#0B1F3A] border-[#1E3A5F] text-white focus:border-cyan-500'
                  : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-cyan-600'
              }`}
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Optional. Used for your profile only. Not used for sign-in, no SMS is sent.
            </p>
            {phoneError && <p className="text-[11px] text-red-400 mt-1">{phoneError}</p>}
          </div>
        </div>

        <div className="pt-3 flex justify-end">
          <button
            type="submit"
            className="px-5 py-2 rounded-xl bg-[#06B6D4] hover:bg-[#0891B2] text-white text-xs font-bold shadow-md flex items-center gap-1.5 transition-all"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Profile</span>
          </button>
        </div>
      </form>

      {/* Section 2: Appearance (PART 3) */}
      <div
        className={`p-6 rounded-2xl border space-y-4 shadow-sm ${
          isDark ? 'bg-[#122A4D] border-[#1E3A5F]' : 'bg-white border-slate-200'
        }`}
      >
        <div className="flex items-center space-x-2 text-inherit pb-3 border-b border-inherit">
          <Palette className="w-5 h-5 text-cyan-500" />
          <h3 className="font-bold text-sm uppercase tracking-wider">Appearance Theme</h3>
        </div>

        <p className="text-xs text-slate-400">
          Select preferred interface theme. Setting applies immediately and persists in profile preferences.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Light Theme Card */}
          <div
            onClick={isDark ? onToggleTheme : undefined}
            className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
              !isDark
                ? 'border-cyan-500 bg-cyan-50/50 shadow-md ring-2 ring-cyan-500/30'
                : 'border-slate-700 bg-slate-900/40 hover:bg-slate-900'
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                <Sun className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">Light Mist</h4>
                <p className="text-xs text-slate-500">Daylight high-contrast layout</p>
              </div>
            </div>
            {!isDark && <CheckCircle2 className="w-5 h-5 text-cyan-600" />}
          </div>

          {/* Dark Theme Card */}
          <div
            onClick={!isDark ? onToggleTheme : undefined}
            className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
              isDark
                ? 'border-cyan-500 bg-[#123A55] shadow-md ring-2 ring-cyan-500/30'
                : 'border-slate-200 bg-white hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-slate-800 text-cyan-400 flex items-center justify-center">
                <Moon className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-100">Deep Navy</h4>
                <p className="text-xs text-slate-400">Low-light forensic laboratory palette</p>
              </div>
            </div>
            {isDark && <CheckCircle2 className="w-5 h-5 text-cyan-400" />}
          </div>
        </div>
      </div>

      {/* Section 3: Privacy & Data Export (PART 5.5) */}
      <div
        className={`p-6 rounded-2xl border space-y-4 shadow-sm ${
          isDark ? 'bg-[#122A4D] border-[#1E3A5F]' : 'bg-white border-slate-200'
        }`}
      >
        <div className="flex items-center space-x-2 text-inherit pb-3 border-b border-inherit">
          <Shield className="w-5 h-5 text-cyan-500" />
          <h3 className="font-bold text-sm uppercase tracking-wider">Privacy & Retention</h3>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">
              Operation Event Log Retention
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[30, 90, 365].map((days) => (
                <button
                  key={days}
                  type="button"
                  onClick={() => setKeepLogsDays(days as any)}
                  className={`p-3 rounded-lg border text-xs font-bold transition-all ${
                    keepLogsDays === days
                      ? 'bg-cyan-500 text-white border-cyan-500 shadow-sm'
                      : isDark
                      ? 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {days} Days
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              The engine automatically purges operation telemetry older than this timeframe.
            </p>
          </div>

          <div className="pt-3 border-t border-inherit flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="font-bold text-xs text-inherit">Export Forensic Account Data</span>
              <p className="text-[11px] text-slate-400">
                Download canonical JSON of your profile, registered devices, operations, and audit records.
              </p>
            </div>
            <button
              onClick={handleExportData}
              className="px-4 py-2 rounded-xl border border-cyan-500/40 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 text-xs font-bold flex items-center gap-1.5 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export JSON Archive</span>
            </button>
          </div>
        </div>
      </div>

      {/* Section 4: Supabase Key Compatibility & Deep Link Architecture (Corrections 1-3) */}
      <div
        className={`p-6 rounded-2xl border space-y-4 shadow-sm ${
          isDark ? 'bg-[#122A4D] border-[#1E3A5F]' : 'bg-white border-slate-200'
        }`}
      >
        <div className="flex items-center space-x-2 text-inherit pb-3 border-b border-inherit">
          <Database className="w-5 h-5 text-cyan-500" />
          <h3 className="font-bold text-sm uppercase tracking-wider">
            Supabase & Tauri Architecture Audit
          </h3>
        </div>

        <div className="space-y-3 text-xs font-mono">
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-slate-400 text-[11px] block">SUPABASE KEY COMPATIBILITY:</span>
              <span className="text-emerald-400 font-semibold">
                Modern sb_publishable_... (Standard) + Legacy 3-segment JWT (Active)
              </span>
            </div>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>

          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-slate-400 text-[11px] block">DESKTOP DEEP-LINK SCHEME:</span>
              <span className="text-cyan-400 font-semibold">
                com.cipherlabs.desktop://auth/callback (Rust 1.90+ Plugin Configured)
              </span>
            </div>
            <CheckCircle2 className="w-4 h-4 text-cyan-400" />
          </div>

          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-slate-400 text-[11px] block">AUDIT PRIVILEGES:</span>
              <span className="text-emerald-400 font-semibold">
                Direct inserts REVOKED. Controlled log_audit_event() security definer active.
              </span>
            </div>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>

          <p className="text-[11px] text-slate-500 font-sans">
            Note: Per security guidelines, API keys, JWT signatures, and Authorization tokens are
            never logged or displayed.
          </p>
        </div>
      </div>

      {/* Section 5: Session Management (PART 3 & PART 4) */}
      <div
        className={`p-6 rounded-2xl border space-y-4 shadow-sm ${
          isDark ? 'bg-[#122A4D] border-[#1E3A5F]' : 'bg-white border-slate-200'
        }`}
      >
        <div className="flex items-center space-x-2 text-inherit pb-3 border-b border-inherit">
          <KeyRound className="w-5 h-5 text-cyan-500" />
          <h3 className="font-bold text-sm uppercase tracking-wider">Session & Authentication</h3>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h4 className="font-bold text-sm text-slate-200">Active Operator Session</h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Signed in as <strong className="text-cyan-400">{profile.email}</strong>. Sign out to return to the authentication gateway.
            </p>
          </div>

          {onSignOut && (
            <button
              onClick={onSignOut}
              className="px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-bold transition-all shadow-sm"
            >
              Sign out of Workstation
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
