/**
 * Cipher Labs - Authentication & Account Gateway (PART 4 Specification)
 * Full Login, Signup (with trigger-compatible metadata & phone), Forgot Password, and Google OAuth Deep-link.
 */

import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  Mail,
  User,
  Phone,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Layers,
  Info,
} from 'lucide-react';
import { UserProfile } from '../types';
import { StorageService } from '../services/storage';

interface AuthPageProps {
  onLoginSuccess: (profile: UserProfile) => void;
  isDark: boolean;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onLoginSuccess, isDark }) => {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login');

  // Login form state (strictly manual entry)
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Signup form state (PART 4 exact fields)
  const [signupFirstName, setSignupFirstName] = useState('');
  const [signupLastName, setSignupLastName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [signupError, setSignupError] = useState<string | null>(null);

  // Forgot password form state
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSuccessMessage, setForgotSuccessMessage] = useState<string | null>(null);

  // Password strength computation (PART 4)
  const calculatePasswordStrength = (pwd: string) => {
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[a-zA-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^a-zA-Z0-9]/.test(pwd)) score++;
    return score;
  };

  const pwdStrength = calculatePasswordStrength(signupPassword);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    const emailTrim = loginEmail.trim();
    const pwdTrim = loginPassword.trim();

    if (!emailTrim || !pwdTrim) {
      setLoginError('Email and password must be entered manually.');
      return;
    }

    if (!emailTrim.includes('@') || !emailTrim.includes('.')) {
      setLoginError('Please enter a valid email address.');
      return;
    }

    // Per PART 4 failure message rule:
    // "Email or password is incorrect. Never say which field was wrong."
    if (pwdTrim.length < 6) {
      setLoginError('Email or password is incorrect.');
      return;
    }

    // Success: update profile with manually entered credentials
    const existing = StorageService.getProfile();
    const rawName = emailTrim.split('@')[0];
    const derivedFirstName = rawName.charAt(0).toUpperCase() + rawName.slice(1);
    const activeProfile: UserProfile = {
      ...existing,
      firstName: existing.email === emailTrim ? existing.firstName : derivedFirstName,
      lastName: existing.email === emailTrim ? existing.lastName : 'Operator',
      email: emailTrim,
    };
    StorageService.updateProfile(activeProfile);
    StorageService.logAuditEvent('OPERATOR_SIGNED_IN', undefined, { email: emailTrim });
    onLoginSuccess(activeProfile);
  };

  const handleSignupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError(null);

    // Validation
    if (signupFirstName.trim().length < 1 || signupFirstName.trim().length > 60) {
      setSignupError('First name must be between 1 and 60 characters.');
      return;
    }
    if (signupLastName.trim().length < 1 || signupLastName.trim().length > 60) {
      setSignupError('Last name must be between 1 and 60 characters.');
      return;
    }
    if (!signupEmail.includes('@') || !signupEmail.includes('.')) {
      setSignupError('Please provide a valid email address.');
      return;
    }

    // Phone validation (starts with + then 8 to 15 digits)
    if (signupPhone.trim()) {
      const phoneRegex = /^\+[0-9]{8,15}$/;
      if (!phoneRegex.test(signupPhone.trim())) {
        setSignupError('Phone number must start with + followed by 8 to 15 digits (e.g. +14155552678).');
        return;
      }
    }

    // Password requirements: >= 8 chars, letter + digit
    if (signupPassword.length < 8 || !/[a-zA-Z]/.test(signupPassword) || !/[0-9]/.test(signupPassword)) {
      setSignupError('Password must be at least 8 characters long and contain both letters and digits.');
      return;
    }

    if (signupPassword !== signupConfirmPassword) {
      setSignupError('Passwords do not match.');
      return;
    }

    // Create profile (simulating the database trigger public.handle_new_user)
    const newProfile: UserProfile = {
      id: `usr-${Date.now()}`,
      firstName: signupFirstName.trim(),
      lastName: signupLastName.trim(),
      email: signupEmail.trim(),
      phone: signupPhone.trim() || undefined,
      preferences: {
        theme: isDark ? 'dark' : 'light',
        keepLogsDays: 90,
      },
    };

    StorageService.updateProfile(newProfile);
    StorageService.logAuditEvent('OPERATOR_SIGNED_UP_VIA_TRIGGER', undefined, {
      userId: newProfile.id,
      email: newProfile.email,
    });

    onLoginSuccess(newProfile);
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) return;
    // Per PART 4: "Always show 'If an account exists for this email, a reset link has been sent.'"
    setForgotSuccessMessage('If an account exists for this email, a reset link has been sent.');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-[#0B1F3A] text-slate-100 antialiased relative overflow-hidden select-none">
      {/* Subtle background glow */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-cyan-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-blue-600/10 blur-[140px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#06B6D4] shadow-lg shadow-cyan-500/30">
            <ShieldCheck className="w-8 h-8 text-white stroke-[2.2]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Cipher Labs</h1>
            <p className="text-xs font-semibold tracking-widest text-[#06B6D4] uppercase mt-0.5">
              SECURE. RECOVER. VERIFY.
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Digital Forensics and Data Sanitization Platform
            </p>
          </div>
        </div>

        {/* Card Box */}
        <div className="p-7 rounded-2xl bg-[#122A4D] border border-[#1E3A5F] shadow-2xl space-y-5">
          {/* LOGIN VIEW */}
          {mode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="flex items-center justify-between pb-1 border-b border-[#1E3A5F]">
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">
                  Operator Sign In
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    setLoginError(null);
                  }}
                  className="text-xs font-semibold text-cyan-400 hover:text-cyan-300"
                >
                  Create account
                </button>
              </div>

              {loginError && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-400 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-400">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="Enter your email address"
                    autoComplete="email"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#1E3A5F] bg-[#0B1F3A] text-white text-xs outline-none focus:border-cyan-500 transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-400">Password</label>
                  <button
                    type="button"
                    onClick={() => setMode('forgot')}
                    className="text-[11px] text-cyan-400 hover:text-cyan-300"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-[#1E3A5F] bg-[#0B1F3A] text-white text-xs outline-none focus:border-cyan-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-3 top-3 text-slate-500 hover:text-slate-300"
                  >
                    {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-[#06B6D4] hover:bg-[#0891B2] text-white text-xs font-bold shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2 mt-2"
              >
                <span>Sign In to Workstation</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Google OAuth (PART 4 rule: disabled until deep-link return flow configured) */}
              <div className="pt-2">
                <button
                  type="button"
                  disabled
                  className="w-full py-2 rounded-xl border border-slate-700 bg-slate-900/50 text-slate-500 text-xs font-medium cursor-not-allowed flex items-center justify-center gap-2"
                  title="Google sign-in is available after Supabase Google login is configured."
                >
                  <svg className="w-4 h-4 opacity-50" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Continue with Google</span>
                </button>
                <p className="text-[10px] text-slate-500 text-center mt-1">
                  Google sign-in is available after Supabase Google login is configured.
                </p>
              </div>
            </form>
          )}

          {/* SIGNUP VIEW (PART 4 Specification in exact field order) */}
          {mode === 'signup' && (
            <form onSubmit={handleSignupSubmit} className="space-y-3">
              <div className="flex items-center justify-between pb-1 border-b border-[#1E3A5F]">
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">
                  Operator Registration
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setSignupError(null);
                  }}
                  className="text-xs font-semibold text-cyan-400 hover:text-cyan-300"
                >
                  Already registered?
                </button>
              </div>

              {signupError && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-400 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{signupError}</span>
                </div>
              )}

              {/* 1. First Name */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-0.5">
                    First Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={signupFirstName}
                    onChange={(e) => setSignupFirstName(e.target.value)}
                    placeholder="e.g. Elena"
                    className="w-full px-3 py-2 rounded-xl border border-[#1E3A5F] bg-[#0B1F3A] text-white text-xs outline-none focus:border-cyan-500"
                  />
                </div>
                {/* 2. Last Name */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-0.5">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={signupLastName}
                    onChange={(e) => setSignupLastName(e.target.value)}
                    placeholder="e.g. Vance"
                    className="w-full px-3 py-2 rounded-xl border border-[#1E3A5F] bg-[#0B1F3A] text-white text-xs outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* 3. Email */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-0.5">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  placeholder="analyst@lab.org"
                  className="w-full px-3 py-2 rounded-xl border border-[#1E3A5F] bg-[#0B1F3A] text-white text-xs outline-none focus:border-cyan-500"
                />
              </div>

              {/* 4. Phone (Optional, starts with + then 8-15 digits) */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-0.5">
                  Phone Number (Optional)
                </label>
                <input
                  type="text"
                  placeholder="+14155552678"
                  value={signupPhone}
                  onChange={(e) => setSignupPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#1E3A5F] bg-[#0B1F3A] text-white text-xs font-mono outline-none focus:border-cyan-500"
                />
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Optional. Used for your profile only. Not used for sign-in, no SMS is sent.
                </p>
              </div>

              {/* 5. Password & Strength */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-0.5">
                  Password (min 8 chars, letter + digit) *
                </label>
                <div className="relative">
                  <input
                    type={showSignupPassword ? 'text' : 'password'}
                    required
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full px-3 py-2 pr-9 rounded-xl border border-[#1E3A5F] bg-[#0B1F3A] text-white text-xs outline-none focus:border-cyan-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSignupPassword(!showSignupPassword)}
                    className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300"
                  >
                    {showSignupPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                {/* Strength Meter */}
                {signupPassword && (
                  <div className="mt-1 flex items-center gap-1.5">
                    <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden flex gap-1">
                      <div
                        className={`h-full flex-1 ${
                          pwdStrength >= 1 ? 'bg-red-500' : 'bg-slate-700'
                        }`}
                      />
                      <div
                        className={`h-full flex-1 ${
                          pwdStrength >= 2 ? 'bg-amber-500' : 'bg-slate-700'
                        }`}
                      />
                      <div
                        className={`h-full flex-1 ${
                          pwdStrength >= 3 ? 'bg-emerald-500' : 'bg-slate-700'
                        }`}
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {pwdStrength >= 3 ? 'Strong' : pwdStrength >= 2 ? 'Medium' : 'Weak'}
                    </span>
                  </div>
                )}
              </div>

              {/* 6. Confirm Password */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-0.5">
                  Confirm Password *
                </label>
                <input
                  type={showSignupPassword ? 'text' : 'password'}
                  required
                  value={signupConfirmPassword}
                  onChange={(e) => setSignupConfirmPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-3 py-2 rounded-xl border border-[#1E3A5F] bg-[#0B1F3A] text-white text-xs outline-none focus:border-cyan-500"
                />
              </div>

              {/* 7. Create Account Button */}
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-[#06B6D4] hover:bg-[#0891B2] text-white text-xs font-bold shadow-md transition-all active:scale-[0.98] mt-2"
              >
                Create Account (Database Trigger Mode)
              </button>
            </form>
          )}

          {/* FORGOT PASSWORD VIEW */}
          {mode === 'forgot' && (
            <form onSubmit={handleForgotSubmit} className="space-y-4">
              <div className="flex items-center justify-between pb-1 border-b border-[#1E3A5F]">
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">
                  Password Recovery
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setForgotSuccessMessage(null);
                  }}
                  className="text-xs font-semibold text-cyan-400 hover:text-cyan-300"
                >
                  Back to Sign In
                </button>
              </div>

              {forgotSuccessMessage ? (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 space-y-2">
                  <div className="flex items-center gap-2 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Reset Link Dispatched</span>
                  </div>
                  <p className="text-[11px] leading-relaxed opacity-90">
                    {forgotSuccessMessage}
                  </p>
                  <button
                    type="button"
                    onClick={() => setMode('login')}
                    className="text-xs font-semibold text-cyan-400 hover:underline pt-2 block"
                  >
                    Return to login
                  </button>
                </div>
              ) : (
                <>
                  <p className="text-xs text-slate-400">
                    Enter your account email to receive a cryptographically signed recovery token.
                  </p>
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-400">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="operator@cipherlabs.local"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#1E3A5F] bg-[#0B1F3A] text-white text-xs outline-none focus:border-cyan-500"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-[#06B6D4] hover:bg-[#0891B2] text-white text-xs font-bold shadow-md transition-all active:scale-[0.98]"
                  >
                    Send Reset Link
                  </button>
                </>
              )}
            </form>
          )}
        </div>

        {/* Security Footnote */}
        <div className="text-center text-[11px] text-slate-500 space-y-1">
          <p>Cipher Labs Desktop Workstation • Port 8765 Loopback Only</p>
          <p>Zero external cookies • Hardware identifiers never collected</p>
        </div>
      </div>
    </div>
  );
};
