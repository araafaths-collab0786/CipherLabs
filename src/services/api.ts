/**
 * Cipher Labs - FastAPI Client & MongoDB Atlas Sync Service
 * Connects to the local FastAPI sidecar (127.0.0.1:8765) with Bearer JWT tokens.
 * Provides resilient local-first fallback when the sidecar is offline or in CONFIG_MISSING mode.
 */

import { StorageService } from './storage';
import { UserProfile, OperationRecord, ReportRecord, RecoveryCopyRecord } from '../types';

const API_BASE_URL = 'http://127.0.0.1:8765/api';
const TOKEN_KEY = 'cipherlabs_jwt_token';

export interface ApiDeletionOperation {
  id: string;
  user_id?: string;
  operation_type: OperationRecord['operationType'];
  mode: OperationRecord['mode'];
  target_reference: string;
  method: string;
  execution_status: OperationRecord['executionStatus'];
  verification_status: OperationRecord['verificationStatus'];
  tracking_state: OperationRecord['trackingState'];
  idempotency_key: string;
  target_count: number;
  has_recovery_copy: boolean;
  total_bytes_processed?: number;
  successful_count?: number;
  failed_count?: number;
  created_at: string;
  completed_at?: string;
  verification_message: string;
  pre_hashes: Record<string, string>;
}

export interface ApiDeletionReport {
  id: string;
  user_id?: string;
  operation_id: string;
  idempotency_key: string;
  report_status: ReportRecord['reportStatus'];
  report_sha256: string;
  created_at: string;
  report_json: {
    title?: string;
    operationType: string;
    method: string;
    executionStatus: string;
    verificationStatus: string;
    targets: Array<{
      name: string;
      size: number;
      sha256: string;
      deletionStatus?: string;
      verificationStatus?: string;
      savedToRecovery?: boolean;
    }>;
    simulationDisclaimer: string;
    timestamp: string;
  };
}

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
    } catch (error) {
      console.error('Sign-in request failed:', error);
      return { success: false, error: 'The sign-in service is unavailable. Check your connection and try again.' };
    }

    return { success: false, error: 'Sign-in could not be completed. Please try again.' };
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
    } catch (error) {
      console.error('Sign-up request failed:', error);
      return { success: false, error: 'The sign-up service is unavailable. Check your connection and try again.' };
    }

    return { success: false, error: 'Sign-up could not be completed. Please try again.' };
  }

  static async validateErasureTargets(targetPaths: string[]): Promise<{
    success: boolean;
    data?: {
      targets: Array<{
        original_path: string;
        canonical_path: string;
        name: string;
        exists: boolean;
        is_directory: boolean;
        is_link: boolean;
        size_bytes: number;
        file_type: string;
        is_valid: boolean;
        rejection_reason?: string | null;
        contained_files: number;
        contained_folders: number;
      }>;
      summary: {
        total_targets: number;
        eligible_targets: number;
        ineligible_targets: number;
        total_size_bytes: number;
        total_files: number;
        total_folders: number;
      };
    };
    error?: string;
  }> {
    try {
      const token = this.getToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE_URL}/erasure/validate`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ targets: targetPaths }),
        signal: AbortSignal.timeout(3000),
      });

      const json = await res.json();
      if (json.data) {
        return { success: true, data: json.data };
      }
      if (json.error) {
        return { success: false, error: json.error.message };
      }
    } catch (e) {
      // Offline / fallback
    }

    return { success: false, error: 'Sidecar offline or validation failed' };
  }

  static async executePermanentDeletion(
    targetPaths: string[],
    confirmationSignature: string,
    saveInRecovery: boolean,
    mode: string = 'PERMANENT_DELETION',
    sanitizationAlgorithm?: string
  ): Promise<{
    success: boolean;
    data?: {
      operation: ApiDeletionOperation;
      recovery_copies: RecoveryCopyRecord[];
      report: ApiDeletionReport;
    };
    error?: string;
  }> {
    try {
      const token = this.getToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE_URL}/erasure/delete`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          targets: targetPaths,
          confirmation_signature: confirmationSignature,
          save_in_recovery: saveInRecovery,
          mode,
          sanitization_algorithm: sanitizationAlgorithm,
        }),
        signal: AbortSignal.timeout(10000),
      });

      const json = await res.json();
      if (json.data) {
        return { success: true, data: json.data };
      }
      if (json.error) {
        return { success: false, error: json.error.message };
      }
    } catch (e) {
      // Offline / fallback
    }

    return { success: false, error: 'Sidecar offline or operation failed' };
  }

  static async getRecoveryFile(
    recoveryFileName: string,
    originalSha256: string
  ): Promise<Blob> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const token = this.getToken();
    if (token) headers.Authorization = `Bearer ${token}`;

    const response = await fetch(`${API_BASE_URL}/recovery/file`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        recovery_file_name: recoveryFileName,
        original_sha256: originalSha256,
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      let detail = `Recovery vault request failed (${response.status}).`;
      try {
        const error = await response.json();
        if (typeof error.detail === 'string') detail = error.detail;
      } catch {
        // Keep the HTTP status message when the server does not return JSON.
      }
      throw new Error(detail);
    }

    return response.blob();
  }
}
