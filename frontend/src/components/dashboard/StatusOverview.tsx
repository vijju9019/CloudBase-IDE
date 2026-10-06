import React from 'react';
import { Server, Cpu, Bot, ShieldCheck, CheckCircle2, HardDrive, WifiOff } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

function formatBytes(bytes?: number): string {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export const StatusOverview: React.FC = () => {
  const { backendOnline, docker, ollama, storage, stats } = useAppStore();

  const isDockerRunning = !!docker?.available;
  const isAiReady = !!ollama?.available;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 select-none">
      {/* 1. Docker Engine */}
      <div className="bg-[#FFFFFF] dark:bg-[#1E293B] p-4 rounded-xl border border-[#E2E8F0] dark:border-[#334155] hover:border-blue-300 dark:hover:border-blue-500 transition-all shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:shadow-xs group">
        <div className="flex items-center justify-between mb-3">
          <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 group-hover:scale-105 transition-transform">
            <Cpu className="w-4 h-4" />
          </div>
          <span
            className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
              isDockerRunning
                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isDockerRunning ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
              }`}
            />
            {isDockerRunning ? 'Running' : 'Offline'}
          </span>
        </div>
        <h3 className="font-bold text-sm text-[#111827] dark:text-white">Docker Engine</h3>
        <p className="text-xs text-[#64748B] dark:text-slate-400 mt-0.5 truncate" title={docker?.available ? `${docker.version || '29.x'}` : 'Docker Desktop is stopped'}>
          {docker?.available ? `Version ${docker.version || '29.x'}` : 'Container runtime stopped'}
        </p>
        <div className="mt-3 pt-2.5 border-t border-[#F1F5F9] dark:border-[#334155] flex items-center justify-between text-[11px] text-[#64748B] dark:text-slate-400">
          <span>Active Containers</span>
          <span className="text-blue-600 dark:text-blue-400 font-mono font-bold">{docker?.containersRunning ?? 0}</span>
        </div>
      </div>

      {/* 2. Local AI */}
      <div className="bg-[#FFFFFF] dark:bg-[#1E293B] p-4 rounded-xl border border-[#E2E8F0] dark:border-[#334155] hover:border-blue-300 dark:hover:border-blue-500 transition-all shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:shadow-xs group">
        <div className="flex items-center justify-between mb-3">
          <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 group-hover:scale-105 transition-transform">
            <Bot className="w-4 h-4" />
          </div>
          <span
            className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
              isAiReady
                ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isAiReady ? 'bg-purple-500' : 'bg-slate-400'
              }`}
            />
            {isAiReady ? 'Ready' : 'Heuristic Mode'}
          </span>
        </div>
        <h3 className="font-bold text-sm text-[#111827] dark:text-white">Local AI</h3>
        <p className="text-xs text-[#64748B] dark:text-slate-400 mt-0.5">
          {isAiReady ? `${ollama?.models.length} Local Models Loaded` : 'Ready (Offline Assistant)'}
        </p>
        <div className="mt-3 pt-2.5 border-t border-[#F1F5F9] dark:border-[#334155] flex items-center justify-between text-[11px] text-[#64748B] dark:text-slate-400">
          <span>Engine</span>
          <span className="text-purple-600 dark:text-purple-400 font-mono font-medium">Qwen2.5-Coder / Local</span>
        </div>
      </div>

      {/* 3. Offline Mode */}
      <div className="bg-[#FFFFFF] dark:bg-[#1E293B] p-4 rounded-xl border border-[#E2E8F0] dark:border-[#334155] hover:border-blue-300 dark:hover:border-blue-500 transition-all shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:shadow-xs group">
        <div className="flex items-center justify-between mb-3">
          <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-transform">
            <WifiOff className="w-4 h-4" />
          </div>
          <span className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Active
          </span>
        </div>
        <h3 className="font-bold text-sm text-[#111827] dark:text-white">Offline Mode</h3>
        <p className="text-xs text-[#64748B] dark:text-slate-400 mt-0.5">Zero Telemetry & 100% Private</p>
        <div className="mt-3 pt-2.5 border-t border-[#F1F5F9] dark:border-[#334155] flex items-center justify-between text-[11px] text-[#64748B] dark:text-slate-400">
          <span>Security</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-mono font-medium">Local-First</span>
        </div>
      </div>

      {/* 4. Storage Guardian */}
      <div className="bg-[#FFFFFF] dark:bg-[#1E293B] p-4 rounded-xl border border-[#E2E8F0] dark:border-[#334155] hover:border-blue-300 dark:hover:border-blue-500 transition-all shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:shadow-xs group">
        <div className="flex items-center justify-between mb-3">
          <div className="p-2 rounded-lg bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 group-hover:scale-105 transition-transform">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <span className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800">
            <CheckCircle2 className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
            Protected
          </span>
        </div>
        <h3 className="font-bold text-sm text-[#111827] dark:text-white">Storage Guardian</h3>
        <p className="text-xs text-[#64748B] dark:text-slate-400 mt-0.5">Isolated Directory Isolation</p>
        <div className="mt-3 pt-2.5 border-t border-[#F1F5F9] dark:border-[#334155] flex items-center justify-between text-[11px] text-[#64748B] dark:text-slate-400">
          <span>Disk Usage</span>
          <span className="text-cyan-600 dark:text-cyan-400 font-mono font-semibold">{formatBytes(storage?.totalSizeBytes)}</span>
        </div>
      </div>
    </div>
  );
};
