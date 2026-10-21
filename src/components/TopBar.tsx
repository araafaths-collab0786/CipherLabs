/**
 * Cipher Labs - Top Bar Component (PART 3 Specification)
 * 64px height, page title left, round dark mode toggle right.
 */

import React from 'react';
import { Sun, Moon, Shield, CheckCircle2, User } from 'lucide-react';
import { UserProfile } from '../types';

interface TopBarProps {
  title: string;
  subtitle?: string;
  isDark: boolean;
  onToggleTheme: () => void;
  profile: UserProfile;
  onSignOut: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  title,
  subtitle,
  isDark,
  onToggleTheme,
  profile,
  onSignOut,
}) => {
  return (
    <header
      className={`h-16 px-8 flex items-center justify-between border-b transition-colors duration-200 shrink-0 ${
        isDark
          ? 'bg-[#0B1F3A]/90 border-[#1E3A5F] text-white'
          : 'bg-white/90 border-slate-200 text-slate-900'
      } backdrop-blur-md sticky top-0 z-20`}
    >
      <div>
        <h2 className="text-xl font-bold tracking-tight text-inherit flex items-center gap-2">
          {title}
        </h2>
        {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
      </div>

      <div className="flex items-center space-x-4">
        {/* Sync Status Badge */}
        <div
          className={`hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
            isDark
              ? 'bg-[#122A4D] border-[#1E3A5F] text-slate-300'
              : 'bg-slate-50 border-slate-200 text-slate-600'
          }`}
          title="Supabase sync active; cryptographic local queue initialized"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[11px]">Ledger Synced</span>
        </div>

        {/* Round Dark-Mode Toggle (Moon in light mode, Sun in dark mode) */}
        <button
          onClick={onToggleTheme}
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-150 border ${
            isDark
              ? 'bg-[#122A4D] border-[#1E3A5F] text-amber-300 hover:bg-[#1E3A5F]'
              : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
          }`}
        >
          {isDark ? (
            <Sun className="w-4 h-4 stroke-[2.2]" />
          ) : (
            <Moon className="w-4 h-4 stroke-[2.2]" />
          )}
        </button>

        {/* User Profile Pill & Sign Out */}
        <div className="flex items-center space-x-2">
          <div
            className={`flex items-center space-x-2.5 pl-2 pr-3 py-1.5 rounded-full border ${
              isDark ? 'bg-[#122A4D] border-[#1E3A5F]' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-cyan-600 to-cyan-400 text-white flex items-center justify-center text-xs font-bold shadow-sm">
              {profile.firstName.charAt(0)}
            </div>
            <span className="text-xs font-semibold text-inherit">
              {profile.firstName} {profile.lastName}
            </span>
          </div>

          <button
            onClick={onSignOut}
            title="Sign out to Login Page"
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              isDark
                ? 'bg-slate-800/80 border-slate-700 hover:bg-slate-800 text-slate-300'
                : 'bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-700'
            }`}
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
};
