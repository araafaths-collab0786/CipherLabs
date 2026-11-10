/**
 * Cipher Labs - Main Application Root
 * SECURE. RECOVER. VERIFY.
 * Digital Forensics and Data Sanitization
 */

import React, { useState, useEffect } from 'react';
import { Sidebar, NavTab } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { Dashboard } from './pages/Dashboard';
import { SecureErasure } from './pages/SecureErasure';
import { FileRecovery } from './pages/FileRecovery';
import { VerificationCenter } from './pages/VerificationCenter';
import { ReportsAudit } from './pages/ReportsAudit';
import { DevicesPage } from './pages/DevicesPage';
import { SettingsPage } from './pages/SettingsPage';
import { AuthPage } from './pages/AuthPage';
import { StorageService } from './services/storage';
import { logoutGoogle } from './services/firebaseAuth';
import { CookieConsentBanner, CookiePreferencesModal } from './components/CookiePreferencesModal';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import {
  AuditLogEntry,
  DeviceRecord,
  OperationRecord,
  RecoveryCopyRecord,
  ReportRecord,
  UserProfile,
} from './types';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  // Initialize demo state on first load
  useEffect(() => {
    StorageService.initializeDemoData();
  }, []);

  const [profile, setProfile] = useState<UserProfile>(() => StorageService.getProfile());
  const [device, setDevice] = useState<DeviceRecord>(() => StorageService.getDevice());
  const [operations, setOperations] = useState<OperationRecord[]>(() =>
    StorageService.getOperations()
  );
  const [recoveryCopies, setRecoveryCopies] = useState<RecoveryCopyRecord[]>(() =>
    StorageService.getRecoveryCopies()
  );
  const [reports, setReports] = useState<ReportRecord[]>(() => StorageService.getReports());
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>(() => StorageService.getAuditLog());

  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [isSidebarMinimized, setIsSidebarMinimized] = useState<boolean>(false);
  const [isDark, setIsDark] = useState<boolean>(() => {
    const pref = StorageService.getProfile().preferences.theme;
    return pref ? pref === 'dark' : true;
  });

  const [activeReportToView, setActiveReportToView] = useState<ReportRecord | null>(null);
  const [isCookieModalOpen, setIsCookieModalOpen] = useState(false);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);

  // Keyboard Navigation Hook
  const { activeShortcutNotice } = useKeyboardShortcuts({
    onSelectTab: setCurrentTab,
    onToggleShortcutsModal: () => setIsShortcutsModalOpen((prev) => !prev),
    onCloseModal: () => {
      setIsShortcutsModalOpen(false);
      setIsCookieModalOpen(false);
      setActiveReportToView(null);
    },
  });

  // Always enforce dark theme on HTML root
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  const handleToggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    const updated = StorageService.updateProfile({
      preferences: {
        ...profile.preferences,
        theme: nextDark ? 'dark' : 'light',
      },
    });
    setProfile(updated);
  };

  const handleRefreshOperations = () => {
    setOperations(StorageService.getOperations());
    setReports(StorageService.getReports());
    setAuditLog(StorageService.getAuditLog());
  };

  const handleRefreshCopies = () => {
    setRecoveryCopies(StorageService.getRecoveryCopies());
    setOperations(StorageService.getOperations());
    setAuditLog(StorageService.getAuditLog());
  };

  const handleSimulationCompleted = (
    op: OperationRecord,
    copies: RecoveryCopyRecord[],
    rep: ReportRecord
  ) => {
    setOperations(StorageService.getOperations());
    setRecoveryCopies(StorageService.getRecoveryCopies());
    setReports(StorageService.getReports());
    setAuditLog(StorageService.getAuditLog());
  };

  const getPageTitle = (tab: NavTab) => {
    switch (tab) {
      case 'dashboard':
        return 'Dashboard';
      case 'erasure':
        return 'Secure Erasure';
      case 'recovery':
        return 'File Recovery';
      case 'verification':
        return 'Verification Center';
      case 'reports':
        return 'Reports & Audit';
      case 'devices':
        return 'Devices';
      case 'settings':
        return 'Settings';
    }
  };

  if (!isAuthenticated) {
    return (
      <AuthPage
        onLoginSuccess={(p) => {
          setProfile(p);
          setIsAuthenticated(true);
        }}
        isDark={isDark}
      />
    );
  }

  return (
    <div
      className={`min-h-screen flex antialiased transition-colors duration-200 ${
        isDark ? 'bg-[#0B1F3A] text-slate-100' : 'bg-[#F3F6F8] text-slate-900'
      }`}
    >
      {/* Left Sidebar (Collapsible) */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        isDark={isDark}
        isMinimized={isSidebarMinimized}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top Bar with Minimize/Restore Toggle */}
        <TopBar
          title={getPageTitle(currentTab)}
          subtitle="Cipher Labs • SECURE. RECOVER. VERIFY."
          isDark={isDark}
          onToggleTheme={handleToggleTheme}
          profile={profile}
          onSignOut={() => {
            logoutGoogle();
            setIsAuthenticated(false);
          }}
          isMinimized={isSidebarMinimized}
          onToggleMinimize={() => setIsSidebarMinimized((prev) => !prev)}
          onToggleShortcutsModal={() => setIsShortcutsModalOpen(true)}
        />

        {/* Scrollable Page Body */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          <div key={currentTab} className="max-w-[1200px] mx-auto page-transition">
            {currentTab === 'dashboard' && (
              <Dashboard
                operations={operations}
                reports={reports}
                recoveryCopies={recoveryCopies}
                profile={profile}
                isDark={isDark}
                onNavigate={setCurrentTab}
                onViewReport={(rep) => {
                  setActiveReportToView(rep);
                  setCurrentTab('reports');
                }}
              />
            )}

            {currentTab === 'erasure' && (
              <SecureErasure
                isDark={isDark}
                profile={profile}
                onSimulationCompleted={handleSimulationCompleted}
                onNavigateToRecovery={() => setCurrentTab('recovery')}
              />
            )}

            {currentTab === 'recovery' && (
              <FileRecovery
                isDark={isDark}
                recoveryCopies={recoveryCopies}
                onRefreshCopies={handleRefreshCopies}
              />
            )}

            {currentTab === 'verification' && (
              <VerificationCenter
                isDark={isDark}
                operations={operations}
                onRefreshOperations={handleRefreshOperations}
                onNavigateToReports={(reportId) => {
                  if (reportId) {
                    const rep = StorageService.getReports().find((r) => r.id === reportId);
                    if (rep) setActiveReportToView(rep);
                  }
                  setCurrentTab('reports');
                }}
              />
            )}

            {currentTab === 'reports' && (
              <ReportsAudit
                isDark={isDark}
                reports={reports}
                auditLog={auditLog}
                onRefreshAudit={() => setAuditLog(StorageService.getAuditLog())}
                activeReportToView={activeReportToView}
                onCloseReportModal={() => setActiveReportToView(null)}
              />
            )}

            {currentTab === 'devices' && (
              <DevicesPage
                isDark={isDark}
                device={device}
                onRefreshDevice={() => setDevice(StorageService.getDevice())}
              />
            )}

            {currentTab === 'settings' && (
              <SettingsPage
                isDark={isDark}
                onToggleTheme={handleToggleTheme}
                profile={profile}
                onUpdateProfile={setProfile}
                onSignOut={() => {
                  logoutGoogle();
                  setIsAuthenticated(false);
                }}
              />
            )}
          </div>
        </main>
      </div>

      {/* Keyboard Shortcut Active Feedback Toast Notice */}
      {activeShortcutNotice && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl bg-[#0B1F3A]/95 border border-cyan-500/40 text-white shadow-2xl backdrop-blur-md flex items-center gap-3 animate-in fade-in slide-in-from-bottom-3 font-mono text-xs">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span>Navigated to <strong>{activeShortcutNotice.label}</strong></span>
          <span className="px-2 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700 font-bold">
            {activeShortcutNotice.keyCombo}
          </span>
        </div>
      )}

      {/* Global Keyboard Shortcuts Modal Guide */}
      <KeyboardShortcutsModal
        isOpen={isShortcutsModalOpen}
        onClose={() => setIsShortcutsModalOpen(false)}
        isDark={isDark}
      />

      {/* Global Cookie Consent Banner */}
      <CookieConsentBanner
        onOpenPreferences={() => setIsCookieModalOpen(true)}
        isDark={isDark}
      />

      {/* Global Cookie Preferences Modal */}
      <CookiePreferencesModal
        isOpen={isCookieModalOpen}
        onClose={() => setIsCookieModalOpen(false)}
        isDark={isDark}
      />
    </div>
  );
}
