import React, { useEffect, useState } from 'react';
import {
  ShieldCheck,
  HardDrive,
  Lock,
  Download,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  FolderLock,
  FileCheck
} from 'lucide-react';
import { api } from '../services/api';
import { StorageOverview, OperationLog } from '../types';

function formatBytes(bytes?: number): string {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export const GuardianPage: React.FC = () => {
  const [overview, setOverview] = useState<StorageOverview | null>(null);
  const [logs, setAuditLogs] = useState<OperationLog[]>([]);
  const [backups, setBackups] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [storageData, auditData, backupData] = await Promise.all([
        api.getStorageOverview(),
        api.getAuditLogs(),
        api.getBackups()
      ]);
      setOverview(storageData);
      setAuditLogs(auditData);
      setBackups(backupData);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="h-full overflow-y-auto bg-[#F8FAFC] p-6 lg:p-8 space-y-8 select-none text-[#1E293B]">
      {/* Header Banner */}
      <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-2xl p-6 lg:p-8 flex items-center justify-between shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Active File Boundary Protection
            </span>
          </div>
          <h1 className="text-2xl font-bold text-[#1E293B] tracking-tight flex items-center gap-2.5">
            <ShieldCheck className="w-7 h-7 text-emerald-600" />
            Storage Guardian
          </h1>
          <p className="text-xs text-[#64748B] mt-1 max-w-2xl leading-relaxed">
            Storage Guardian ensures that user code and Docker containers can never access, read, or delete
            your personal Windows directories, Documents, Desktop, or Downloads.
          </p>
        </div>

        <div className="hidden sm:block p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-right shadow-2xs">
          <span className="text-xs text-emerald-700 font-semibold block">Total Managed Storage</span>
          <span className="text-xl font-bold text-[#1E293B] font-mono">{formatBytes(overview?.totalSizeBytes)}</span>
        </div>
      </div>

      {/* Storage Breakdown Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-[#FFFFFF] p-3.5 rounded-xl border border-[#E2E8F0] shadow-xs">
          <span className="text-[11px] text-[#64748B] block">Projects</span>
          <span className="text-sm font-bold text-blue-600 font-mono mt-1 block">
            {formatBytes(overview?.breakdown.projectsBytes)}
          </span>
        </div>
        <div className="bg-[#FFFFFF] p-3.5 rounded-xl border border-[#E2E8F0] shadow-xs">
          <span className="text-[11px] text-[#64748B] block">Local Models</span>
          <span className="text-sm font-bold text-purple-600 font-mono mt-1 block">
            {formatBytes(overview?.breakdown.modelsBytes)}
          </span>
        </div>
        <div className="bg-[#FFFFFF] p-3.5 rounded-xl border border-[#E2E8F0] shadow-xs">
          <span className="text-[11px] text-[#64748B] block">Database (SQLite)</span>
          <span className="text-sm font-bold text-emerald-700 font-mono mt-1 block">
            {formatBytes(overview?.breakdown.databaseBytes)}
          </span>
        </div>
        <div className="bg-[#FFFFFF] p-3.5 rounded-xl border border-[#E2E8F0] shadow-xs">
          <span className="text-[11px] text-[#64748B] block">Backups</span>
          <span className="text-sm font-bold text-amber-600 font-mono mt-1 block">
            {formatBytes(overview?.breakdown.backupsBytes)}
          </span>
        </div>
        <div className="bg-[#FFFFFF] p-3.5 rounded-xl border border-[#E2E8F0] shadow-xs">
          <span className="text-[11px] text-[#64748B] block">Audit Logs</span>
          <span className="text-sm font-bold text-slate-700 font-mono mt-1 block">
            {formatBytes(overview?.breakdown.logsBytes)}
          </span>
        </div>
        <div className="bg-[#FFFFFF] p-3.5 rounded-xl border border-[#E2E8F0] shadow-xs">
          <span className="text-[11px] text-[#64748B] block">Cache</span>
          <span className="text-sm font-bold text-slate-500 font-mono mt-1 block">
            {formatBytes(overview?.breakdown.cacheBytes)}
          </span>
        </div>
      </div>

      {/* Security Boundaries Enforcement */}
      <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-2xl p-6 shadow-xs">
        <h2 className="text-sm font-bold text-[#1E293B] uppercase tracking-wider mb-4 flex items-center gap-2">
          <Lock className="w-4 h-4 text-emerald-600" />
          <span>Strict Security Rules & Protected Host Paths</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              <FolderLock className="w-4 h-4 text-red-600" />
              Forbidden Host Mounts & Access
            </h3>
            <p className="text-[#64748B] text-[11px]">
              The backend completely rejects any attempt to mount or read paths outside the project workspace:
            </p>
            <ul className="space-y-1 font-mono text-[11px] text-slate-700 list-disc list-inside">
              <li>C:\Users\&lt;username&gt; (Windows User Profile)</li>
              <li>Documents, Desktop, Downloads, Pictures</li>
              <li>Entire physical drives (C:\, D:\)</li>
              <li>Root CloudBaseIDE directory</li>
            </ul>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-blue-600" />
              Active Traversal & Zip-Slip Protection
            </h3>
            <p className="text-[#64748B] text-[11px]">
              Every path and archive entry is verified using canonical native path resolution before reading or extraction:
            </p>
            <ul className="space-y-1 font-mono text-[11px] text-slate-700 list-disc list-inside">
              <li>Blocks ../ and ..\ relative escape sequences</li>
              <li>Validates symlink real paths against jail boundary</li>
              <li>Zip-Slip archive entry sanitization</li>
              <li>Immutable audit log for all disk mutations</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Backup Archives */}
      <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-2xl p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-[#1E293B] uppercase tracking-wider flex items-center gap-2">
            <Download className="w-4 h-4 text-blue-600" />
            <span>Available Project Backups</span>
          </h2>
          <span className="text-xs text-[#64748B] font-mono">{backups.length} Archives</span>
        </div>

        {backups.length === 0 ? (
          <p className="text-xs text-[#64748B]">No project backups have been created yet. You can create a backup from the dashboard.</p>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {backups.map((b) => (
              <div key={b.filename} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <span className="font-mono text-[#1E293B] font-semibold">{b.filename}</span>
                  <span className="text-[#64748B] text-[11px] block mt-0.5">
                    {formatBytes(b.sizeBytes)} • {new Date(b.createdAt).toLocaleString()}
                  </span>
                </div>
                <span className="text-[11px] text-emerald-700 px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 font-medium">
                  Verified Safe Zip
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Audit Logs Table */}
      <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-2xl p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-[#1E293B] uppercase tracking-wider flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Storage Guardian Audit Trail</span>
          </h2>
          <span className="text-xs text-[#64748B] font-mono">Recent Operations</span>
        </div>

        <div className="overflow-x-auto max-h-72">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-[#E2E8F0] text-[#64748B] font-mono">
                <th className="py-2 px-3">Timestamp</th>
                <th className="py-2 px-3">Project</th>
                <th className="py-2 px-3">Operation</th>
                <th className="py-2 px-3">Status</th>
                <th className="py-2 px-3">Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.slice(0, 30).map((l) => (
                <tr key={l.id} className="border-b border-slate-100 text-[#334155] hover:bg-slate-50">
                  <td className="py-2 px-3 text-[#64748B] font-mono">{new Date(l.timestamp).toLocaleTimeString()}</td>
                  <td className="py-2 px-3 font-mono text-blue-600">{l.project_id || 'system'}</td>
                  <td className="py-2 px-3 font-semibold">{l.operation}</td>
                  <td className="py-2 px-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                      l.status === 'SUCCESS' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      {l.status}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-[#64748B] truncate max-w-sm">{l.details || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
