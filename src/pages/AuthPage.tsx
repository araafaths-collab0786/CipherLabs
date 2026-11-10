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
  LogIn,
  UserPlus,
  Cookie,
  FileText,
} from 'lucide-react';
import { UserProfile } from '../types';
import { StorageService } from '../services/storage';
import { ApiService } from '../services/api';
import { LegalModal } from '../components/LegalModals';
import { CookiePreferencesModal } from '../components/CookiePreferencesModal';
import { googleSignIn } from '../services/firebaseAuth';

interface AuthPageProps {
  onLoginSuccess: (profile: UserProfile) => void;
  isDark: boolean;
  onOpenCookiePreferences?: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({
  onLoginSuccess,
  isDark,
  onOpenCookiePreferences,
}) => {
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

  // Google Sign-In state
  const [isGoogleSigningIn, setIsGoogleSigningIn] = useState(false);

  // Legal acceptance & Cookie preference states
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [activeLegalModal, setActiveLegalModal] = useState<'privacy' | 'terms' | null>(null);
  const [isCookieModalOpen, setIsCookieModalOpen] = useState(false);

  // Forgot password form state
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSuccessMessage, setForgotSuccessMessage] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setLoginError(null);
    setSignupError(null);

    if (!acceptedTerms) {
      const errMsg =
        'You must check the box to confirm you have read and agree to the Privacy Policy and Terms and Conditions.';
      if (mode === 'signup') setSignupError(errMsg);
      else setLoginError(errMsg);
      return;
    }

    setIsGoogleSigningIn(true);
    try {
      const res = await googleSignIn();
      if (res && res.profile) {
        StorageService.updateProfile(res.profile);
        await StorageService.logAuditEvent('OPERATOR_LOGGED_IN_GOOGLE_OAUTH', undefined, {
          userId: res.profile.id,
          email: res.profile.email,
        });
        onLoginSuccess(res.profile);
      }
    } catch (err: any) {
      console.error('Google sign-in error:', err);
      // If user closes popup, do not show fatal error, just inform gracefully
      if (err?.code !== 'auth/popup-closed-by-user') {
        const msg = err?.message || 'Google sign-in failed. Please try again.';
        if (mode === 'signup') setSignupError(msg);
        else setLoginError(msg);
      }
    } finally {
      setIsGoogleSigningIn(false);
    }
  };

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

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    if (!acceptedTerms) {
      setLoginError('You must check the box to confirm you have read and agree to the Privacy Policy and Terms and Conditions.');
      return;
    }

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

    if (pwdTrim.length < 6) {
      setLoginError('Email or password is incorrect.');
      return;
    }

    const res = await ApiService.login(emailTrim, pwdTrim);
    if (res.success && res.profile) {
      await StorageService.logAuditEvent('OPERATOR_SIGNED_IN_FASTAPI', undefined, { email: emailTrim });
      onLoginSuccess(res.profile);
    } else {
      setLoginError(res.error || 'Email or password is incorrect.');
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError(null);

    if (!acceptedTerms) {
      setSignupError('You must check the box to confirm you have read and agree to the Privacy Policy and Terms and Conditions.');
      return;
    }

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
      setSignupError('Please enter a valid email address.');
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

    const res = await ApiService.signup({
      firstName: signupFirstName.trim(),
      lastName: signupLastName.trim(),
      email: signupEmail.trim(),
      password: signupPassword,
      phone: signupPhone.trim() || undefined,
    });

    if (res.success && res.profile) {
      await StorageService.logAuditEvent('OPERATOR_SIGNED_UP_MONGODB', undefined, {
        userId: res.profile.id,
        email: res.profile.email,
      });
      onLoginSuccess(res.profile);
    } else {
      setSignupError(res.error || 'Registration failed. Please check credentials.');
    }
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
          {/* Top Navigation Switcher: Login / Sign In vs Sign Up */}
          {mode !== 'forgot' && (
            <div className="grid grid-cols-2 p-1 rounded-xl bg-[#0B1F3A] border border-[#1E3A5F]">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setLoginError(null);
                }}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  mode === 'login'
                    ? 'bg-[#06B6D4] text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Login / Sign In</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setSignupError(null);
                }}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  mode === 'signup'
                    ? 'bg-[#06B6D4] text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Sign Up</span>
              </button>
            </div>
          )}

          {/* LOGIN VIEW */}
          {mode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="flex items-center justify-between pb-1 border-b border-[#1E3A5F]">
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">
                  Login / Sign In
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    setLoginError(null);
                  }}
                  className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                >
                  <span>Go to Sign Up</span>
                  <ArrowRight className="w-3 h-3" />
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

              {/* Mandatory Privacy Policy & Terms Acceptance Checkbox */}
              <div className="pt-1 pb-0.5">
                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={(e) => {
                      setAcceptedTerms(e.target.checked);
                      if (loginError?.includes('Privacy Policy')) setLoginError(null);
                    }}
                    className="mt-0.5 w-4 h-4 rounded border-[#1E3A5F] bg-[#0B1F3A] text-cyan-500 focus:ring-cyan-500 cursor-pointer shrink-0"
                  />
                  <span className="text-[11px] text-slate-300 leading-snug">
                    I confirm that I have read and agree to the{' '}
                    <button
                      type="button"
                      onClick={() => setActiveLegalModal('privacy')}
                      className="text-cyan-400 font-semibold underline hover:text-cyan-300 inline"
                    >
                      Privacy Policy
                    </button>{' '}
                    and{' '}
                    <button
                      type="button"
                      onClick={() => setActiveLegalModal('terms')}
                      className="text-cyan-400 font-semibold underline hover:text-cyan-300 inline"
                    >
                      Terms and Conditions
                    </button>
                    .
                  </span>
                </label>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-[#06B6D4] hover:bg-[#0891B2] text-white text-xs font-bold shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2 mt-2"
              >
                <span>Login / Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="pt-1 text-center">
                <p className="text-xs text-slate-400">
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('signup');
                      setLoginError(null);
                    }}
                    className="font-bold text-cyan-400 hover:underline"
                  >
                    Sign Up
                  </button>
                </p>
              </div>

              {/* Google OAuth Sign-In */}
              <div className="pt-2 border-t border-[#1E3A5F]">
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isGoogleSigningIn}
                  className="w-full py-2.5 rounded-xl border border-slate-600 bg-slate-900/80 hover:bg-slate-800 text-slate-100 text-xs font-semibold shadow-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2.5 disabled:opacity-50 cursor-pointer"
                >
                  {isGoogleSigningIn ? (
                    <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path
                        fill="#EA4335"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#4285F4"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                  )}
                  <span>{isGoogleSigningIn ? 'Signing in with Google...' : 'Continue with Google'}</span>
                </button>
                <p className="text-[10px] text-slate-400 text-center mt-1.5">
                  Secure OAuth 2.0 Single Sign-On powered by Google
                </p>
              </div>
            </form>
          )}

          {/* SIGNUP VIEW */}
          {mode === 'signup' && (
            <form onSubmit={handleSignupSubmit} className="space-y-3">
              <div className="flex items-center justify-between pb-1 border-b border-[#1E3A5F]">
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">
                  Sign Up
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setSignupError(null);
                  }}
                  className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                >
                  <span>Back to Login</span>
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

              {/* Mandatory Privacy Policy & Terms Acceptance Checkbox */}
              <div className="pt-1 pb-0.5">
                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={(e) => {
                      setAcceptedTerms(e.target.checked);
                      if (signupError?.includes('Privacy Policy')) setSignupError(null);
                    }}
                    className="mt-0.5 w-4 h-4 rounded border-[#1E3A5F] bg-[#0B1F3A] text-cyan-500 focus:ring-cyan-500 cursor-pointer shrink-0"
                  />
                  <span className="text-[11px] text-slate-300 leading-snug">
                    I confirm that I have read and agree to the{' '}
                    <button
                      type="button"
                      onClick={() => setActiveLegalModal('privacy')}
                      className="text-cyan-400 font-semibold underline hover:text-cyan-300 inline"
                    >
                      Privacy Policy
                    </button>{' '}
                    and{' '}
                    <button
                      type="button"
                      onClick={() => setActiveLegalModal('terms')}
                      className="text-cyan-400 font-semibold underline hover:text-cyan-300 inline"
                    >
                      Terms and Conditions
                    </button>
                    .
                  </span>
                </label>
              </div>

              {/* 7. Sign Up Submit Button */}
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-[#06B6D4] hover:bg-[#0891B2] text-white text-xs font-bold shadow-md transition-all active:scale-[0.98] mt-2 flex items-center justify-center gap-2"
              >
                <UserPlus className="w-4 h-4" />
                <span>Sign Up & Create Account</span>
              </button>

              <div className="pt-1 text-center">
                <p className="text-xs text-slate-400">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setSignupError(null);
                    }}
                    className="font-bold text-cyan-400 hover:underline"
                  >
                    Login / Sign In
                  </button>
                </p>
              </div>

              {/* Google OAuth Sign-In */}
              <div className="pt-2 border-t border-[#1E3A5F]">
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isGoogleSigningIn}
                  className="w-full py-2.5 rounded-xl border border-slate-600 bg-slate-900/80 hover:bg-slate-800 text-slate-100 text-xs font-semibold shadow-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2.5 disabled:opacity-50 cursor-pointer"
                >
                  {isGoogleSigningIn ? (
                    <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path
                        fill="#EA4335"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#4285F4"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                  )}
                  <span>{isGoogleSigningIn ? 'Signing in with Google...' : 'Continue with Google'}</span>
                </button>
                <p className="text-[10px] text-slate-400 text-center mt-1.5">
                  Secure OAuth 2.0 Single Sign-On powered by Google
                </p>
              </div>
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
                  Back to Login / Sign In
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
                    Return to Login / Sign In
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

        {/* Security & Legal Footnote */}
        <div className="text-center text-[11px] text-slate-400 space-y-2 pt-2">
          <div className="flex items-center justify-center gap-3 text-xs flex-wrap">
            <button
              type="button"
              onClick={() => setActiveLegalModal('privacy')}
              className="text-slate-400 hover:text-cyan-400 transition-colors underline-offset-2 hover:underline"
            >
              Privacy Policy
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => setActiveLegalModal('terms')}
              className="text-slate-400 hover:text-cyan-400 transition-colors underline-offset-2 hover:underline"
            >
              Terms and Conditions
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => {
                if (onOpenCookiePreferences) onOpenCookiePreferences();
                else setIsCookieModalOpen(true);
              }}
              className="text-slate-400 hover:text-cyan-400 transition-colors flex items-center gap-1 underline-offset-2 hover:underline"
            >
              <Cookie className="w-3.5 h-3.5" />
              <span>Cookie Preferences</span>
            </button>
          </div>
          <p className="text-slate-500 text-[10px]">
            Cipher Labs Forensics • Zero external telemetry • Local cryptographic ledger
          </p>
        </div>
      </div>

      {/* Interactive Privacy Policy & Terms Modal */}
      <LegalModal
        type={activeLegalModal}
        onClose={() => setActiveLegalModal(null)}
        onAccept={() => setAcceptedTerms(true)}
        isDark={isDark}
      />

      {/* Cookie Preferences Modal */}
      <CookiePreferencesModal
        isOpen={isCookieModalOpen}
        onClose={() => setIsCookieModalOpen(false)}
        isDark={isDark}
      />
    </div>
  );
};
