/**
 * Cipher Labs - Browse Files Modal (Controlled Workspace Only)
 * Secure Deletion and Recovery Workflow Component
 */

import React, { useState } from 'react';
import {
  Folder,
  FileText,
  ShieldAlert,
  Plus,
  CheckCircle,
  Copy,
  Hash,
  X,
  FileSpreadsheet,
  FileCode,
  FileCheck,
} from 'lucide-react';
import { TestFile } from '../types';
import { StorageService } from '../services/storage';

interface BrowseFilesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectFiles: (selectedFiles: TestFile[]) => void;
  initiallySelectedIds?: string[];
  isDark: boolean;
}

export const BrowseFilesModal: React.FC<BrowseFilesModalProps> = ({
  isOpen,
  onClose,
  onSelectFiles,
  initiallySelectedIds = [],
  isDark,
}) => {
  const [files, setFiles] = useState<TestFile[]>(() => StorageService.getTestFiles());
  const [selectedIds, setSelectedIds] = useState<string[]>(initiallySelectedIds);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [newFileContent, setNewFileContent] = useState('');
  const [newFileType, setNewFileType] = useState('Confidential Memo (.txt)');
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  if (!isOpen) return null;

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleCreateSample = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileName.trim()) return;

    const file = await StorageService.addTestFile(
      newFileName.trim(),
      newFileContent || 'Default synthetic test data for cryptographic verification.',
      newFileType
    );

    setFiles(StorageService.getTestFiles());
    setSelectedIds((prev) => [...prev, file.id]);
    setNewFileName('');
    setNewFileContent('');
    setShowCreateForm(false);
  };

  const handleConfirmSelection = () => {
    const selected = files.filter((f) => selectedIds.includes(f.id));
    onSelectFiles(selected);
    onClose();
  };

  const handleCopyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getFileIcon = (mime: string) => {
    if (mime.includes('pdf')) return <FileText className="w-5 h-5 text-red-500" />;
    if (mime.includes('sql') || mime.includes('csv'))
      return <FileSpreadsheet className="w-5 h-5 text-emerald-500" />;
    if (mime.includes('plain')) return <FileCode className="w-5 h-5 text-amber-500" />;
    return <FileCheck className="w-5 h-5 text-cyan-500" />;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className={`w-full max-w-4xl max-h-[85vh] rounded-2xl shadow-2xl flex flex-col border overflow-hidden ${
          isDark
            ? 'bg-[#0B1F3A] border-[#1E3A5F] text-slate-100'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-inherit flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-500">
              <Folder className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Browse Test Files</h3>
              <p className="text-xs text-slate-400">
                Controlled sandbox path:{' '}
                <span className="font-mono text-cyan-500">/app-data/test-workspace/</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Strict Sandbox Boundary Alert */}
        <div className="px-5 py-3 bg-amber-500/10 border-b border-amber-500/20 flex items-center gap-3 text-xs text-amber-600 dark:text-amber-400">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>
            <strong>Sandbox Safety Enforced:</strong> Phase 1 permits operations exclusively on
            synthetic files within the application's controlled workspace. Access to physical drives
            or user personal directories is strictly blocked by design.
          </span>
        </div>

        {/* Modal Body */}
        <div className="flex-1 p-5 overflow-y-auto space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Available Test Files ({files.length})
            </span>
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-cyan-500/10 text-cyan-500 hover:bg-cyan-500/20 border border-cyan-500/30 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              {showCreateForm ? 'Cancel Creation' : 'Generate Test File'}
            </button>
          </div>

          {/* New Test File Generator Form */}
          {showCreateForm && (
            <form
              onSubmit={handleCreateSample}
              className={`p-4 rounded-xl border space-y-3 ${
                isDark ? 'bg-[#122A4D]/60 border-[#1E3A5F]' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                Create Isolated Sample in Workspace
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">File Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. audit_trial_log_2026.txt"
                    value={newFileName}
                    onChange={(e) => setNewFileName(e.target.value)}
                    className={`w-full px-3 py-1.5 text-xs rounded-lg border outline-none font-mono ${
                      isDark
                        ? 'bg-[#0B1F3A] border-[#1E3A5F] text-white focus:border-cyan-500'
                        : 'bg-white border-slate-300 text-slate-900 focus:border-cyan-600'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">File Category</label>
                  <select
                    value={newFileType}
                    onChange={(e) => setNewFileType(e.target.value)}
                    className={`w-full px-3 py-1.5 text-xs rounded-lg border outline-none ${
                      isDark
                        ? 'bg-[#0B1F3A] border-[#1E3A5F] text-white focus:border-cyan-500'
                        : 'bg-white border-slate-300 text-slate-900 focus:border-cyan-600'
                    }`}
                  >
                    <option value="Confidential Document (.txt)">Confidential Document (.txt)</option>
                    <option value="Database Export (.sql)">Database Export (.sql)</option>
                    <option value="Encrypted Ledger (.dat)">Encrypted Ledger (.dat)</option>
                    <option value="Healthcare Record (.csv)">Healthcare Record (.csv)</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Synthetic Byte Content</label>
                <textarea
                  rows={2}
                  placeholder="Enter sample text payload to be cryptographically hashed..."
                  value={newFileContent}
                  onChange={(e) => setNewFileContent(e.target.value)}
                  className={`w-full px-3 py-1.5 text-xs rounded-lg border outline-none font-mono ${
                    isDark
                      ? 'bg-[#0B1F3A] border-[#1E3A5F] text-white focus:border-cyan-500'
                      : 'bg-white border-slate-300 text-slate-900 focus:border-cyan-600'
                  }`}
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-600 text-white text-xs font-semibold"
                >
                  Write to Sandbox
                </button>
              </div>
            </form>
          )}

          {/* Files Grid / List */}
          <div className="space-y-2">
            {files.map((file) => {
              const isSelected = selectedIds.includes(file.id);
              return (
                <div
                  key={file.id}
                  onClick={() => toggleSelect(file.id)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                    isSelected
                      ? isDark
                        ? 'bg-[#123A55] border-cyan-500/50 shadow-sm'
                        : 'bg-cyan-50/70 border-cyan-400 shadow-sm'
                      : isDark
                      ? 'bg-[#122A4D]/40 border-[#1E3A5F] hover:bg-[#122A4D]'
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div
                      className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 ${
                        isSelected
                          ? 'bg-cyan-500 border-cyan-500 text-white'
                          : isDark
                          ? 'border-slate-600'
                          : 'border-slate-300'
                      }`}
                    >
                      {isSelected && <CheckCircle className="w-3.5 h-3.5" />}
                    </div>

                    <div className="shrink-0">{getFileIcon(file.mimeType)}</div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm truncate">{file.name}</span>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                            isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {file.fileType}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5 font-mono">
                        <span>{formatBytes(file.sizeBytes)}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Hash className="w-3 h-3 text-slate-500" />
                          {file.sha256.substring(0, 14)}...
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyHash(file.sha256);
                      }}
                      title="Copy Full SHA-256 Hash"
                      className="p-1.5 rounded text-slate-400 hover:text-cyan-400 hover:bg-slate-800/40 text-xs flex items-center gap-1 font-mono"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      {copiedHash === file.sha256 ? 'Copied!' : 'Copy Hash'}
                    </button>
                    <span className="px-2 py-0.5 text-[11px] font-medium rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                      {file.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-inherit flex items-center justify-between">
          <div className="text-xs text-slate-400">
            Selected: <span className="font-bold text-cyan-400">{selectedIds.length}</span> file
            {selectedIds.length === 1 ? '' : 's'} for operation
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className={`px-4 py-2 rounded-lg text-xs font-medium border ${
                isDark
                  ? 'border-slate-700 hover:bg-slate-800 text-slate-300'
                  : 'border-slate-300 hover:bg-slate-100 text-slate-700'
              }`}
            >
              Cancel
            </button>
            <button
              disabled={selectedIds.length === 0}
              onClick={handleConfirmSelection}
              className={`px-5 py-2 rounded-lg text-xs font-semibold text-white shadow-md transition-all ${
                selectedIds.length === 0
                  ? 'bg-slate-600 opacity-50 cursor-not-allowed'
                  : 'bg-[#06B6D4] hover:bg-[#0891B2] active:scale-[0.98]'
              }`}
            >
              Select for Deletion Simulation
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
