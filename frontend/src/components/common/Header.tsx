import React from 'react';
import { Link, useLocation } from 'react-router-dom';
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
  Sparkles
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

export const Header: React.FC = () => {
  const location = useLocation();
  const { docker, ollama, refreshStatus, isLoadingStatus } = useAppStore();

  const navItems = [
    { label: 'Dashboard', path: '/', icon: FolderGit2 },
    { label: 'Storage Guardian', path: '/guardian', icon: ShieldCheck },
    { label: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <header className="h-14 bg-[#FFFFFF] border-b border-[#E2E8F0] px-4 flex items-center justify-between z-30 select-none shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
      {/* Brand */}
      <div className="flex items-center gap-6">
        <Link to="/" className="flex items-center gap-2.5 group">
          <img
            src="/cloudbase-logo.svg"
            alt="CloudBase Logo"
            className="w-7 h-7 rounded-lg shadow-sm group-hover:scale-105 transition-transform"
          />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm tracking-tight text-[#1E293B] group-hover:text-blue-600 transition-colors">
                CloudBase
              </span>
              <span className="text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-600 border border-blue-200 rounded font-mono font-semibold">
                IDE
              </span>
            </div>
            <p className="text-[10px] text-[#64748B] -mt-0.5 hidden sm:block">Local-First Developer Environment</p>
          </div>
        </Link>

        {/* Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  active
                    ? 'bg-blue-50 text-blue-700 border border-blue-200/80 shadow-xs'
                    : 'text-[#64748B] hover:text-[#1E293B] hover:bg-slate-100/80'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${active ? 'text-blue-600' : 'text-[#64748B]'}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Real-time System Status Pills & Actions */}
      <div className="flex items-center gap-2.5">
        {/* Docker Indicator */}
        <div
          title={docker?.available ? `Docker Engine Running (${docker.version})` : (docker?.error || 'Docker Stopped')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border ${
            docker?.available
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-amber-50 text-amber-700 border-amber-200'
          }`}
        >
          <Cpu className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Docker:</span>
          <span className="font-semibold">{docker?.available ? 'Ready' : 'Offline'}</span>
          <span className={`w-1.5 h-1.5 rounded-full ${docker?.available ? 'bg-emerald-500' : 'bg-amber-500'}`} />
        </div>

        {/* Ollama Local AI Indicator */}
        <div
          title={ollama?.available ? `Ollama Local AI Ready (${ollama.models.length} models)` : 'Ollama Offline (Using Heuristic Assistant)'}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border ${
            ollama?.available
              ? 'bg-purple-50 text-purple-700 border-purple-200'
              : 'bg-slate-100 text-slate-600 border-slate-200'
          }`}
        >
          <Bot className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">AI Agent:</span>
          <span className="font-semibold">{ollama?.available ? `${ollama.models.length} Models` : 'Local Fallback'}</span>
          <span className={`w-1.5 h-1.5 rounded-full ${ollama?.available ? 'bg-purple-500' : 'bg-slate-400'}`} />
        </div>

        {/* Storage Guardian Badge */}
        <Link
          to="/guardian"
          title="Storage Guardian Active - Personal files strictly protected"
          className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
          <span className="font-semibold">Storage Guardian</span>
        </Link>

        {/* Refresh Status */}
        <button
          onClick={() => refreshStatus()}
          title="Refresh Services Status"
          disabled={isLoadingStatus}
          aria-label="Refresh Services Status"
          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoadingStatus ? 'animate-spin text-blue-600' : ''}`} />
        </button>

        {/* Create Project Button */}
        <Link
          to="/wizard"
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-semibold shadow-xs transition-all hover:scale-[1.01]"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Project</span>
        </Link>
      </div>
    </header>
  );
};
