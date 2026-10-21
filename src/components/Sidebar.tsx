/**
 * Cipher Labs - Navigation Sidebar (PART 3 Specification)
 * 260px width, cyan square logo, shield-check, 7 items in exact order.
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
  Database,
  ExternalLink,
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
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab, isDark }) => {
  const navItems = [
    { id: 'dashboard' as NavTab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'erasure' as NavTab, label: 'Secure Erasure', icon: Eraser },
    { id: 'recovery' as NavTab, label: 'File Recovery', icon: FileSearch },
    { id: 'verification' as NavTab, label: 'Verification Center', icon: ShieldCheck },
    { id: 'reports' as NavTab, label: 'Reports & Audit', icon: FileText },
    { id: 'devices' as NavTab, label: 'Devices', icon: Laptop },
    { id: 'settings' as NavTab, label: 'Settings', icon: Settings },
  ];

  return (
    <aside
      className={`w-[260px] min-w-[260px] h-screen flex flex-col border-r transition-colors duration-200 select-none ${
        isDark
          ? 'bg-[#0B1F3A] border-[#1E3A5F] text-slate-200'
          : 'bg-white border-slate-200 text-slate-800'
      }`}
    >
      {/* Sidebar Header */}
      <div className="p-5 border-b border-inherit">
        <div className="flex items-center space-x-3">
          {/* Rounded Cyan Square (#06B6D4) with White Shield-Check */}
          <div className="w-10 h-10 rounded-xl bg-[#06B6D4] flex items-center justify-center shadow-md shadow-cyan-500/20 shrink-0">
            <ShieldCheck className="w-6 h-6 text-white stroke-[2.2]" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight tracking-tight text-inherit">
              Cipher Labs
            </h1>
            <p className="text-[10px] font-semibold tracking-wider text-[#06B6D4] uppercase">
              SECURE. RECOVER. VERIFY.
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Items (Exact Order from PART 3) */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 text-left ${
                isActive
                  ? isDark
                    ? 'bg-[#123A55] text-[#67E8F9] font-semibold shadow-sm'
                    : 'bg-[#E0F7FB] text-[#0E7490] font-semibold shadow-sm'
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
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Safety & Environment Status Badge */}
      <div className="p-4 border-t border-inherit">
        <div
          className={`p-3 rounded-lg text-xs space-y-1.5 ${
            isDark ? 'bg-[#122A4D]/80 border border-[#1E3A5F]' : 'bg-slate-50 border border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-400">Security Mode</span>
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-500">
              Active Guard
            </span>
          </div>
          <p className="text-[11px] text-slate-400 leading-snug">
            Simulation-only engine. Disk wipes and raw drive access are strictly locked.
          </p>
          <div className="pt-1 flex items-center justify-between text-[10px] text-slate-500">
            <span>FastAPI: 127.0.0.1:8765</span>
            <span className="text-cyan-500 font-mono">v1.0.0</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
