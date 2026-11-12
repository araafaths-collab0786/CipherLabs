import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { StorageService } from './storage';

function loadReportsFromStorage(value: unknown[]): { reports: ReturnType<typeof StorageService.getReports>; writes: string[] } {
  const previousStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  const savedValues = new Map([['cipherlabs_reports', JSON.stringify(value)]]);
  const writes: string[] = [];

  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (key: string) => savedValues.get(key) ?? null,
      setItem: (key: string, storedValue: string) => {
        writes.push(key);
        savedValues.set(key, storedValue);
      },
    },
  });

  try {
    return { reports: StorageService.getReports(), writes };
  } finally {
    if (previousStorage) {
      Object.defineProperty(globalThis, 'localStorage', previousStorage);
    } else {
      Reflect.deleteProperty(globalThis, 'localStorage');
    }
  }
}

test('loads incomplete saved reports with safe display defaults without rewriting stored data', () => {
  const { reports, writes } = loadReportsFromStorage([{ id: 'legacy-report' }]);

  assert.equal(reports.length, 1);
  assert.equal(reports[0].reportStatus, 'INCOMPLETE');
  assert.match(reports[0].reportJson.simulationDisclaimer, /details are incomplete/i);
  assert.deepEqual(reports[0].reportJson.targets, []);
  assert.equal(reports[0].reportJson.deviceInfo.appDeviceId, 'Unavailable');
  assert.deepEqual(writes, []);
});

test('normalizes snake_case saved report fields and keeps its target and device metadata', () => {
  const { reports } = loadReportsFromStorage([
    {
      id: 'report-1',
      report_status: 'COMPLETE',
      report_json: {
        operation_type: 'Secure Erasure',
        execution_status: 'COMPLETE',
        verification_status: 'VERIFIED',
        simulation_disclaimer: 'Existing report disclaimer',
        device_info: { app_device_id: 'device-1', os_name: 'Windows', app_version: '1.2.3' },
        targets: [{ name: 'sample.txt', size_bytes: 12, sha256: 'abc', verification_status: 'VERIFIED' }],
      },
    },
  ]);

  assert.equal(reports[0].reportJson.operationType, 'Secure Erasure');
  assert.equal(reports[0].reportJson.simulationDisclaimer, 'Existing report disclaimer');
  assert.equal(reports[0].reportJson.deviceInfo.appDeviceId, 'device-1');
  assert.deepEqual(reports[0].reportJson.targets[0], {
    name: 'sample.txt',
    size: 12,
    sha256: 'abc',
    status: 'VERIFIED',
  });
});
