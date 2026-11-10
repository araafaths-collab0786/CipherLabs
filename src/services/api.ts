/**
 * Cipher Labs - FastAPI Client & MongoDB Atlas Sync Service
 * Connects to the local FastAPI sidecar (127.0.0.1:8765) with Bearer JWT tokens.
 * Provides resilient local-first fallback when the sidecar is offline or in CONFIG_MISSING mode.
 */

import { StorageService } from './storage';
import { UserProfile, OperationRecord, ReportRecord, RecoveryCopyRecord } from '../types';

const API_BASE_URL = 'http://127.0.0.1:8765/api';
const TOKEN_KEY = 'cipherlabs_jwt_token';

export class ApiService {
  static getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  static setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
  }

  static clearToken(): void {
    localStorage.removeItem(TOKEN_KEY);
  }

  static async checkHealth(): Promise<{
    healthy: boolean;
    configMode: string;
    database: string;
  }> {
    try {
      const res = await fetch(`${API_BASE_URL}/health`, { signal: AbortSignal.timeout(1200) });
      if (res.ok) {
        const json = await res.json();
        return {
          healthy: true,
          configMode: json.data?.config_mode || 'OK',
          database: json.data?.database || 'MongoDB Atlas',
        };
      }
    } catch (e) {
      // Sidecar offline / local web preview mode
    }
    return {
      healthy: false,
      configMode: 'OFFLINE_FALLBACK',
      database: 'Local Encrypted Ledger',
    };
  }

  static async login(email: string, password: string): Promise<{ success: boolean; profile?: UserProfile; error?: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        signal: AbortSignal.timeout(2000),
      });

      const json = await res.json();
      if (json.data && json.data.token) {
        this.setToken(json.data.token);
        const p = json.data.profile;
        const profile: UserProfile = {
          id: p.id,
          firstName: p.first_name,
          lastName: p.last_name,
          email: p.email,
          phone: p.phone,
          preferences: p.preferences || { theme: 'dark', keepLogsDays: 90 },
        };
        StorageService.updateProfile(profile);
        return { success: true, profile };
      }
      if (json.error) {
        return { success: false, error: json.error.message };
      }
    } catch (e) {
      // Local fallback mode when offline
    }

    // Local client validation fallback
    if (password.length < 6) {
      return { success: false, error: 'Email or password is incorrect.' };
    }

    const existing = StorageService.getProfile();
    const rawName = email.split('@')[0];
    const derivedFirstName = rawName.charAt(0).toUpperCase() + rawName.slice(1);
    const fallbackProfile: UserProfile = {
      ...existing,
      firstName: existing.email === email ? existing.firstName : derivedFirstName,
      lastName: existing.email === email ? existing.lastName : 'Operator',
      email: email,
    };
    StorageService.updateProfile(fallbackProfile);
    return { success: true, profile: fallbackProfile };
  }

  static async signup(data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phone?: string;
  }): Promise<{ success: boolean; profile?: UserProfile; error?: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: data.firstName,
          last_name: data.lastName,
          email: data.email,
          password: data.password,
          phone: data.phone,
        }),
        signal: AbortSignal.timeout(2000),
      });

      const json = await res.json();
      if (json.data && json.data.token) {
        this.setToken(json.data.token);
        const p = json.data.profile;
        const profile: UserProfile = {
          id: p.id,
          firstName: p.first_name,
          lastName: p.last_name,
          email: p.email,
          phone: p.phone,
          preferences: p.preferences || { theme: 'dark', keepLogsDays: 90 },
        };
        StorageService.updateProfile(profile);
        return { success: true, profile };
      }
      if (json.error) {
        return { success: false, error: json.error.message };
      }
    } catch (e) {
      // Local fallback mode
    }

    const newProfile: UserProfile = {
      id: `usr-${Date.now()}`,
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      email: data.email.trim(),
      phone: data.phone?.trim() || undefined,
      preferences: {
        theme: 'dark',
        keepLogsDays: 90,
      },
    };
    StorageService.updateProfile(newProfile);
    return { success: true, profile: newProfile };
  }
}
