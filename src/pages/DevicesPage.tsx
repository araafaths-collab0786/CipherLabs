/**
 * Cipher Labs - Devices Page (PART 3 & PART 5.3 Specification)
 * Registered devices, strictly no hardware fingerprints, "What is stored" vs "What is not collected".
 */

import React, { useState } from 'react';
import {
  Laptop,
  ShieldCheck,
  ShieldAlert,
  Edit2,
  Check,
  X,
  HardDrive,
  Cpu,
  Fingerprint,
  Wifi,
} from 'lucide-react';
import { DeviceRecord } from '../types';
import { StorageService } from '../services/storage';

interface DevicesPageProps {
  isDark: boolean;
  device: DeviceRecord;
  onRefreshDevice: () => void;
}

export const DevicesPage: React.FC<DevicesPageProps> = ({
  isDark,
  device,
  onRefreshDevice,
}) => {
  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const [newLabel, setNewLabel] = useState(device.label);

  const handleSaveLabel = () => {
    if (!newLabel.trim()) return;
    StorageService.updateDeviceLabel(newLabel.trim());
    onRefreshDevice();
    setIsEditingLabel(false);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Registered Devices</h1>
        <p className="text-sm text-slate-400 mt-0.5">
          Authorized workstations registered for forensic sanitization and audit integrity.
        </p>
      </div>

      {/* Device Card */}
      <div
        className={`p-6 rounded-2xl border shadow-sm ${
          isDark ? 'bg-[#122A4D] border-[#1E3A5F]' : 'bg-white border-slate-200'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-inherit">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center">
              <Laptop className="w-6 h-6 stroke-[2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                {isEditingLabel ? (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={newLabel}
                      onChange={(e) => setNewLabel(e.target.value)}
                      className="px-2 py-1 text-sm font-bold rounded border bg-slate-900 border-slate-700 text-white outline-none"
                    />
                    <button
                      onClick={handleSaveLabel}
                      className="p-1 rounded bg-emerald-600 text-white hover:bg-emerald-700"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setIsEditingLabel(false)}
                      className="p-1 rounded bg-slate-700 text-slate-300 hover:bg-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <>
                    <h3 className="font-bold text-base text-slate-100">{device.label}</h3>
                    <button
                      onClick={() => setIsEditingLabel(true)}
                      className="p-1 text-slate-400 hover:text-cyan-400"
                      title="Rename Device Label"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Active This Host
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                App Device UUID: {device.appDeviceId}
              </p>
            </div>
          </div>
        </div>

        {/* Device Technical Metadata */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-5 text-xs font-mono">
          <div className="p-3 rounded-lg bg-slate-900/40 border border-slate-800">
            <span className="text-[10px] uppercase text-slate-500 block">OPERATING SYSTEM</span>
            <span className="font-bold text-slate-200 mt-1 block">
              {device.osName} {device.osVersion}
            </span>
          </div>

          <div className="p-3 rounded-lg bg-slate-900/40 border border-slate-800">
            <span className="text-[10px] uppercase text-slate-500 block">CIPHER LABS VERSION</span>
            <span className="font-bold text-cyan-400 mt-1 block">v{device.appVersion} (FastAPI Sidecar)</span>
          </div>

          <div className="p-3 rounded-lg bg-slate-900/40 border border-slate-800">
            <span className="text-[10px] uppercase text-slate-500 block">LAST AUDIT TELEMETRY</span>
            <span className="font-bold text-slate-200 mt-1 block">
              {new Date(device.lastSeenAt).toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Two Security Specification Cards (PART 3 & 5.3) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card 1: What is stored */}
        <div
          className={`p-6 rounded-2xl border space-y-3 ${
            isDark ? 'bg-[#122A4D] border-[#1E3A5F]' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center space-x-2 text-cyan-400">
            <ShieldCheck className="w-5 h-5" />
            <h3 className="font-bold text-sm uppercase tracking-wider">What is stored</h3>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Per strict zero-hardware privacy architecture, Cipher Labs registers only:
          </p>
          <ul className="text-xs text-slate-300 space-y-1.5 list-disc pl-4">
            <li>
              <strong>App-generated Device ID:</strong> A random UUID created on first run and stored
              in local application data.
            </li>
            <li>
              <strong>User Label:</strong> Custom workstation name for audit reporting.
            </li>
            <li>
              <strong>OS Name & Version:</strong> For sanitization standard compatibility reports.
            </li>
            <li>
              <strong>Cipher Labs App Version:</strong> Engine release tracking.
            </li>
            <li>
              <strong>Last Operation Time:</strong> Security heartbeat timestamp.
            </li>
          </ul>
        </div>

        {/* Card 2: What is NOT collected */}
        <div
          className={`p-6 rounded-2xl border space-y-3 ${
            isDark ? 'bg-[#122A4D] border-[#1E3A5F]' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center space-x-2 text-emerald-400">
            <Fingerprint className="w-5 h-5" />
            <h3 className="font-bold text-sm uppercase tracking-wider">What is not collected</h3>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Hardware fingerprinting is strictly forbidden in Cipher Labs specifications:
          </p>
          <ul className="text-xs text-slate-300 space-y-1.5 list-disc pl-4">
            <li>
              <span className="text-red-400 font-semibold">NO</span> CPU model, architecture IDs, or processor serials.
            </li>
            <li>
              <span className="text-red-400 font-semibold">NO</span> GPU information or display adapter details.
            </li>
            <li>
              <span className="text-red-400 font-semibold">NO</span> Motherboard or BIOS serial numbers.
            </li>
            <li>
              <span className="text-red-400 font-semibold">NO</span> MAC addresses or network adapter identifiers.
            </li>
            <li>
              <span className="text-red-400 font-semibold">NO</span> Physical disk serials or hardware volume fingerprints.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
