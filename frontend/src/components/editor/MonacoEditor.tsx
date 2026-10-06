import React, { useEffect, useRef } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import { useProjectStore } from '../../store/useProjectStore';
import { useAppStore } from '../../store/useAppStore';
import { Code2, ChevronRight, FileCode } from 'lucide-react';

export const MonacoEditor: React.FC = () => {
  const { currentProject, openTabs, activeTabPath, updateTabContent, saveActiveFile, runCode } = useProjectStore();
  const { theme } = useAppStore();
  const monacoRef = useRef<any>(null);
  const currentTab = openTabs.find((t) => t.path === activeTabPath);
  const isDark = theme === 'dark';

  // Keyboard shortcut listener for Ctrl+S and Ctrl+Enter
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveActiveFile();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        runCode();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [saveActiveFile, runCode]);

  // Synchronize Monaco theme whenever the app theme changes
  useEffect(() => {
    if (monacoRef.current) {
      monacoRef.current.editor.setTheme(isDark ? 'cloudbase-dark' : 'cloudbase-light');
    }
  }, [isDark]);

  const handleEditorMount: OnMount = (editor, monaco) => {
    monacoRef.current = monaco;

    // 1. Custom VS Code-inspired Light Theme
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

    // 2. Custom VS Code-inspired Dark Theme
    monaco.editor.defineTheme('cloudbase-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '64748B', fontStyle: 'italic' },
        { token: 'keyword', foreground: '60A5FA', fontStyle: 'bold' },
        { token: 'string', foreground: '34D399' },
        { token: 'number', foreground: 'FBBF24' },
        { token: 'type', foreground: '38BDF8' },
        { token: 'function', foreground: '818CF8' },
      ],
      colors: {
        'editor.background': '#0B0F19',
        'editor.foreground': '#F8FAFC',
        'editor.lineHighlightBackground': '#1E293B50',
        'editorCursor.foreground': '#38BDF8',
        'editorLineNumber.foreground': '#475569',
        'editorLineNumber.activeForeground': '#38BDF8',
        'editor.selectionBackground': '#1E3A8A80',
        'editorIndentGuide.background': '#1E293B',
        'editorIndentGuide.activeBackground': '#334155',
        'editorOverviewRuler.border': '#1E293B',
        'editorGutter.background': '#0B0F19',
      }
    });

    monaco.editor.setTheme(isDark ? 'cloudbase-dark' : 'cloudbase-light');
  };

  if (!currentTab) {
    return (
      <div className="h-full w-full bg-[#FFFFFF] dark:bg-[#0B0F19] flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 select-none p-6 transition-colors">
        <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-[#1E293B] border border-slate-200 dark:border-[#334155] flex items-center justify-center mb-4 text-blue-600 dark:text-blue-400 shadow-xs">
          <Code2 className="w-8 h-8" />
        </div>
        <h3 className="text-base font-semibold text-[#1E293B] dark:text-white">No Editor Open</h3>
        <p className="text-xs text-[#64748B] dark:text-slate-400 mt-1 max-w-sm text-center leading-relaxed">
          Select a file from the explorer on the left or press <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono text-[10px]">Ctrl+P</kbd> to quickly open a file.
        </p>
        <div className="mt-6 flex flex-wrap gap-2 text-[11px] text-[#64748B] dark:text-slate-400 font-mono">
          <span className="px-2.5 py-1 rounded bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs">Ctrl+S Save</span>
          <span className="px-2.5 py-1 rounded bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs">Ctrl+Enter Run</span>
        </div>
      </div>
    );
  }

  // Breadcrumbs path
  const pathParts = currentTab.path.split('/');

  return (
    <div className="h-full w-full bg-[#FFFFFF] dark:bg-[#0B0F19] flex flex-col transition-colors">
      {/* VS Code Breadcrumbs Bar */}
      <div className="h-6 bg-[#FFFFFF] dark:bg-[#0F172A] border-b border-[#F1F5F9] dark:border-[#1E293B] px-3 flex items-center gap-1 text-[11px] text-[#64748B] dark:text-slate-400 font-mono select-none transition-colors">
        <span className="font-semibold text-slate-700 dark:text-slate-300">{currentProject?.name || 'workspace'}</span>
        {pathParts.map((part, index) => (
          <React.Fragment key={index}>
            <ChevronRight className="w-3 h-3 text-slate-400 dark:text-slate-500 shrink-0" />
            <span className={index === pathParts.length - 1 ? 'text-[#1E293B] dark:text-white font-medium flex items-center gap-1' : 'text-slate-500 dark:text-slate-400'}>
              {index === pathParts.length - 1 && <FileCode className="w-3 h-3 text-blue-600 dark:text-blue-400" />}
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
          theme={isDark ? 'cloudbase-dark' : 'cloudbase-light'}
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
