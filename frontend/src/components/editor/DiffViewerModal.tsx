import React, { useState } from 'react';
import { DiffEditor } from '@monaco-editor/react';
import { Check, X, ShieldCheck, Sparkles, FileCode } from 'lucide-react';
import { ModificationProposal } from '../../types';
import { api } from '../../services/api';
import { useProjectStore } from '../../store/useProjectStore';

interface DiffViewerModalProps {
  proposal: ModificationProposal;
  onClose: () => void;
}

export const DiffViewerModal: React.FC<DiffViewerModalProps> = ({ proposal, onClose }) => {
  const { currentProject, refreshFileTree, openFile } = useProjectStore();
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
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex flex-col p-4 select-none">
      <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-2xl flex-1 flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="h-14 bg-[#FFFFFF] border-b border-[#E2E8F0] px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-[#1E293B]">AI Code Modification Review</h3>
                <span className="text-xs px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-mono font-medium">
                  {change.filePath}
                </span>
              </div>
              <p className="text-xs text-[#64748B] truncate max-w-xl mt-0.5">
                Instruction: "{proposal.prompt}"
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleReject}
              disabled={isApplying}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              <X className="w-4 h-4 text-red-600" />
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
        <div className="h-8 bg-[#F8FAFC] border-b border-[#E2E8F0] px-6 flex items-center justify-between text-xs text-[#64748B]">
          <div className="flex items-center gap-4 font-medium">
            <span className="text-red-600">← Original Code (Current File)</span>
            <span className="text-emerald-700">→ Proposed Code (CloudBase AI)</span>
          </div>
          <span className="flex items-center gap-1 text-slate-500 font-mono text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            Storage Guardian Protected File Modification
          </span>
        </div>

        {/* Monaco Diff Editor Container */}
        <div className="flex-1 w-full bg-[#FFFFFF]">
          <DiffEditor
            height="100%"
            original={change.originalContent}
            modified={change.proposedContent}
            language={change.filePath.endsWith('.py') ? 'python' : 'javascript'}
            theme="vs"
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
