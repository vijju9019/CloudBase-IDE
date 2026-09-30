import React from 'react';
import { Server, Cpu, Bot, ShieldCheck, CheckCircle2, HardDrive } from 'lucide-react';
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 select-none">
      {/* 1. Backend Service */}
      <div className="bg-[#FFFFFF] p-4 rounded-xl border border-[#E2E8F0] hover:border-blue-400/80 transition-all shadow-xs hover:shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
            <Server className="w-5 h-5" />
          </div>
          <span className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
            backendOnline ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${backendOnline ? 'bg-emerald-500' : 'bg-red-500'}`} />
            {backendOnline ? 'Online' : 'Offline'}
          </span>
        </div>
        <h3 className="font-semibold text-sm text-[#1E293B]">Local Backend</h3>
        <p className="text-xs text-[#64748B] mt-0.5">Node.js 24 + SQLite (WAL Mode)</p>
        <div className="mt-3 pt-3 border-t border-[#F1F5F9] flex items-center justify-between text-[11px] text-[#64748B]">
          <span>Port 3000 (127.0.0.1)</span>
          <span className="text-blue-600 font-mono font-medium">{stats?.projectsCount ?? 0} Projects</span>
        </div>
      </div>

      {/* 2. Docker Engine */}
      <div className="bg-[#FFFFFF] p-4 rounded-xl border border-[#E2E8F0] hover:border-blue-400/80 transition-all shadow-xs hover:shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="p-2 rounded-lg bg-cyan-50 text-cyan-600">
            <Cpu className="w-5 h-5" />
          </div>
          <span className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
            docker?.available ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${docker?.available ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            {docker?.available ? 'Ready' : 'Not Detected'}
          </span>
        </div>
        <h3 className="font-semibold text-sm text-[#1E293B]">Docker Engine</h3>
        <p className="text-xs text-[#64748B] mt-0.5 truncate" title={docker?.available ? `${docker.version || '29.x'} (WSL2 Desktop)` : 'Docker Desktop is not running'}>
          {docker?.available ? `${docker.version || '29.x'} (WSL2 Desktop)` : 'Docker Desktop is not running'}
        </p>
        <div className="mt-3 pt-3 border-t border-[#F1F5F9] flex items-center justify-between text-[11px] text-[#64748B]">
          <span>Running: {docker?.containersRunning ?? 0}</span>
          <span className="text-cyan-600 font-mono font-medium">{docker?.imagesTotal ?? 0} Images</span>
        </div>
      </div>

      {/* 3. Offline AI Engine */}
      <div className="bg-[#FFFFFF] p-4 rounded-xl border border-[#E2E8F0] hover:border-purple-400/80 transition-all shadow-xs hover:shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="p-2 rounded-lg bg-purple-50 text-purple-600">
            <Bot className="w-5 h-5" />
          </div>
          <span className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
            ollama?.available ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-slate-100 text-slate-700 border-slate-200'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${ollama?.available ? 'bg-purple-500' : 'bg-slate-400'}`} />
            {ollama?.available ? 'Ollama Active' : 'Offline Heuristics'}
          </span>
        </div>
        <h3 className="font-semibold text-sm text-[#1E293B]">Local Coding AI</h3>
        <p className="text-xs text-[#64748B] mt-0.5">
          {ollama?.available ? `${ollama.models.length} Local Models Loaded` : 'Ready (Fallback Assistant active)'}
        </p>
        <div className="mt-3 pt-3 border-t border-[#F1F5F9] flex items-center justify-between text-[11px] text-[#64748B]">
          <span>Qwen2.5-Coder / Local</span>
          <span className="text-purple-600 font-mono font-medium">100% Offline</span>
        </div>
      </div>

      {/* 4. Storage Guardian */}
      <div className="bg-[#FFFFFF] p-4 rounded-xl border border-[#E2E8F0] hover:border-emerald-400/80 transition-all shadow-xs hover:shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <span className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Protected
          </span>
        </div>
        <h3 className="font-semibold text-sm text-[#1E293B]">Storage Guardian</h3>
        <p className="text-xs text-[#64748B] mt-0.5">Zero Personal File Access</p>
        <div className="mt-3 pt-3 border-t border-[#F1F5F9] flex items-center justify-between text-[11px] text-[#64748B]">
          <span className="truncate max-w-[130px]" title={storage?.storageRoot}>Isolated Storage</span>
          <span className="text-emerald-700 font-mono font-medium">{formatBytes(storage?.totalSizeBytes)}</span>
        </div>
      </div>
    </div>
  );
};
