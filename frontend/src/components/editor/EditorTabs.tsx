import React from 'react';
import { X, FileCode } from 'lucide-react';
import { useProjectStore } from '../../store/useProjectStore';

export const EditorTabs: React.FC = () => {
  const { openTabs, activeTabPath, setActiveTab, closeTab } = useProjectStore();

  const getFileIconColor = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.endsWith('.py')) return 'text-blue-500 dark:text-blue-400';
    if (lower.endsWith('.js') || lower.endsWith('.jsx')) return 'text-amber-500 dark:text-amber-400';
    if (lower.endsWith('.ts') || lower.endsWith('.tsx')) return 'text-blue-500 dark:text-sky-400';
    if (lower.endsWith('.json')) return 'text-emerald-500 dark:text-emerald-400';
    if (lower.endsWith('.html')) return 'text-orange-500 dark:text-orange-400';
    if (lower.endsWith('.css')) return 'text-sky-500 dark:text-cyan-400';
    return 'text-slate-400 dark:text-slate-500';
  };

  if (openTabs.length === 0) {
    return (
      <div className="h-9 bg-[#F8FAFC] dark:bg-[#0F172A] border-b border-[#E2E8F0] dark:border-[#1E293B] flex items-center px-4 text-xs text-[#64748B] dark:text-slate-400 transition-colors">
        No open editors
      </div>
    );
  }

  return (
    <div className="h-9 bg-[#F8FAFC] dark:bg-[#0F172A] border-b border-[#E2E8F0] dark:border-[#1E293B] flex items-center overflow-x-auto select-none no-scrollbar transition-colors">
      {openTabs.map((tab) => {
        const isActive = tab.path === activeTabPath;

        return (
          <div
            key={tab.path}
            onClick={() => setActiveTab(tab.path)}
            className={`group h-full flex items-center gap-2 px-3 text-xs font-mono border-r border-[#E2E8F0] dark:border-[#1E293B] cursor-pointer transition-colors relative ${
              isActive
                ? 'bg-[#FFFFFF] dark:bg-[#1E293B] text-[#1E293B] dark:text-[#F8FAFC] border-t-2 border-t-[#2563EB] dark:border-t-blue-500 font-medium shadow-xs'
                : 'bg-[#F1F5F9] dark:bg-[#0F172A] text-[#64748B] dark:text-slate-400 hover:bg-[#EFF6FF] dark:hover:bg-[#1E293B]/70 hover:text-[#1E293B] dark:hover:text-[#F8FAFC]'
            }`}
          >
            <FileCode className={`w-3.5 h-3.5 shrink-0 ${getFileIconColor(tab.name)}`} />
            <span className="truncate max-w-[140px] text-[12px]">{tab.name}</span>

            {/* Dirty indicator / Close button */}
            <div className="flex items-center ml-1">
              {tab.isDirty && (
                <span className="w-2 h-2 rounded-full bg-amber-500 mr-1.5" title="Unsaved changes" />
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  closeTab(tab.path);
                }}
                className={`p-0.5 rounded transition-colors ${
                  isActive
                    ? 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700'
                    : 'text-slate-400 opacity-60 group-hover:opacity-100 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
                title="Close Tab (Ctrl+W)"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
