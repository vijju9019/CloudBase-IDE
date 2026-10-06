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
    <div className="h-full overflow-y-auto bg-[#F8FAFC] dark:bg-[#0B0F19] p-6 lg:p-8 space-y-8 select-none text-[#1E293B] dark:text-[#F8FAFC] transition-colors">
      {/* Header Banner */}
      <div className="bg-[#FFFFFF] dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] rounded-2xl p-6 lg:p-8 flex items-center justify-between shadow-xs transition-colors">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Active File Boundary Protection
            </span>
          </div>
          <h1 className="text-2xl font-bold text-[#1E293B] dark:text-white tracking-tight flex items-center gap-2.5">
            <ShieldCheck className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
            Storage Guardian
          </h1>
          <p className="text-xs text-[#64748B] dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Storage Guardian ensures that user code and Docker containers can never access, read, or delete
            your personal Windows directories, Documents, Desktop, or Downloads.
          </p>
        </div>

        <div className="hidden sm:block p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-right shadow-2xs">
          <span className="text-xs text-emerald-700 dark:text-emerald-300 font-semibold block">Total Managed Storage</span>
          <span className="text-xl font-bold text-[#1E293B] dark:text-white font-mono">{formatBytes(overview?.totalSizeBytes)}</span>
        </div>
      </div>

      {/* Storage Breakdown Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-[#FFFFFF] dark:bg-[#1E293B] p-3.5 rounded-xl border border-[#E2E8F0] dark:border-[#334155] shadow-xs">
          <span className="text-[11px] text-[#64748B] dark:text-slate-400 block">Projects</span>
          <span className="text-sm font-bold text-blue-600 dark:text-blue-400 font-mono mt-1 block">
            {formatBytes(overview?.breakdown.projectsBytes)}
          </span>
        </div>
        <div className="bg-[#FFFFFF] dark:bg-[#1E293B] p-3.5 rounded-xl border border-[#E2E8F0] dark:border-[#334155] shadow-xs">
          <span className="text-[11px] text-[#64748B] dark:text-slate-400 block">Local Models</span>
          <span className="text-sm font-bold text-purple-600 dark:text-purple-400 font-mono mt-1 block">
            {formatBytes(overview?.breakdown.modelsBytes)}
          </span>
        </div>
        <div className="bg-[#FFFFFF] dark:bg-[#1E293B] p-3.5 rounded-xl border border-[#E2E8F0] dark:border-[#334155] shadow-xs">
          <span className="text-[11px] text-[#64748B] dark:text-slate-400 block">Database (SQLite)</span>
          <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400 font-mono mt-1 block">
            {formatBytes(overview?.breakdown.databaseBytes)}
          </span>
        </div>
        <div className="bg-[#FFFFFF] dark:bg-[#1E293B] p-3.5 rounded-xl border border-[#E2E8F0] dark:border-[#334155] shadow-xs">
          <span className="text-[11px] text-[#64748B] dark:text-slate-400 block">Backups</span>
          <span className="text-sm font-bold text-amber-600 dark:text-amber-400 font-mono mt-1 block">
            {formatBytes(overview?.breakdown.backupsBytes)}
          </span>
        </div>
        <div className="bg-[#FFFFFF] dark:bg-[#1E293B] p-3.5 rounded-xl border border-[#E2E8F0] dark:border-[#334155] shadow-xs">
          <span className="text-[11px] text-[#64748B] dark:text-slate-400 block">Audit Logs</span>
          <span className="text-sm font-bold text-slate-700 dark:text-slate-300 font-mono mt-1 block">
            {formatBytes(overview?.breakdown.logsBytes)}
          </span>
        </div>
        <div className="bg-[#FFFFFF] dark:bg-[#1E293B] p-3.5 rounded-xl border border-[#E2E8F0] dark:border-[#334155] shadow-xs">
          <span className="text-[11px] text-[#64748B] dark:text-slate-400 block">Cache</span>
          <span className="text-sm font-bold text-slate-500 dark:text-slate-400 font-mono mt-1 block">
            {formatBytes(overview?.breakdown.cacheBytes)}
          </span>
        </div>
      </div>

      {/* Security Boundaries Enforcement */}
      <div className="bg-[#FFFFFF] dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] rounded-2xl p-6 shadow-xs transition-colors">
        <h2 className="text-sm font-bold text-[#1E293B] dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
          <Lock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>Strict Security Rules & Protected Host Paths</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="bg-slate-50 dark:bg-[#0F172A] p-4 rounded-xl border border-slate-200 dark:border-[#334155] space-y-2">
            <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <FolderLock className="w-4 h-4 text-red-600 dark:text-red-400" />
              Forbidden Host Mounts & Access
            </h3>
            <p className="text-[#64748B] dark:text-slate-400 text-[11px]">
              The backend completely rejects any attempt to mount or read paths outside the project workspace:
            </p>
            <ul className="space-y-1 font-mono text-[11px] text-slate-700 dark:text-slate-300 list-disc list-inside">
              <li>C:\Users\&lt;username&gt; (Windows User Profile)</li>
              <li>Documents, Desktop, Downloads, Pictures</li>
              <li>Entire physical drives (C:\, D:\)</li>
              <li>Root CloudBaseIDE directory</li>
            </ul>
          </div>

          <div className="bg-slate-50 dark:bg-[#0F172A] p-4 rounded-xl border border-slate-200 dark:border-[#334155] space-y-2">
            <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              Active Traversal & Zip-Slip Protection
            </h3>
            <p className="text-[#64748B] dark:text-slate-400 text-[11px]">
              Every path and archive entry is verified using canonical native path resolution before reading or extraction:
            </p>
            <ul className="space-y-1 font-mono text-[11px] text-slate-700 dark:text-slate-300 list-disc list-inside">
              <li>Blocks ../ and ..\ relative escape sequences</li>
              <li>Validates symlink real paths against jail boundary</li>
              <li>Zip-Slip archive entry sanitization</li>
              <li>Immutable audit log for all disk mutations</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Backup Archives */}
      <div className="bg-[#FFFFFF] dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] rounded-2xl p-6 shadow-xs transition-colors">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-[#1E293B] dark:text-white uppercase tracking-wider flex items-center gap-2">
            <Download className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Available Project Backups</span>
          </h2>
          <span className="text-xs text-[#64748B] dark:text-slate-400 font-mono">{backups.length} Archives</span>
        </div>

        {backups.length === 0 ? (
          <p className="text-xs text-[#64748B] dark:text-slate-400">No project backups have been created yet. You can create a backup from the dashboard.</p>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {backups.map((b) => (
              <div key={b.filename} className="p-3 bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-[#334155] rounded-xl flex items-center justify-between text-xs">
                <div>
                  <span className="font-mono text-[#1E293B] dark:text-white font-semibold">{b.filename}</span>
                  <span className="text-[#64748B] dark:text-slate-400 text-[11px] block mt-0.5">
                    {formatBytes(b.sizeBytes)} • {new Date(b.createdAt).toLocaleString()}
                  </span>
                </div>
                <span className="text-[11px] text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 font-medium">
                  Verified Safe Zip
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Audit Logs Table */}
      <div className="bg-[#FFFFFF] dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] rounded-2xl p-6 shadow-xs transition-colors">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-[#1E293B] dark:text-white uppercase tracking-wider flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Storage Guardian Audit Trail</span>
          </h2>
          <span className="text-xs text-[#64748B] dark:text-slate-400 font-mono">Recent Operations</span>
        </div>

        <div className="overflow-x-auto max-h-72">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-[#E2E8F0] dark:border-[#334155] text-[#64748B] dark:text-slate-400 font-mono">
                <th className="py-2 px-3">Timestamp</th>
                <th className="py-2 px-3">Project</th>
                <th className="py-2 px-3">Operation</th>
                <th className="py-2 px-3">Status</th>
                <th className="py-2 px-3">Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.slice(0, 30).map((l) => (
                <tr key={l.id} className="border-b border-slate-100 dark:border-slate-800 text-[#334155] dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60">
                  <td className="py-2 px-3 text-[#64748B] dark:text-slate-400 font-mono">{new Date(l.timestamp).toLocaleTimeString()}</td>
                  <td className="py-2 px-3 font-mono text-blue-600 dark:text-blue-400">{l.project_id || 'system'}</td>
                  <td className="py-2 px-3 font-semibold">{l.operation}</td>
                  <td className="py-2 px-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                      l.status === 'SUCCESS' ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                    }`}>
                      {l.status}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-[#64748B] dark:text-slate-400 truncate max-w-sm">{l.details || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
