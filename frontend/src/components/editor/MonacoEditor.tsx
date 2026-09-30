import React, { useEffect } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import { useProjectStore } from '../../store/useProjectStore';
import { Code2, ChevronRight, FileCode } from 'lucide-react';

export const MonacoEditor: React.FC = () => {
  const { currentProject, openTabs, activeTabPath, updateTabContent, saveActiveFile } = useProjectStore();
  const currentTab = openTabs.find((t) => t.path === activeTabPath);

  // Keyboard shortcut listener for Ctrl+S
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveActiveFile();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [saveActiveFile]);

  const handleEditorMount: OnMount = (editor, monaco) => {
    // Custom VS Code-inspired Light Theme
    monaco.editor.defineTheme('cloudbase-light', {
      base: 'vs',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '64748B', fontStyle: 'italic' },
        { token: 'keyword', foreground: '2563EB', fontStyle: 'bold' },
        { token: 'string', foreground: '16A34A' },
        { token: 'number', foreground: 'D97706' },
        { token: 'type', foreground: '0284C7' },
        { token: 'function', foreground: '0369A1' },
      ],
      colors: {
        'editor.background': '#FFFFFF',
        'editor.foreground': '#1E293B',
        'editor.lineHighlightBackground': '#F8FAFC',
        'editorCursor.foreground': '#2563EB',
        'editorLineNumber.foreground': '#94A3B8',
        'editorLineNumber.activeForeground': '#2563EB',
        'editor.selectionBackground': '#DBEAFE',
        'editorIndentGuide.background': '#F1F5F9',
        'editorIndentGuide.activeBackground': '#CBD5E1',
        'editorOverviewRuler.border': '#E2E8F0',
        'editorGutter.background': '#FFFFFF',
      }
    });

    monaco.editor.setTheme('cloudbase-light');
  };

  if (!currentTab) {
    return (
      <div className="h-full w-full bg-[#FFFFFF] flex flex-col items-center justify-center text-slate-500 select-none p-6">
        <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center mb-4 text-blue-600 shadow-xs">
          <Code2 className="w-8 h-8" />
        </div>
        <h3 className="text-base font-semibold text-[#1E293B]">No Editor Open</h3>
        <p className="text-xs text-[#64748B] mt-1 max-w-sm text-center leading-relaxed">
          Select a file from the explorer on the left or press <kbd className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-300 font-mono text-[10px]">Ctrl+P</kbd> to quickly open a file.
        </p>
        <div className="mt-6 flex flex-wrap gap-2 text-[11px] text-[#64748B] font-mono">
          <span className="px-2.5 py-1 rounded bg-slate-50 border border-slate-200 shadow-2xs">Ctrl+S Save</span>
          <span className="px-2.5 py-1 rounded bg-slate-50 border border-slate-200 shadow-2xs">Ctrl+Enter Run</span>
        </div>
      </div>
    );
  }

  // Breadcrumbs path
  const pathParts = currentTab.path.split('/');

  return (
    <div className="h-full w-full bg-[#FFFFFF] flex flex-col">
      {/* VS Code Breadcrumbs Bar */}
      <div className="h-6 bg-[#FFFFFF] border-b border-[#F1F5F9] px-3 flex items-center gap-1 text-[11px] text-[#64748B] font-mono select-none">
        <span className="font-semibold text-slate-700">{currentProject?.name || 'workspace'}</span>
        {pathParts.map((part, index) => (
          <React.Fragment key={index}>
            <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
            <span className={index === pathParts.length - 1 ? 'text-[#1E293B] font-medium flex items-center gap-1' : 'text-slate-500'}>
              {index === pathParts.length - 1 && <FileCode className="w-3 h-3 text-blue-600" />}
              {part}
            </span>
          </React.Fragment>
        ))}
      </div>

      {/* Main Monaco Editor */}
      <div className="flex-1 relative overflow-hidden">
        <Editor
          height="100%"
          path={currentTab.path}
          language={currentTab.language}
          value={currentTab.content}
          onChange={(val) => {
            if (val !== undefined) {
              updateTabContent(currentTab.path, val);
            }
          }}
          onMount={handleEditorMount}
          theme="cloudbase-light"
          options={{
            fontSize: 13,
            fontFamily: "'Fira Code', 'Cascadia Code', Consolas, monospace",
            fontLigatures: true,
            minimap: { enabled: true, maxColumn: 80 },
            scrollBeyondLastLine: false,
            smoothScrolling: true,
            cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: 'on',
            automaticLayout: true,
            tabSize: 2,
            wordWrap: 'on',
            renderLineHighlight: 'all',
            bracketPairColorization: { enabled: true },
            padding: { top: 8, bottom: 8 }
          }}
        />
      </div>
    </div>
  );
};
