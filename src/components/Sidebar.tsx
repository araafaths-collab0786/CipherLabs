/**
 * Cipher Labs - Navigation Sidebar (PART 3 Specification)
 * 260px width (collapsible to 72px), cyan square logo, shield-check, 7 items in exact order.
 */

import React from 'react';
import {
  LayoutDashboard,
  Eraser,
  FileSearch,
  ShieldCheck,
  FileText,
  Laptop,
  Settings,
  ShieldAlert,
} from 'lucide-react';

export type NavTab =
  | 'dashboard'
  | 'erasure'
  | 'recovery'
  | 'verification'
  | 'reports'
  | 'devices'
  | 'settings';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  isDark: boolean;
  isMinimized?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isDark,
  isMinimized = false,
}) => {
  const navItems = [
    { id: 'dashboard' as NavTab, label: 'Dashboard', icon: LayoutDashboard, shortcut: 'Alt+1' },
    { id: 'erasure' as NavTab, label: 'Secure Erasure', icon: Eraser, shortcut: 'Alt+2' },
    { id: 'recovery' as NavTab, label: 'File Recovery', icon: FileSearch, shortcut: 'Alt+3' },
    { id: 'verification' as NavTab, label: 'Verification Center', icon: ShieldCheck, shortcut: 'Alt+4' },
    { id: 'reports' as NavTab, label: 'Reports & Audit', icon: FileText, shortcut: 'Alt+5' },
    { id: 'devices' as NavTab, label: 'Devices', icon: Laptop, shortcut: 'Alt+6' },
    { id: 'settings' as NavTab, label: 'Settings', icon: Settings, shortcut: 'Alt+7' },
  ];

  return (
    <aside
      className={`${
        isMinimized ? 'w-[72px] min-w-[72px]' : 'w-[260px] min-w-[260px]'
      } h-screen flex flex-col border-r transition-all duration-200 select-none ${
        isDark
          ? 'bg-[#0B1F3A] border-[#1E3A5F] text-slate-200'
          : 'bg-white border-slate-200 text-slate-800'
      }`}
    >
      {/* Sidebar Header */}
      <div className={`p-4 border-b border-inherit ${isMinimized ? 'flex justify-center' : ''}`}>
        <div className={`flex items-center ${isMinimized ? 'justify-center' : 'space-x-3'}`}>
          {/* Rounded Cyan Square (#06B6D4) with White Shield-Check */}
          <div
            className="w-10 h-10 rounded-xl bg-[#06B6D4] flex items-center justify-center shadow-md shadow-cyan-500/20 shrink-0"
            title="Cipher Labs"
          >
            <ShieldCheck className="w-6 h-6 text-white stroke-[2.2]" />
          </div>
          {!isMinimized && (
            <div className="overflow-hidden">
              <h1 className="font-bold text-lg leading-tight tracking-tight text-inherit truncate">
                Cipher Labs
              </h1>
              <p className="text-[10px] font-semibold tracking-wider text-[#06B6D4] uppercase truncate">
                SECURE. RECOVER. VERIFY.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Items (Exact Order from PART 3) */}
      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              title={`${item.label} (${item.shortcut})`}
              className={`w-full flex items-center ${
                isMinimized ? 'justify-center px-0' : 'space-x-3 px-3.5'
              } py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ease-in-out hover:scale-[1.02] active:scale-[0.98] text-left ${
                isActive
                  ? isDark
                    ? 'bg-[#123A55] text-[#67E8F9] font-semibold shadow-sm ring-1 ring-cyan-500/30'
                    : 'bg-[#E0F7FB] text-[#0E7490] font-semibold shadow-sm ring-1 ring-cyan-500/30'
                  : isDark
                  ? 'text-slate-400 hover:text-slate-200 hover:bg-[#122A4D]/60'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon
                className={`w-4 h-4 shrink-0 transition-colors ${
                  isActive
                    ? isDark
                      ? 'text-[#67E8F9]'
                      : 'text-[#0E7490]'
                    : isDark
                    ? 'text-slate-400'
                    : 'text-slate-500'
                }`}
              />
              {!isMinimized && (
                <>
                  <span className="truncate flex-1">{item.label}</span>
                  <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-slate-800/60 text-slate-400 border border-slate-700/40">
                    {item.shortcut}
                  </span>
                </>
              )}
            </button>
          );
        })}
      </nav>

      {/* Safety & Environment Status Badge (Security Mode) */}
      <div className="p-3 border-t border-inherit">
        {isMinimized ? (
          <div
            className="flex items-center justify-center p-2 rounded-lg bg-emerald-500/10 text-emerald-500"
            title="Security Mode: Active Guard. Disk wipes locked."
          >
            <ShieldAlert className="w-5 h-5" />
          </div>
        ) : (
          <div
            className={`p-3 rounded-lg text-xs space-y-1.5 ${
              isDark ? 'bg-[#122A4D]/80 border border-[#1E3A5F]' : 'bg-slate-50 border border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Security Mode</span>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                Active Guard
              </span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug">
              Disk wipes and raw drive access are strictly locked.
            </p>
            <div className="pt-1 flex items-center justify-between text-[10px] text-slate-500">
              <span>Forensics Engine</span>
              <span className="text-cyan-600 dark:text-cyan-400 font-mono">v1.0.1</span>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
