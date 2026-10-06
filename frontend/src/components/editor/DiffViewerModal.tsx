import React, { useState } from 'react';
import { DiffEditor } from '@monaco-editor/react';
import { Check, X, ShieldCheck, Sparkles, FileCode } from 'lucide-react';
import { ModificationProposal } from '../../types';
import { api } from '../../services/api';
import { useProjectStore } from '../../store/useProjectStore';
import { useAppStore } from '../../store/useAppStore';

interface DiffViewerModalProps {
  proposal: ModificationProposal;
  onClose: () => void;
}

export const DiffViewerModal: React.FC<DiffViewerModalProps> = ({ proposal, onClose }) => {
  const { currentProject, refreshFileTree, openFile } = useProjectStore();
  const { theme } = useAppStore();
  const isDark = theme === 'dark';
  const [isApplying, setIsApplying] = useState(false);
  const [selectedChangeIndex, setSelectedChangeIndex] = useState(0);

  const change = proposal.changes[selectedChangeIndex];

  const handleApply = async () => {
    setIsApplying(true);
    try {
      await api.applyProposal(proposal.id);
      await refreshFileTree();
      if (change) {
        await openFile(change.filePath, change.filePath.split('/').pop() || change.filePath);
      }
      onClose();
    } catch (err: any) {
      alert(`Failed to apply changes: ${err.message}`);
    } finally {
      setIsApplying(false);
    }
  };

  const handleReject = async () => {
    try {
      await api.rejectProposal(proposal.id);
      onClose();
    } catch (err: any) {
      alert(`Failed to reject proposal: ${err.message}`);
    }
  };

  if (!change) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex flex-col p-4 select-none">
      <div className="bg-[#FFFFFF] dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] rounded-2xl flex-1 flex flex-col overflow-hidden shadow-2xl transition-colors">
        {/* Header */}
        <div className="h-14 bg-[#FFFFFF] dark:bg-[#0F172A] border-b border-[#E2E8F0] dark:border-[#334155] px-6 flex items-center justify-between transition-colors">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-[#1E293B] dark:text-white">AI Code Modification Review</h3>
                <span className="text-xs px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-mono font-medium">
                  {change.filePath}
                </span>
              </div>
              <p className="text-xs text-[#64748B] dark:text-slate-400 truncate max-w-xl mt-0.5">
                Instruction: "{proposal.prompt}"
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleReject}
              disabled={isApplying}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              <X className="w-4 h-4 text-red-600 dark:text-red-400" />
              <span>Reject</span>
            </button>
            <button
              onClick={handleApply}
              disabled={isApplying}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition-all hover:scale-[1.01]"
            >
              <Check className="w-4 h-4" />
              <span>{isApplying ? 'Applying Changes...' : 'Accept & Apply Changes'}</span>
            </button>
          </div>
        </div>

        {/* Diff viewer notice */}
        <div className="h-8 bg-[#F8FAFC] dark:bg-[#0F172A] border-b border-[#E2E8F0] dark:border-[#334155] px-6 flex items-center justify-between text-xs text-[#64748B] dark:text-slate-400 transition-colors">
          <div className="flex items-center gap-4 font-medium">
            <span className="text-red-600 dark:text-red-400">← Original Code (Current File)</span>
            <span className="text-emerald-700 dark:text-emerald-400">→ Proposed Code (CloudBase AI)</span>
          </div>
          <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            Storage Guardian Protected File Modification
          </span>
        </div>

        {/* Monaco Diff Editor Container */}
        <div className="flex-1 w-full bg-[#FFFFFF] dark:bg-[#0F172A]">
          <DiffEditor
            height="100%"
            original={change.originalContent}
            modified={change.proposedContent}
            language={change.filePath.endsWith('.py') ? 'python' : 'javascript'}
            theme={isDark ? 'vs-dark' : 'vs'}
            options={{
              fontSize: 13,
              fontFamily: "'Fira Code', 'Cascadia Code', Consolas, monospace",
              readOnly: true,
              renderSideBySide: true,
              scrollBeyondLastLine: false,
              automaticLayout: true
            }}
          />
        </div>
      </div>
    </div>
  );
};
