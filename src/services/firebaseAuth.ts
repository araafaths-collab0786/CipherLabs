/**
 * Cipher Labs - Firebase & Google OAuth Authentication Service
 * Enables client-side "Continue with Google" flow with Firebase Auth & OAuth Provider.
 */

import {
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { auth } from './firebase';
import { UserProfile } from '../types';

const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/userinfo.email');
provider.addScope('https://www.googleapis.com/auth/userinfo.profile');

let isSigningIn = false;
let cachedAccessToken: string | null = null;

export const initAuthListener = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (): Promise<{
  user: User;
  accessToken: string;
  profile: UserProfile;
} | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const accessToken = credential?.accessToken || '';
    cachedAccessToken = accessToken;

    const displayName = result.user.displayName || 'Google Operator';
    const nameParts = displayName.trim().split(' ');
    const firstName = nameParts[0] || 'Google';
    const lastName = nameParts.slice(1).join(' ') || 'Operator';
    const email = result.user.email || 'operator@cipherlabs.local';
    const id = result.user.uid;

    const profile: UserProfile = {
      id,
      firstName,
      lastName,
      email,
      phone: result.user.phoneNumber || undefined,
      preferences: {
        theme: 'dark',
        keepLogsDays: 90,
      },
    };

    return {
      user: result.user,
      accessToken,
      profile,
    };
  } catch (error: any) {
    console.error('Google Sign In Error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const logoutGoogle = async () => {
  await auth.signOut();
  cachedAccessToken = null;
};
