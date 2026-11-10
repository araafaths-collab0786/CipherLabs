/**
 * Cipher Labs - Core Domain Types
 * SECURE. RECOVER. VERIFY.
 */

export type OperationType = 'ERASURE_SIMULATION' | 'RECOVERY_TEST';

export type OperationMode = 'SIMULATION_ONLY' | 'TEST_IMAGE';

export type ExecutionStatus =
  | 'SIMULATION_COMPLETED'
  | 'RECOVERY_COMPLETED'
  | 'EXECUTION_FAILED'
  | 'PARTIALLY_COMPLETED'
  | 'CANCELLED'
  | 'INTERRUPTED'
  | 'RUNNING';

export type VerificationStatus =
  | 'SIMULATION_CHECK_PASSED'
  | 'SIMULATION_CHECK_FAILED'
  | 'VERIFIED'
  | 'VERIFICATION_FAILED'
  | 'UNVERIFIED'
  | 'NOT_APPLICABLE';

export type OperationTrackingState =
  | 'Ready'
  | 'Awaiting Confirmation'
  | 'Simulation in Progress'
  | 'Simulation Completed'
  | 'Recovery Copy Available'
  | 'Recovery in Progress'
  | 'Recovery Completed'
  | 'Verification Passed'
  | 'Verification Failed'
  | 'Operation Interrupted';

export interface TestFile {
  id: string;
  name: string;
  relativePath: string;
  sizeBytes: number;
  fileType: string;
  mimeType: string;
  lastModified: string;
  sha256: string;
  status: 'ACTIVE' | 'SIMULATED' | 'PROTECTED' | 'RESTORED';
  previewText?: string;
  dataUrl?: string;
  isUserDeviceFile?: boolean;
}

export interface RecoveryCopyRecord {
  id: string;
  operationId: string;
  originalFileName: string;
  originalWorkspacePath: string;
  recoveryVaultPath: string;
  restoredOutputPath?: string;
  originalSha256: string;
  restoredSha256?: string;
  createdAt: string;
  restoredAt?: string;
  status: 'AVAILABLE' | 'RESTORED' | 'VERIFIED' | 'INTEGRITY_MISMATCH';
  dataUrl?: string;
  fileContent?: string;
  sizeBytes?: number;
  mimeType?: string;
  source?: 'device' | 'workspace';
}

export interface RecoveryCandidate {
  id: string;
  scanId: string;
  fileType: 'JPEG' | 'PNG' | 'PDF' | 'ZIP' | 'GIF';
  byteOffset: number;
  estimatedSizeBytes: number;
  state: 'DETECTED' | 'VALIDATED' | 'RECOVERED' | 'VALIDATION_FAILED' | 'WRITE_FAILED' | 'PARTIAL';
  confidence: number; // 0 to 100
  confidenceComponents: {
    headerFound: boolean; // +30
    footerFound: boolean; // +30
    structureChecksPassed: boolean; // +30
    reparsePassed: boolean; // +10
  };
  classifierLabel: string;
  validationChecks: {
    signatureHeader: string;
    signatureFooter: string;
    internalCrcMatch: boolean;
    streamContinuity: boolean;
  };
  sha256?: string;
  hexPreview: string[];
  recoveredPath?: string;
}

export interface OperationRecord {
  id: string;
  userId: string;
  operationType: OperationType;
  mode: OperationMode;
  targetReference: string;
  method: string;
  executionStatus: ExecutionStatus;
  verificationStatus: VerificationStatus;
  trackingState: OperationTrackingState;
  idempotencyKey: string;
  targetCount: number;
  hasRecoveryCopy: boolean;
  recoveryCopyId?: string;
  createdAt: string;
  completedAt?: string;
  verificationMessage: string;
  preHashes: Record<string, string>;
  postHashes: Record<string, string>;
  userVerified?: boolean;
  verifiedBy?: string;
  userVerifiedAt?: string;
  userConfirmationSignature?: string;
  malwareScanStatus?: 'NOT_SCANNED' | 'SCANNING' | 'CLEAN' | 'THREAT_DETECTED';
  malwareScanCompletedAt?: string;
  malwareScanDetails?: {
    threatsFound: number;
    heuristicScore: number;
    scannedSignaturesCount: number;
    entropyCheck: string;
    statusMessage: string;
  };
  finalReportId?: string;
  finalReportGeneratedAt?: string;
  totalBytesProcessed?: number;
  successfulCount?: number;
  failedCount?: number;
}

export interface AuditLogEntry {
  id: number;
  userId: string;
  action: string;
  operationId?: string;
  previousHash: string;
  entryHash: string;
  createdAt: string;
  safeDetails: Record<string, any>;
}

export interface ReportRecord {
  id: string;
  userId: string;
  operationId: string;
  idempotencyKey: string;
  reportStatus: 'COMPLETE' | 'INCOMPLETE';
  reportSha256: string;
  createdAt: string;
  reportJson: {
    operationType: string;
    method: string;
    executionStatus: string;
    verificationStatus: string;
    targets: Array<{ name: string; size: number; sha256: string; status: string; savedToRecovery?: boolean }>;
    simulationDisclaimer: string;
    timestamp: string;
    deviceInfo: { appDeviceId: string; os: string; appVersion: string };
    title?: string;
    reportType?: string;
    operationId?: string;
    userVerification?: {
      verifiedByUser: boolean;
      verifiedBy: string;
      verifiedAt: string;
      signature: string;
      statement: string;
    };
    malwareSafetyScan?: {
      status: string;
      scannedAt: string;
      threatsFound: number;
      heuristicScore: number;
      entropyCheck: string;
      result: string;
    };
    cryptographicIntegrity?: string;
    operator?: { name: string; email: string; phone?: string };
    complianceAudit?: string;
    generatedAt?: string;
  };
}

export interface DeviceRecord {
  id: string;
  userId: string;
  appDeviceId: string;
  label: string;
  osName: string;
  osVersion: string;
  appVersion: string;
  lastSeenAt: string;
}

export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  preferences: {
    theme: 'light' | 'dark';
    keepLogsDays: 30 | 90 | 365;
    exportRequestedAt?: string;
  };
}
