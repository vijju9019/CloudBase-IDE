import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  FolderGit2,
  ShieldCheck,
  Settings,
  Plus,
  Server,
  Cpu,
  Bot,
  RefreshCw,
  Search,
  Bell,
  Cloud,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { ThemeToggle } from './ThemeToggle';

export const Header: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { docker, ollama, refreshStatus, isLoadingStatus } = useAppStore();
  const [headerSearch, setHeaderSearch] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && headerSearch.trim()) {
      if (location.pathname !== '/') {
        navigate(`/?q=${encodeURIComponent(headerSearch.trim())}`);
      }
    }
  };

  return (
    <header className="h-14 bg-[#FFFFFF] dark:bg-[#0F172A] border-b border-[#E2E8F0] dark:border-[#1E293B] px-4 lg:px-6 flex items-center justify-between z-30 select-none shadow-[0_1px_2px_rgba(0,0,0,0.03)] shrink-0 transition-colors duration-200">
      {/* 1. Left: Brand & Tagline */}
      <div className="flex items-center gap-4">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-2xs group-hover:scale-105 group-hover:border-blue-400 transition-all">
            <Cloud className="w-5 h-5 fill-blue-600/10 stroke-blue-600 dark:stroke-blue-400" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm tracking-tight text-[#111827] dark:text-[#F8FAFC] group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                CloudBase IDE
              </span>
              <span className="text-[10px] px-1.5 py-0.2 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded font-mono font-bold">
                PRO
              </span>
            </div>
            <p className="text-[10px] text-[#64748B] dark:text-[#94A3B8] -mt-0.5 hidden xl:block font-medium">
              Your Code. Your Environment. Your AI.
            </p>
          </div>
        </Link>
      </div>

      {/* 2. Center: VS Code / SaaS Style Global Search Bar */}
      <div className="flex-1 max-w-md mx-4 hidden md:block">
        <div className="relative flex items-center">
          <Search className="w-3.5 h-3.5 absolute left-3 text-slate-400 dark:text-slate-500 pointer-events-none" />
          <input
            type="text"
            placeholder="Search projects, files, or commands..."
            value={headerSearch}
            onChange={(e) => setHeaderSearch(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            className="w-full bg-[#F8FAFC] dark:bg-[#1E293B] hover:bg-[#F1F5F9] dark:hover:bg-[#334155]/60 focus:bg-[#FFFFFF] dark:focus:bg-[#1E293B] text-[#111827] dark:text-[#F8FAFC] placeholder:text-[#94A3B8] dark:placeholder:text-[#64748B] text-xs pl-9 pr-12 py-1.5 rounded-lg border border-[#E2E8F0] dark:border-[#334155] focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 outline-none transition-all shadow-2xs"
          />
          <kbd className="absolute right-2.5 px-1.5 py-0.5 rounded bg-slate-200/60 dark:bg-slate-700/60 border border-slate-300/80 dark:border-slate-600 text-[10px] font-mono text-[#64748B] dark:text-slate-400 pointer-events-none">
            Ctrl+K
          </kbd>
        </div>
      </div>

      {/* 3. Right: Live System Status Pills, Theme Toggle & Actions */}
      <div className="flex items-center gap-2.5">
        {/* Docker Engine Pill */}
        <div
          title={docker?.available ? `Docker Engine Running (${docker.version})` : (docker?.error || 'Docker Daemon Offline')}
          className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border ${
            docker?.available
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
              : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
          }`}
        >
          <Cpu className="w-3.5 h-3.5" />
          <span>Docker:</span>
          <span className="font-semibold">{docker?.available ? 'Running' : 'Offline'}</span>
          <span className={`w-1.5 h-1.5 rounded-full ${docker?.available ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
        </div>

        {/* Local AI Pill */}
        <div
          title={ollama?.available ? `Ollama Local AI Ready (${ollama.models.length} local models)` : 'Ollama Offline (Using Heuristic Assistant)'}
          className={`hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border ${
            ollama?.available
              ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
          }`}
        >
          <Bot className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          <span>Local AI:</span>
          <span className="font-semibold">{ollama?.available ? 'Ready' : 'Offline'}</span>
          <span className={`w-1.5 h-1.5 rounded-full ${ollama?.available ? 'bg-blue-500' : 'bg-slate-400'}`} />
        </div>

        {/* Offline Mode Active Badge */}
        <div
          title="100% Offline Capable - Local-First Architecture"
          className="hidden xl:flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span>Offline Ready</span>
        </div>

        {/* Refresh System Health */}
        <button
          onClick={() => refreshStatus()}
          title="Refresh System Status"
          disabled={isLoadingStatus}
          aria-label="Refresh System Status"
          className="p-1.5 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoadingStatus ? 'animate-spin text-blue-600' : ''}`} />
        </button>

        {/* ☀️/🌙 LIGHT & DARK MODE TOGGLE BUTTON */}
        <ThemeToggle variant="icon" />

        {/* Notifications Icon Button */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            title="Notifications"
            className="p-1.5 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-colors relative"
          >
            <Bell className="w-4 h-4" />
            <span className="w-1.5 h-1.5 bg-blue-600 rounded-full absolute top-1 right-1" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-[#1E293B] rounded-xl border border-[#E2E8F0] dark:border-[#334155] shadow-lg p-3 z-50 text-xs">
              <div className="font-bold text-[#111827] dark:text-white pb-2 border-b border-[#F1F5F9] dark:border-[#334155] flex items-center justify-between">
                <span>Notifications</span>
                <span className="text-[10px] text-blue-600 dark:text-blue-400 font-mono">1 New</span>
              </div>
              <div className="py-2.5 space-y-2">
                <div className="p-2 rounded-lg bg-blue-50/70 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900">
                  <p className="font-semibold text-blue-900 dark:text-blue-300 text-[11px]">Storage Guardian Initialized</p>
                  <p className="text-[10px] text-blue-700 dark:text-blue-400 mt-0.5">Isolated workspace containers ready with 100% offline security.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Settings Button */}
        <Link
          to="/settings"
          title="Settings"
          className="p-1.5 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-colors"
        >
          <Settings className="w-4 h-4" />
        </Link>

        {/* Primary CTA: New Project Button */}
        <Link
          to="/wizard"
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg text-xs font-semibold shadow-xs hover:shadow-sm transition-all hover:scale-[1.01]"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>New Project</span>
        </Link>
      </div>
    </header>
  );
};
