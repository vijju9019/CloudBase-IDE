import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderGit2,
  Cpu,
  Bot,
  ShieldCheck,
  Archive,
  Settings,
  HardDrive,
  ExternalLink,
  ChevronRight,
  Sun,
  Moon
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { ThemeToggle } from './ThemeToggle';

function formatBytes(bytes?: number): string {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const { storage, stats, docker, ollama, theme, toggleTheme } = useAppStore();
  const isDark = theme === 'dark';

  const navItems = [
    {
      label: 'Dashboard',
      path: '/',
      icon: LayoutDashboard,
      badge: stats?.projectsCount !== undefined ? `${stats.projectsCount}` : undefined
    },
    {
      label: 'My Projects',
      path: '/#projects',
      icon: FolderGit2
    },
    {
      label: 'Environments',
      path: '/wizard',
      icon: Cpu,
      subBadge: docker?.available ? 'Docker' : 'Local'
    },
    {
      label: 'AI Assistant',
      path: '/settings',
      icon: Bot,
      subBadge: ollama?.available ? 'Ollama' : 'Ready'
    },
    {
      label: 'Storage',
      path: '/guardian',
      icon: ShieldCheck
    },
    {
      label: 'Backups',
      path: '/guardian',
      icon: Archive
    },
    {
      label: 'Settings',
      path: '/settings',
      icon: Settings
    }
  ];

  return (
    <aside className="w-56 lg:w-60 bg-[#F9FAFB] dark:bg-[#0F172A] border-r border-[#E2E8F0] dark:border-[#1E293B] flex flex-col justify-between py-4 select-none shrink-0 h-full transition-colors duration-200">
      {/* Navigation Links */}
      <div className="space-y-6 px-3">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] dark:text-[#94A3B8] px-3 mb-2 font-mono">
            Navigation
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.path === '/'
                  ? location.pathname === '/'
                  : location.pathname === item.path;

              return (
                <Link
                  key={item.label}
                  to={item.path}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all group ${
                    isActive
                      ? 'bg-[#EFF6FF] dark:bg-blue-950/60 text-[#2563EB] dark:text-blue-400 font-semibold border border-blue-200/60 dark:border-blue-800 shadow-2xs'
                      : 'text-[#475569] dark:text-[#94A3B8] hover:text-[#111827] dark:hover:text-[#F8FAFC] hover:bg-slate-200/60 dark:hover:bg-slate-800/80'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon
                      className={`w-4 h-4 transition-colors ${
                        isActive
                          ? 'text-[#2563EB] dark:text-blue-400'
                          : 'text-[#64748B] dark:text-slate-400 group-hover:text-[#111827] dark:group-hover:text-white'
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>

                  {item.badge && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-[#2563EB] dark:text-blue-300 font-mono font-bold">
                      {item.badge}
                    </span>
                  )}
                  {item.subBadge && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200/60 dark:bg-slate-800 text-[#64748B] dark:text-slate-400 font-mono">
                      {item.subBadge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Quick Environments Summary */}
        <div className="px-3">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] dark:text-[#94A3B8] mb-2 font-mono">
            Isolated Runtimes
          </div>
          <div className="space-y-1.5 text-xs">
            <div className="flex items-center justify-between py-1 px-2 rounded bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] shadow-2xs">
              <span className="text-[11px] font-medium text-[#1E293B] dark:text-slate-200">Python 3.12</span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Ready
              </span>
            </div>
            <div className="flex items-center justify-between py-1 px-2 rounded bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] shadow-2xs">
              <span className="text-[11px] font-medium text-[#1E293B] dark:text-slate-200">Node.js 24</span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Ready
              </span>
            </div>
            <div className="flex items-center justify-between py-1 px-2 rounded bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] shadow-2xs">
              <span className="text-[11px] font-medium text-[#1E293B] dark:text-slate-200">C / C++ / Java</span>
              <span className="text-[10px] text-blue-600 dark:text-blue-400 font-mono font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                Cloud+Host
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Controls: Storage Guardian & Theme Switcher */}
      <div className="px-3 pt-3 border-t border-[#E2E8F0] dark:border-[#1E293B] space-y-2">
        <Link
          to="/guardian"
          className="block p-2.5 rounded-xl bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] hover:border-blue-300 dark:hover:border-blue-500 transition-all shadow-2xs hover:shadow-xs group"
        >
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#1E293B] dark:text-slate-200">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Storage Guardian</span>
            </div>
            <span className="text-[10px] text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.2 rounded font-mono font-medium border border-emerald-200 dark:border-emerald-800">
              Active
            </span>
          </div>
          <div className="flex items-center justify-between text-[10px] text-[#64748B] dark:text-[#94A3B8] font-mono">
            <span>Usage</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {formatBytes(storage?.totalSizeBytes)}
            </span>
          </div>
        </Link>

        {/* Quick Theme Switcher Pill in Sidebar */}
        <div className="flex items-center justify-between px-1 py-1">
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
            Appearance
          </span>
          <ThemeToggle variant="pill" />
        </div>
      </div>
    </aside>
  );
};
