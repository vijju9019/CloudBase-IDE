import React from 'react';
import { X, FileCode } from 'lucide-react';
import { useProjectStore } from '../../store/useProjectStore';

export const EditorTabs: React.FC = () => {
  const { openTabs, activeTabPath, setActiveTab, closeTab } = useProjectStore();

  const getFileIconColor = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.endsWith('.py')) return 'text-blue-600';
    if (lower.endsWith('.js') || lower.endsWith('.jsx')) return 'text-amber-500';
    if (lower.endsWith('.ts') || lower.endsWith('.tsx')) return 'text-blue-500';
    if (lower.endsWith('.json')) return 'text-emerald-600';
    if (lower.endsWith('.html')) return 'text-orange-500';
    if (lower.endsWith('.css')) return 'text-sky-500';
    return 'text-slate-500';
  };

  if (openTabs.length === 0) {
    return (
      <div className="h-9 bg-[#F8FAFC] border-b border-[#E2E8F0] flex items-center px-4 text-xs text-[#64748B]">
        No open editors
      </div>
    );
  }

  return (
    <div className="h-9 bg-[#F8FAFC] border-b border-[#E2E8F0] flex items-center overflow-x-auto select-none no-scrollbar">
      {openTabs.map((tab) => {
        const isActive = tab.path === activeTabPath;

        return (
          <div
            key={tab.path}
            onClick={() => setActiveTab(tab.path)}
            className={`group h-full flex items-center gap-2 px-3 text-xs font-mono border-r border-[#E2E8F0] cursor-pointer transition-colors relative ${
              isActive
                ? 'bg-[#FFFFFF] text-[#1E293B] border-t-2 border-t-[#2563EB] font-medium shadow-xs'
                : 'bg-[#F1F5F9] text-[#64748B] hover:bg-[#EFF6FF] hover:text-[#1E293B]'
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
                    ? 'text-slate-400 hover:text-slate-700 hover:bg-slate-200'
                    : 'text-slate-400 opacity-60 group-hover:opacity-100 hover:text-slate-700 hover:bg-slate-200'
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
