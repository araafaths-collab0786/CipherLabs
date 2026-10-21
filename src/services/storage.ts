/**
 * Cipher Labs - Storage, Cryptographic Engine & Forensic Simulator
 * SECURE. RECOVER. VERIFY.
 */

import {
  AuditLogEntry,
  DeviceRecord,
  OperationRecord,
  RecoveryCandidate,
  RecoveryCopyRecord,
  ReportRecord,
  TestFile,
  UserProfile,
} from '../types';

const STORAGE_KEYS = {
  PROFILE: 'cipherlabs_profile',
  FILES: 'cipherlabs_test_files',
  OPERATIONS: 'cipherlabs_operations',
  AUDIT: 'cipherlabs_audit_log',
  REPORTS: 'cipherlabs_reports',
  RECOVERY_COPIES: 'cipherlabs_recovery_copies',
  DEVICE: 'cipherlabs_device',
  CANDIDATES: 'cipherlabs_candidates',
  THEME: 'cipherlabs_theme',
};

// Cryptographic SHA-256 using standard Web Crypto API
export async function computeSha256(data: string | Uint8Array): Promise<string> {
  const encoder = new TextEncoder();
  const bytes = typeof data === 'string' ? encoder.encode(data) : data;
  const hashBuffer = await crypto.subtle.digest('SHA-256', bytes as unknown as BufferSource);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

// Canonical JSON for deterministic cryptographic hashing
export function toCanonicalJson(obj: any): string {
  if (obj === null || typeof obj !== 'object') {
    return JSON.stringify(obj);
  }
  if (Array.isArray(obj)) {
    return `[${obj.map(toCanonicalJson).join(',')}]`;
  }
  const keys = Object.keys(obj).sort();
  const entries = keys.map((k) => `"${k}":${toCanonicalJson(obj[k])}`);
  return `{${entries.join(',')}}`;
}

// Initial Sample Files in Controlled Workspace
const INITIAL_TEST_FILES: TestFile[] = [
  {
    id: 'tf-01',
    name: 'confidential_financials_2026.pdf',
    relativePath: '/app-data/test-workspace/confidential_financials_2026.pdf',
    sizeBytes: 245760,
    fileType: 'PDF Document',
    mimeType: 'application/pdf',
    lastModified: '2026-10-18T14:22:00Z',
    sha256: '4f2a789bc1034ad67e12f009bda45012e8790312fa098b67ce421190cd89aef1',
    status: 'ACTIVE',
    previewText: '%PDF-1.7\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n... [Cipher Labs Synthetic Financial Report 2026 - Q3 EBITDA Margin +34.2%]',
  },
  {
    id: 'tf-02',
    name: 'database_backup_dump.sql',
    relativePath: '/app-data/test-workspace/database_backup_dump.sql',
    sizeBytes: 524288,
    fileType: 'SQL Database Dump',
    mimeType: 'application/sql',
    lastModified: '2026-10-19T08:15:30Z',
    sha256: '9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b',
    status: 'ACTIVE',
    previewText: '-- Cipher Labs Synthetic DB Dump v4.2\nCREATE TABLE accounts (id UUID, token TEXT);\nINSERT INTO accounts VALUES ...',
  },
  {
    id: 'tf-03',
    name: 'patient_health_records.csv',
    relativePath: '/app-data/test-workspace/patient_health_records.csv',
    sizeBytes: 131072,
    fileType: 'CSV Dataset',
    mimeType: 'text/csv',
    lastModified: '2026-10-20T11:40:12Z',
    sha256: '3e1b0c9a7d8f5e6a4b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1f0a',
    status: 'ACTIVE',
    previewText: 'patient_id,subject_hash,biometric_scan_date,diagnostic_code\nPT-9012,8f3e091b...,2026-10-12,M79.3\nPT-9013,11a4bc20...,2026-10-14,R05.1',
  },
  {
    id: 'tf-04',
    name: 'executive_keynote_draft.docx',
    relativePath: '/app-data/test-workspace/executive_keynote_draft.docx',
    sizeBytes: 911360,
    fileType: 'Word Document',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    lastModified: '2026-10-21T06:55:00Z',
    sha256: '7b6a5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a6b',
    status: 'ACTIVE',
    previewText: 'PK\x03\x04... [Content_Types].xml ... [Executive Keynote: Principles of Zero-Knowledge Data Sanitization & Cryptographic Erasure Proofs]',
  },
  {
    id: 'tf-05',
    name: 'system_access_credentials.env',
    relativePath: '/app-data/test-workspace/system_access_credentials.env',
    sizeBytes: 16384,
    fileType: 'ENV Config',
    mimeType: 'text/plain',
    lastModified: '2026-10-21T07:10:00Z',
    sha256: '2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d',
    status: 'ACTIVE',
    previewText: 'STAGE=DEMO\nVAULT_CLUSTER=isolated-local-01\nTOKEN_SALT=cipher_lab_sim_salt_9921',
  },
];

// Initial Synthetic Disk Carving Candidates (Phase 2 Forensic Lab)
const INITIAL_CANDIDATES: RecoveryCandidate[] = [
  {
    id: 'cand-01',
    scanId: 'scan-synth-01',
    fileType: 'JPEG',
    byteOffset: 2097152, // 2MB
    estimatedSizeBytes: 142850,
    state: 'VALIDATED',
    confidence: 90,
    confidenceComponents: {
      headerFound: true, // +30
      footerFound: true, // +30
      structureChecksPassed: true, // +30
      reparsePassed: false, // +10 (upon restoration)
    },
    classifierLabel: 'IMAGE_JPEG_HIGH_CONFIDENCE',
    validationChecks: {
      signatureHeader: 'FF D8 FF E0 00 10 4A 46 49 46 (JFIF header valid)',
      signatureFooter: 'FF D9 (EOI marker verified)',
      internalCrcMatch: true,
      streamContinuity: true,
    },
    sha256: 'd41d8cd98f00b204e9800998ecf8427e5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d',
    hexPreview: [
      '00200000: FF D8 FF E0 00 10 4A 46  49 46 00 01 01 01 00 48  ......JFIF.....H',
      '00200010: 00 48 00 00 FF DB 00 43  00 08 06 06 07 06 05 08  .H.....C........',
      '00200020: 07 07 07 09 09 08 0A 0C  14 0D 0C 0B 0B 0C 19 12  ................',
      '00200030: 13 0F 14 1D 1A 1F 1E 1D  1A 1C 1C 20 24 2E 27 20  ........... $.\' ',
    ],
  },
  {
    id: 'cand-02',
    scanId: 'scan-synth-01',
    fileType: 'PNG',
    byteOffset: 4194304, // 4MB
    estimatedSizeBytes: 284100,
    state: 'DETECTED',
    confidence: 60,
    confidenceComponents: {
      headerFound: true,
      footerFound: false,
      structureChecksPassed: true,
      reparsePassed: false,
    },
    classifierLabel: 'IMAGE_PNG_PARTIAL',
    validationChecks: {
      signatureHeader: '89 50 4E 47 0D 0A 1A 0A (PNG signature valid)',
      signatureFooter: 'Missing IEND chunk within cluster boundary',
      internalCrcMatch: false,
      streamContinuity: true,
    },
    sha256: 'a1b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef0',
    hexPreview: [
      '00400000: 89 50 4E 47 0D 0A 1A 0A  00 00 00 0D 49 48 44 52  .PNG........IHDR',
      '00400010: 00 00 04 00 00 00 03 00  08 06 00 00 00 E8 B2 59  ...............Y',
      '00400020: 38 00 00 00 01 73 52 47  42 00 AE CE 1C E9 00 00  8....sRGB.......',
    ],
  },
  {
    id: 'cand-03',
    scanId: 'scan-synth-01',
    fileType: 'PDF',
    byteOffset: 7340032, // 7MB
    estimatedSizeBytes: 420900,
    state: 'VALIDATED',
    confidence: 90,
    confidenceComponents: {
      headerFound: true,
      footerFound: true,
      structureChecksPassed: true,
      reparsePassed: false,
    },
    classifierLabel: 'DOCUMENT_PDF_CLEAN',
    validationChecks: {
      signatureHeader: '%PDF-1.6 (Header verified)',
      signatureFooter: '%%EOF (Cross-reference trailer verified)',
      internalCrcMatch: true,
      streamContinuity: true,
    },
    sha256: '9f8e7d6c5b4a3928170e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c',
    hexPreview: [
      '00700000: 25 50 44 46 2D 31 2E 36  0A 25 E2 E3 CF D3 0A 34  %PDF-1.6.%.....4',
      '00700010: 20 30 20 6F 62 6A 0A 3C  3C 2F 4C 69 6E 65 61 72   0 obj.<</Linear',
      '00700020: 69 7A 65 64 20 31 2F 4C  20 34 32 30 39 30 30 2F  ized 1/L 420900/',
    ],
  },
  {
    id: 'cand-04',
    scanId: 'scan-synth-01',
    fileType: 'ZIP',
    byteOffset: 9437184, // 9MB
    estimatedSizeBytes: 189200,
    state: 'VALIDATED',
    confidence: 90,
    confidenceComponents: {
      headerFound: true,
      footerFound: true,
      structureChecksPassed: true,
      reparsePassed: false,
    },
    classifierLabel: 'ARCHIVE_ZIP_EOCD_MATCH',
    validationChecks: {
      signatureHeader: '50 4B 03 04 (Local file header)',
      signatureFooter: '50 4B 05 06 (End of Central Directory)',
      internalCrcMatch: true,
      streamContinuity: true,
    },
    sha256: 'b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4',
    hexPreview: [
      '00900000: 50 4B 03 04 14 00 00 00  08 00 78 5A 92 59 0B 7A  PK........xZ.Y.z',
      '00900010: 45 1C 2A 01 00 00 8C 03  00 00 0C 00 00 00 64 61  E.*...........da',
    ],
  },
  {
    id: 'cand-05',
    scanId: 'scan-synth-01',
    fileType: 'GIF',
    byteOffset: 12582912, // 12MB
    estimatedSizeBytes: 98400,
    state: 'VALIDATED',
    confidence: 90,
    confidenceComponents: {
      headerFound: true,
      footerFound: true,
      structureChecksPassed: true,
      reparsePassed: false,
    },
    classifierLabel: 'IMAGE_GIF89A_VERIFIED',
    validationChecks: {
      signatureHeader: '47 49 46 38 39 61 (GIF89a signature)',
      signatureFooter: '3B (Trailer byte valid)',
      internalCrcMatch: true,
      streamContinuity: true,
    },
    sha256: '5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b',
    hexPreview: [
      '00C00000: 47 49 46 38 39 61 2C 01  96 00 F7 00 00 00 00 00  GIF89a,.........',
      '00C00010: 21 F9 04 01 00 00 00 00  2C 00 00 00 00 2C 01 96  !.......,....,..',
    ],
  },
];

// Default App Device Record
const DEFAULT_DEVICE: DeviceRecord = {
  id: 'dev-001',
  userId: 'usr-analyst-001',
  appDeviceId: '7f9c2a11-8843-4e6f-99ab-61d08c5ea410',
  label: 'Forensic Workstation Win11-Pro',
  osName: 'Windows',
  osVersion: '11 Pro 23H2 (Build 22631.3007)',
  appVersion: '1.0.0',
  lastSeenAt: new Date().toISOString(),
};

// Default User Profile
const DEFAULT_PROFILE: UserProfile = {
  id: 'usr-analyst-001',
  firstName: 'Forensics',
  lastName: 'Operator',
  email: 'operator@cipherlabs.local',
  phone: '+14155552678',
  preferences: {
    theme: 'dark',
    keepLogsDays: 90,
  },
};

export class StorageService {
  // Profiles
  static getProfile(): UserProfile {
    const raw = localStorage.getItem(STORAGE_KEYS.PROFILE);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(DEFAULT_PROFILE));
      return DEFAULT_PROFILE;
    }
    return JSON.parse(raw);
  }

  static updateProfile(profile: Partial<UserProfile>): UserProfile {
    const current = this.getProfile();
    const updated = { ...current, ...profile };
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(updated));
    return updated;
  }

  // Files
  static getTestFiles(): TestFile[] {
    const raw = localStorage.getItem(STORAGE_KEYS.FILES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.FILES, JSON.stringify(INITIAL_TEST_FILES));
      return INITIAL_TEST_FILES;
    }
    return JSON.parse(raw);
  }

  static saveTestFiles(files: TestFile[]): void {
    localStorage.setItem(STORAGE_KEYS.FILES, JSON.stringify(files));
  }

  static async addTestFile(name: string, content: string, fileType = 'Text Document'): Promise<TestFile> {
    const files = this.getTestFiles();
    const cleanName = name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const relativePath = `/app-data/test-workspace/${cleanName}`;
    const hash = await computeSha256(content);

    const newFile: TestFile = {
      id: `tf-${Date.now()}`,
      name: cleanName,
      relativePath,
      sizeBytes: new TextEncoder().encode(content).length,
      fileType,
      mimeType: 'text/plain',
      lastModified: new Date().toISOString(),
      sha256: hash,
      status: 'ACTIVE',
      previewText: content.slice(0, 200),
    };

    files.push(newFile);
    this.saveTestFiles(files);
    await this.logAuditEvent('TEST_FILE_CREATED', undefined, { fileName: cleanName, relativePath, sha256: hash });
    return newFile;
  }

  // Recovery Copies
  static getRecoveryCopies(): RecoveryCopyRecord[] {
    const raw = localStorage.getItem(STORAGE_KEYS.RECOVERY_COPIES);
    return raw ? JSON.parse(raw) : [];
  }

  static saveRecoveryCopies(copies: RecoveryCopyRecord[]): void {
    localStorage.setItem(STORAGE_KEYS.RECOVERY_COPIES, JSON.stringify(copies));
  }

  // Operations
  static getOperations(): OperationRecord[] {
    const raw = localStorage.getItem(STORAGE_KEYS.OPERATIONS);
    return raw ? JSON.parse(raw) : [];
  }

  static saveOperations(ops: OperationRecord[]): void {
    localStorage.setItem(STORAGE_KEYS.OPERATIONS, JSON.stringify(ops));
  }

  // Reports
  static getReports(): ReportRecord[] {
    const raw = localStorage.getItem(STORAGE_KEYS.REPORTS);
    return raw ? JSON.parse(raw) : [];
  }

  static saveReports(reports: ReportRecord[]): void {
    localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(reports));
  }

  // Candidates
  static getCandidates(): RecoveryCandidate[] {
    const raw = localStorage.getItem(STORAGE_KEYS.CANDIDATES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.CANDIDATES, JSON.stringify(INITIAL_CANDIDATES));
      return INITIAL_CANDIDATES;
    }
    return JSON.parse(raw);
  }

  static saveCandidates(cands: RecoveryCandidate[]): void {
    localStorage.setItem(STORAGE_KEYS.CANDIDATES, JSON.stringify(cands));
  }

  // Device
  static getDevice(): DeviceRecord {
    const raw = localStorage.getItem(STORAGE_KEYS.DEVICE);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.DEVICE, JSON.stringify(DEFAULT_DEVICE));
      return DEFAULT_DEVICE;
    }
    return JSON.parse(raw);
  }

  static updateDeviceLabel(label: string): DeviceRecord {
    const dev = this.getDevice();
    dev.label = label;
    dev.lastSeenAt = new Date().toISOString();
    localStorage.setItem(STORAGE_KEYS.DEVICE, JSON.stringify(dev));
    return dev;
  }

  // Controlled Append-Only Chained Audit Log
  static getAuditLog(): AuditLogEntry[] {
    const raw = localStorage.getItem(STORAGE_KEYS.AUDIT);
    return raw ? JSON.parse(raw) : [];
  }

  static async logAuditEvent(action: string, operationId?: string, safeDetails: Record<string, any> = {}): Promise<AuditLogEntry> {
    const log = this.getAuditLog();
    const lastEntry = log.length > 0 ? log[log.length - 1] : null;
    const previousHash = lastEntry ? lastEntry.entryHash : 'GENESIS';

    const canonicalDetails = toCanonicalJson(safeDetails);
    const rawPayload = `${previousHash}|${action}|${operationId || ''}|${canonicalDetails}`;
    const entryHash = await computeSha256(rawPayload);

    const newEntry: AuditLogEntry = {
      id: log.length + 1,
      userId: this.getProfile().id,
      action,
      operationId,
      previousHash,
      entryHash,
      createdAt: new Date().toISOString(),
      safeDetails,
    };

    log.push(newEntry);
    localStorage.setItem(STORAGE_KEYS.AUDIT, JSON.stringify(log));
    return newEntry;
  }

  // Cryptographic Chain Verifier
  static async verifyAuditChain(): Promise<{
    isValid: boolean;
    totalEntries: number;
    brokenEntryId?: number;
    errorReason?: string;
  }> {
    const log = this.getAuditLog();
    if (log.length === 0) {
      return { isValid: true, totalEntries: 0 };
    }

    let expectedPrev = 'GENESIS';
    for (const entry of log) {
      if (entry.previousHash !== expectedPrev) {
        return {
          isValid: false,
          totalEntries: log.length,
          brokenEntryId: entry.id,
          errorReason: `Entry #${entry.id} previous_hash (${entry.previousHash}) does not match previous entry's hash (${expectedPrev})`,
        };
      }

      const canonicalDetails = toCanonicalJson(entry.safeDetails);
      const rawPayload = `${entry.previousHash}|${entry.action}|${entry.operationId || ''}|${canonicalDetails}`;
      const recomputedHash = await computeSha256(rawPayload);

      if (recomputedHash !== entry.entryHash) {
        return {
          isValid: false,
          totalEntries: log.length,
          brokenEntryId: entry.id,
          errorReason: `Entry #${entry.id} calculated hash (${recomputedHash}) differs from stored entry_hash (${entry.entryHash})`,
        };
      }

      expectedPrev = entry.entryHash;
    }

    return { isValid: true, totalEntries: log.length };
  }

  // Execute Secure Deletion Simulation
  static async executeErasureSimulation(
    targetFiles: TestFile[],
    method: string,
    createRecoveryCopy: boolean
  ): Promise<{
    operation: OperationRecord;
    recoveryCopies: RecoveryCopyRecord[];
    report: ReportRecord;
  }> {
    const opId = `op-${Date.now()}`;
    const idempotencyKey = `idem-${opId}`;
    const preHashes: Record<string, string> = {};
    const postHashes: Record<string, string> = {};

    // 1. Calculate Pre-simulation hashes
    for (const tf of targetFiles) {
      preHashes[tf.name] = tf.sha256;
    }

    // 2. Audit: SIMULATION_INITIATED
    await this.logAuditEvent('SIMULATION_INITIATED', opId, {
      method,
      targets: targetFiles.map((t) => t.relativePath),
      createRecoveryCopy,
    });

    const newRecoveryCopies: RecoveryCopyRecord[] = [];
    const allCopies = this.getRecoveryCopies();

    // 3. Create Recovery Copy inside vault if requested
    if (createRecoveryCopy) {
      for (const tf of targetFiles) {
        const copyRecord: RecoveryCopyRecord = {
          id: `rc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          operationId: opId,
          originalFileName: tf.name,
          originalWorkspacePath: tf.relativePath,
          recoveryVaultPath: `/app-data/recovery-vault/${tf.name}.backup`,
          originalSha256: tf.sha256,
          createdAt: new Date().toISOString(),
          status: 'AVAILABLE',
        };
        newRecoveryCopies.push(copyRecord);
        allCopies.push(copyRecord);
      }
      this.saveRecoveryCopies(allCopies);
      await this.logAuditEvent('RECOVERY_COPY_CREATED', opId, {
        copiedFilesCount: newRecoveryCopies.length,
        vaultLocation: '/app-data/recovery-vault/',
      });
    }

    // 4. Simulate passes (read-only verification - file bytes are NOT modified)
    for (const tf of targetFiles) {
      // In simulation mode, bytes remain strictly identical!
      postHashes[tf.name] = tf.sha256;
    }

    // Check if hashes match
    let hashesMatch = true;
    for (const tf of targetFiles) {
      if (preHashes[tf.name] !== postHashes[tf.name]) {
        hashesMatch = false;
        break;
      }
    }

    const verificationStatus = hashesMatch ? 'SIMULATION_CHECK_PASSED' : 'SIMULATION_CHECK_FAILED';
    const verificationMessage = hashesMatch
      ? 'Simulation check passed. No file changes were detected. This is not physical erasure verification.'
      : 'Simulation check failed. A file change was detected. Review the details before doing anything else.';

    const opRecord: OperationRecord = {
      id: opId,
      userId: this.getProfile().id,
      operationType: 'ERASURE_SIMULATION',
      mode: 'SIMULATION_ONLY',
      targetReference: `${targetFiles.length} files in /app-data/test-workspace/`,
      method,
      executionStatus: 'SIMULATION_COMPLETED',
      verificationStatus,
      trackingState: createRecoveryCopy ? 'Recovery Copy Available' : 'Simulation Completed',
      idempotencyKey,
      targetCount: targetFiles.length,
      hasRecoveryCopy: createRecoveryCopy,
      recoveryCopyId: newRecoveryCopies.length > 0 ? newRecoveryCopies[0].id : undefined,
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      verificationMessage,
      preHashes,
      postHashes,
    };

    const ops = this.getOperations();
    ops.unshift(opRecord);
    this.saveOperations(ops);

    // 5. Generate Report with Report Idempotency Constraint
    const dev = this.getDevice();
    const reportJson = {
      operationType: 'Simulation',
      method,
      executionStatus: 'SIMULATION_COMPLETED',
      verificationStatus,
      targets: targetFiles.map((tf) => ({
        name: tf.name,
        size: tf.sizeBytes,
        sha256: tf.sha256,
        status: verificationStatus,
      })),
      simulationDisclaimer:
        'This is a simulation. No physical erasure was performed. The check confirms only that the simulated targets were not changed.',
      timestamp: new Date().toISOString(),
      deviceInfo: {
        appDeviceId: dev.appDeviceId,
        os: `${dev.osName} ${dev.osVersion}`,
        appVersion: dev.appVersion,
      },
    };

    const reportSha256 = await computeSha256(toCanonicalJson(reportJson));
    const reportRecord: ReportRecord = {
      id: `rep-${Date.now()}`,
      userId: this.getProfile().id,
      operationId: opId,
      idempotencyKey: `report-idem-${opId}`,
      reportStatus: 'COMPLETE',
      reportSha256,
      createdAt: new Date().toISOString(),
      reportJson,
    };

    const reports = this.getReports();
    reports.unshift(reportRecord);
    this.saveReports(reports);

    // 6. Audit: SIMULATION_COMPLETED
    await this.logAuditEvent('SIMULATION_COMPLETED', opId, {
      verificationStatus,
      reportSha256,
      targetCount: targetFiles.length,
    });

    return { operation: opRecord, recoveryCopies: newRecoveryCopies, report: reportRecord };
  }

  // Restore File from Controlled Recovery Copy
  static async restoreFileFromRecoveryCopy(copyId: string): Promise<{
    success: boolean;
    restoredPath: string;
    originalSha256: string;
    restoredSha256: string;
    isIntegrityVerified: boolean;
    copyRecord: RecoveryCopyRecord;
  }> {
    const allCopies = this.getRecoveryCopies();
    const copyIndex = allCopies.findIndex((c) => c.id === copyId);
    if (copyIndex === -1) {
      throw new Error(`Recovery copy ${copyId} not found`);
    }

    const copy = allCopies[copyIndex];
    const restoredOutputPath = `/app-data/restored-output/${copy.originalFileName}`;

    // Simulate file restoration and hash recalculation
    const restoredSha256 = copy.originalSha256; // Clean restoration yields exact bit-level match
    const isIntegrityVerified = restoredSha256 === copy.originalSha256;

    copy.status = isIntegrityVerified ? 'VERIFIED' : 'INTEGRITY_MISMATCH';
    copy.restoredOutputPath = restoredOutputPath;
    copy.restoredSha256 = restoredSha256;
    copy.restoredAt = new Date().toISOString();

    allCopies[copyIndex] = copy;
    this.saveRecoveryCopies(allCopies);

    // Update parent operation status if exists
    const ops = this.getOperations();
    const op = ops.find((o) => o.id === copy.operationId);
    if (op) {
      op.trackingState = isIntegrityVerified ? 'Verification Passed' : 'Verification Failed';
      this.saveOperations(ops);
    }

    await this.logAuditEvent('FILE_RESTORED_FROM_BACKUP', copy.operationId, {
      copyId,
      originalFile: copy.originalFileName,
      restoredOutputPath,
      sha256Match: isIntegrityVerified,
      disclaimer: 'Backup-based restoration demonstrated. This does not prove recovery of data after genuine physical erasure.',
    });

    return {
      success: true,
      restoredPath: restoredOutputPath,
      originalSha256: copy.originalSha256,
      restoredSha256,
      isIntegrityVerified,
      copyRecord: copy,
    };
  }

  // Recover Candidate File (Phase 2 Forensic Carving)
  static async recoverCandidate(candidateId: string): Promise<RecoveryCandidate> {
    const candidates = this.getCandidates();
    const idx = candidates.findIndex((c) => c.id === candidateId);
    if (idx === -1) {
      throw new Error('Candidate not found');
    }

    const cand = candidates[idx];
    const extension = cand.fileType.toLowerCase();
    const recoveredPath = `/app-data/recovered/carved_${cand.fileType.toLowerCase()}_0x${cand.byteOffset.toString(16)}.${extension}`;

    cand.state = 'RECOVERED';
    cand.confidenceComponents.reparsePassed = true;
    cand.confidence = 100;
    cand.recoveredPath = recoveredPath;

    candidates[idx] = cand;
    this.saveCandidates(candidates);

    await this.logAuditEvent('FORENSIC_CANDIDATE_RECOVERED', undefined, {
      candidateId: cand.id,
      fileType: cand.fileType,
      byteOffset: cand.byteOffset,
      confidence: 100,
      recoveredPath,
    });

    return cand;
  }

  // Clear or seed initial demonstration data if empty
  static initializeDemoData(): void {
    if (this.getOperations().length === 0) {
      // Seed a realistic completed demonstration simulation
      const sampleFile = INITIAL_TEST_FILES[0];
      this.executeErasureSimulation([sampleFile], 'NIST 800-88 Rev. 1 Clear (Simulated)', true);
    }
  }
}
