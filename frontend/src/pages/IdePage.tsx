import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { PanelGroup, Panel, PanelResizeHandle } from 'react-resizable-panels';
import {
  Play,
  Square,
  RefreshCw,
  FolderGit2,
  Terminal as TerminalIcon,
  Bot,
  ExternalLink,
  ShieldCheck,
  FileCode,
  Layers,
  ArrowLeft,
  Layout,
  Maximize2,
  Files,
  Search,
  GitBranch,
  PlayCircle,
  Settings,
  X,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  Copy,
  ChevronRight,
  HardDrive
} from 'lucide-react';
import { useProjectStore } from '../store/useProjectStore';
import { FileTree } from '../components/explorer/FileTree';
import { EditorTabs } from '../components/editor/EditorTabs';
import { MonacoEditor } from '../components/editor/MonacoEditor';
import { XTermTerminal } from '../components/terminal/XTermTerminal';
import { AiPanel } from '../components/ai/AiPanel';
import { DiffViewerModal } from '../components/editor/DiffViewerModal';
import { StatusBadge, LanguageBadge } from '../components/common/Badge';
import { api } from '../services/api';

export const IdePage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const {
    currentProject,
    loadProject,
    fileTree,
    openTabs,
    activeTabPath,
    runCode,
    stopCode,
    isExecuting,
    executionOutput,
    bottomTab,
    setBottomTab,
    showAiPanel,
    toggleAiPanel,
    showBottomPanel,
    toggleBottomPanel,
    activeProposal,
    setActiveProposal
  } = useProjectStore();

  const [activeActivity, setActiveActivity] = useState<'explorer' | 'search' | 'git' | 'run' | 'ai' | 'storage'>('explorer');
  const [showExplorer, setShowExplorer] = useState(true);
  const [isTogglingEnv, setIsTogglingEnv] = useState(false);
  const [containerLogs, setContainerLogs] = useState<string>('');
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (projectId) {
      loadProject(projectId);
    }
  }, [projectId]);

  const isRunning = currentProject?.status === 'running';

  const handleToggleEnvironment = async () => {
    if (!currentProject) return;
    setIsTogglingEnv(true);
    try {
      if (isRunning) {
        await api.stopEnvironment(currentProject.id);
      } else {
        await api.startEnvironment(currentProject.id);
      }
      await loadProject(currentProject.id);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsTogglingEnv(false);
    }
  };

  const loadLogs = async () => {
    if (!currentProject) return;
    try {
      const logs = await api.getContainerLogs(currentProject.id);
      setContainerLogs(logs);
      const audit = await api.getAuditLogs(currentProject.id);
      setAuditLogs(audit);
    } catch {}
  };

  useEffect(() => {
    if (bottomTab === 'logs' || bottomTab === 'audit') {
      loadLogs();
    }
  }, [bottomTab]);

  const activeTab = openTabs.find((t) => t.path === activeTabPath);

  if (!currentProject) {
    return (
      <div className="h-full w-full bg-[#FFFFFF] flex flex-col items-center justify-center text-slate-500 select-none">
        <div className="w-8 h-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin mb-3" />
        <p className="text-xs font-medium text-slate-600">Loading CloudBase IDE Workspace...</p>
      </div>
    );
  }

  const handleActivityClick = (activity: 'explorer' | 'search' | 'git' | 'run' | 'ai' | 'storage') => {
    if (activity === 'ai') {
      toggleAiPanel();
      return;
    }
    if (activeActivity === activity) {
      setShowExplorer(!showExplorer);
    } else {
      setActiveActivity(activity);
      setShowExplorer(true);
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#FFFFFF] overflow-hidden select-none text-[#1E293B]">
      {/* Top VS Code-Inspired Title Bar */}
      <div className="h-10 bg-[#FFFFFF] border-b border-[#E2E8F0] px-3 flex items-center justify-between z-20 shadow-2xs">
        {/* Left: Project title & Back to Dashboard */}
        <div className="flex items-center gap-2.5">
          <Link
            to="/"
            title="Back to Dashboard"
            className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <div className="flex items-center gap-1.5">
            <span className="font-bold text-xs text-[#1E293B] tracking-tight">{currentProject.name}</span>
            <LanguageBadge language={currentProject.language} />
          </div>

          <div className="h-3.5 w-[1px] bg-slate-300 hidden sm:block mx-1" />

          {/* Container Environment Status Pill & Button */}
          <div className="flex items-center gap-1.5">
            <StatusBadge status={currentProject.status} />
            <button
              onClick={handleToggleEnvironment}
              disabled={isTogglingEnv}
              title={isRunning ? 'Stop Container Environment' : 'Start Dedicated Docker Container'}
              className={`px-2 py-0.5 rounded text-[11px] font-medium border transition-colors shadow-2xs ${
                isRunning
                  ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
              }`}
            >
              {isTogglingEnv ? '...' : isRunning ? 'Stop Env' : 'Start Env'}
            </button>
          </div>
        </div>

        {/* Center: VS Code Command / Search Bar */}
        <div className="hidden md:flex items-center justify-center flex-1 max-w-md mx-4">
          <div className="w-full flex items-center gap-2 bg-[#F1F5F9] hover:bg-[#E2E8F0] text-slate-600 px-3 py-1 rounded-md border border-[#E2E8F0] text-xs transition-colors cursor-pointer group shadow-2xs">
            <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600" />
            <span className="truncate text-slate-500 font-mono text-[11px]">
              {currentProject.name} — Search files or commands (Ctrl+P)
            </span>
          </div>
        </div>

        {/* Right: Primary Run Controls & Layout Toggles */}
        <div className="flex items-center gap-2">
          {/* Run / Stop Button */}
          {isExecuting ? (
            <button
              onClick={stopCode}
              className="flex items-center gap-1.5 px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-semibold shadow-xs transition-colors"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>Stop</span>
            </button>
          ) : (
            <button
              onClick={runCode}
              title="Execute project (Ctrl+Enter)"
              className="flex items-center gap-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold shadow-xs transition-all hover:scale-[1.01]"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Run Code</span>
            </button>
          )}

          <div className="h-3.5 w-[1px] bg-slate-300 hidden sm:block mx-1" />

          {/* Toggle Bottom Panel */}
          <button
            onClick={toggleBottomPanel}
            title="Toggle Terminal Panel"
            className={`p-1.5 rounded text-xs transition-colors ${
              showBottomPanel
                ? 'text-blue-600 bg-blue-50 border border-blue-200'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
            }`}
          >
            <TerminalIcon className="w-4 h-4" />
          </button>

          {/* Toggle AI Panel */}
          <button
            onClick={toggleAiPanel}
            title="Toggle CloudBase AI Assistant"
            className={`p-1.5 rounded text-xs transition-colors ${
              showAiPanel
                ? 'text-blue-600 bg-blue-50 border border-blue-200'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
            }`}
          >
            <Bot className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Workspace Body with Left Activity Bar */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Activity Bar */}
        <div className="w-12 bg-[#F1F5F9] border-r border-[#E2E8F0] flex flex-col justify-between items-center py-2 z-10 select-none">
          {/* Top Activity Icons */}
          <div className="flex flex-col items-center gap-1 w-full">
            <button
              onClick={() => handleActivityClick('explorer')}
              title="Explorer (Files)"
              className={`w-full py-2.5 flex items-center justify-center transition-colors relative ${
                activeActivity === 'explorer' && showExplorer
                  ? 'text-[#2563EB] bg-[#FFFFFF] border-l-2 border-[#2563EB]'
                  : 'text-[#64748B] hover:text-[#1E293B] hover:bg-slate-200/60'
              }`}
            >
              <Files className="w-5 h-5" />
            </button>

            <button
              onClick={() => handleActivityClick('search')}
              title="Search in Project"
              className={`w-full py-2.5 flex items-center justify-center transition-colors relative ${
                activeActivity === 'search' && showExplorer
                  ? 'text-[#2563EB] bg-[#FFFFFF] border-l-2 border-[#2563EB]'
                  : 'text-[#64748B] hover:text-[#1E293B] hover:bg-slate-200/60'
              }`}
            >
              <Search className="w-5 h-5" />
            </button>

            <button
              onClick={() => handleActivityClick('git')}
              title="Source Control (Git)"
              className={`w-full py-2.5 flex items-center justify-center transition-colors relative ${
                activeActivity === 'git' && showExplorer
                  ? 'text-[#2563EB] bg-[#FFFFFF] border-l-2 border-[#2563EB]'
                  : 'text-[#64748B] hover:text-[#1E293B] hover:bg-slate-200/60'
              }`}
            >
              <GitBranch className="w-5 h-5" />
            </button>

            <button
              onClick={() => handleActivityClick('run')}
              title="Run & Debug"
              className={`w-full py-2.5 flex items-center justify-center transition-colors relative ${
                activeActivity === 'run' && showExplorer
                  ? 'text-[#2563EB] bg-[#FFFFFF] border-l-2 border-[#2563EB]'
                  : 'text-[#64748B] hover:text-[#1E293B] hover:bg-slate-200/60'
              }`}
            >
              <PlayCircle className="w-5 h-5" />
            </button>

            <button
              onClick={() => handleActivityClick('ai')}
              title="CloudBase AI Assistant"
              className={`w-full py-2.5 flex items-center justify-center transition-colors relative ${
                showAiPanel
                  ? 'text-[#2563EB] bg-[#FFFFFF] border-l-2 border-[#2563EB]'
                  : 'text-[#64748B] hover:text-[#1E293B] hover:bg-slate-200/60'
              }`}
            >
              <Bot className="w-5 h-5" />
            </button>

            <Link
              to="/guardian"
              title="Storage Guardian"
              className="w-full py-2.5 flex items-center justify-center text-[#64748B] hover:text-[#1E293B] hover:bg-slate-200/60 transition-colors"
            >
              <ShieldCheck className="w-5 h-5" />
            </Link>
          </div>

          {/* Bottom Activity Icons */}
          <div className="flex flex-col items-center gap-1 w-full">
            <Link
              to="/settings"
              title="IDE Settings"
              className="w-full py-2 flex items-center justify-center text-[#64748B] hover:text-[#1E293B] hover:bg-slate-200/60 transition-colors"
            >
              <Settings className="w-5 h-5" />
            </Link>
          </div>
        </div>

        {/* Resizable Workspaces Panel Group */}
        <div className="flex-1 overflow-hidden">
          <PanelGroup direction="horizontal">
            {/* Panel 1: Sidebar (Explorer / Search / Git) */}
            {showExplorer && (
              <>
                <Panel defaultSize={20} minSize={14} maxSize={35}>
                  {activeActivity === 'explorer' && <FileTree nodes={fileTree} />}

                  {activeActivity === 'search' && (
                    <div className="h-full flex flex-col bg-[#F8FAFC] border-r border-[#E2E8F0] p-3 text-[#1E293B]">
                      <div className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider mb-2">
                        SEARCH IN WORKSPACE
                      </div>
                      <input
                        type="text"
                        placeholder="Search across files..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-white border border-[#CBD5E1] rounded px-2.5 py-1.5 text-xs text-[#1E293B] outline-none focus:border-blue-500 shadow-2xs"
                      />
                      <div className="mt-4 text-xs text-[#64748B] leading-relaxed">
                        Type keywords above to filter workspace files or locate declarations.
                      </div>
                    </div>
                  )}

                  {activeActivity === 'git' && (
                    <div className="h-full flex flex-col bg-[#F8FAFC] border-r border-[#E2E8F0] p-3 text-[#1E293B]">
                      <div className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider mb-2">
                        SOURCE CONTROL
                      </div>
                      <div className="p-3 bg-white border border-[#E2E8F0] rounded-lg text-xs shadow-2xs">
                        <div className="flex items-center gap-1.5 text-[#1E293B] font-semibold mb-1">
                          <GitBranch className="w-3.5 h-3.5 text-blue-600" />
                          <span>Branch: main</span>
                        </div>
                        <p className="text-[11px] text-[#64748B]">Workspace is tracked inside Storage Guardian repository.</p>
                      </div>
                    </div>
                  )}

                  {activeActivity === 'run' && (
                    <div className="h-full flex flex-col bg-[#F8FAFC] border-r border-[#E2E8F0] p-3 text-[#1E293B]">
                      <div className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider mb-2">
                        RUN & DEBUG
                      </div>
                      <button
                        onClick={runCode}
                        className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Run Project (Auto-detect)</span>
                      </button>
                    </div>
                  )}
                </Panel>

                <PanelResizeHandle className="w-1 bg-[#E2E8F0] hover:bg-[#2563EB] transition-colors cursor-col-resize" />
              </>
            )}

            {/* Panel 2: Editor Workspace + Bottom Panel */}
            <Panel defaultSize={showAiPanel ? 55 : 80} minSize={30}>
              <PanelGroup direction="vertical">
                {/* Editor Workspace */}
                <Panel defaultSize={showBottomPanel ? 65 : 100} minSize={20}>
                  <div className="h-full flex flex-col bg-[#FFFFFF]">
                    <EditorTabs />
                    <div className="flex-1 relative overflow-hidden">
                      <MonacoEditor />
                    </div>
                  </div>
                </Panel>

                {/* Bottom Resizable Panel (VS Code Style) */}
                {showBottomPanel && (
                  <>
                    <PanelResizeHandle className="h-1 bg-[#E2E8F0] hover:bg-[#2563EB] transition-colors cursor-row-resize" />
                    <Panel defaultSize={35} minSize={15} maxSize={70}>
                      <div className="h-full flex flex-col bg-[#FFFFFF] border-t border-[#E2E8F0]">
                        {/* Bottom Panel Tabs Strip */}
                        <div className="h-8 bg-[#F8FAFC] border-b border-[#E2E8F0] flex items-center justify-between px-2 select-none">
                          <div className="flex items-center gap-1 text-xs">
                            <button
                              onClick={() => setBottomTab('terminal')}
                              className={`px-2.5 py-1 text-[11px] font-mono font-medium transition-colors ${
                                bottomTab === 'terminal'
                                  ? 'text-[#2563EB] border-b-2 border-[#2563EB] font-bold'
                                  : 'text-[#64748B] hover:text-[#1E293B]'
                              }`}
                            >
                              TERMINAL
                            </button>
                            <button
                              onClick={() => setBottomTab('output')}
                              className={`px-2.5 py-1 text-[11px] font-mono font-medium transition-colors ${
                                bottomTab === 'output'
                                  ? 'text-[#2563EB] border-b-2 border-[#2563EB] font-bold'
                                  : 'text-[#64748B] hover:text-[#1E293B]'
                              }`}
                            >
                              OUTPUT
                            </button>
                            <button
                              onClick={() => setBottomTab('preview')}
                              className={`px-2.5 py-1 text-[11px] font-mono font-medium transition-colors ${
                                bottomTab === 'preview'
                                  ? 'text-[#2563EB] border-b-2 border-[#2563EB] font-bold'
                                  : 'text-[#64748B] hover:text-[#1E293B]'
                              }`}
                            >
                              PREVIEW
                            </button>
                            <button
                              onClick={() => setBottomTab('logs')}
                              className={`px-2.5 py-1 text-[11px] font-mono font-medium transition-colors ${
                                bottomTab === 'logs'
                                  ? 'text-[#2563EB] border-b-2 border-[#2563EB] font-bold'
                                  : 'text-[#64748B] hover:text-[#1E293B]'
                              }`}
                            >
                              CONTAINER LOGS
                            </button>
                            <button
                              onClick={() => setBottomTab('audit')}
                              className={`px-2.5 py-1 text-[11px] font-mono font-medium transition-colors ${
                                bottomTab === 'audit'
                                  ? 'text-[#2563EB] border-b-2 border-[#2563EB] font-bold'
                                  : 'text-[#64748B] hover:text-[#1E293B]'
                              }`}
                            >
                              AUDIT TRAIL
                            </button>
                          </div>

                          {/* Right Controls */}
                          <div className="flex items-center gap-1 text-slate-400">
                            <button
                              onClick={toggleBottomPanel}
                              title="Close Panel"
                              className="p-1 hover:text-slate-700 rounded hover:bg-slate-200 transition-colors"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Bottom Panel Views */}
                        <div className="flex-1 overflow-hidden relative">
                          {bottomTab === 'terminal' && (
                            <XTermTerminal projectId={currentProject.id} />
                          )}

                          {bottomTab === 'output' && (
                            <div className="h-full p-3 overflow-y-auto font-mono text-xs text-[#1E293B] bg-[#FFFFFF] select-text whitespace-pre-wrap leading-relaxed">
                              {executionOutput || 'No active execution output. Click "Run Code" above.'}
                            </div>
                          )}

                          {bottomTab === 'preview' && (
                            <div className="h-full w-full flex flex-col bg-white">
                              <div className="h-7 bg-[#F8FAFC] border-b border-[#E2E8F0] px-3 flex items-center justify-between text-xs text-[#64748B] font-mono">
                                <span>Controlled Sandbox Preview</span>
                                <a
                                  href={`/api/preview/${currentProject.id}/index.html`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="flex items-center gap-1 text-blue-600 hover:underline"
                                >
                                  <span>Open in Tab</span>
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              </div>
                              <iframe
                                src={`/api/preview/${currentProject.id}/index.html`}
                                title="Project Live Preview"
                                className="w-full flex-1 border-none"
                              />
                            </div>
                          )}

                          {bottomTab === 'logs' && (
                            <div className="h-full p-3 overflow-y-auto font-mono text-xs text-[#1E293B] bg-[#FFFFFF] select-text whitespace-pre-wrap leading-relaxed">
                              {containerLogs || 'No container logs available.'}
                            </div>
                          )}

                          {bottomTab === 'audit' && (
                            <div className="h-full p-3 overflow-y-auto bg-[#FFFFFF]">
                              <table className="w-full text-xs text-left">
                                <thead>
                                  <tr className="border-b border-[#E2E8F0] text-[#64748B] font-mono">
                                    <th className="py-1">Timestamp</th>
                                    <th className="py-1">Operation</th>
                                    <th className="py-1">Status</th>
                                    <th className="py-1">Details</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {auditLogs.map((log) => (
                                    <tr key={log.id} className="border-b border-[#E2E8F0]/70 text-[#1E293B]">
                                      <td className="py-1 text-[#64748B] font-mono">{new Date(log.timestamp).toLocaleTimeString()}</td>
                                      <td className="py-1 font-semibold text-blue-600">{log.operation}</td>
                                      <td className="py-1 text-emerald-600">{log.status}</td>
                                      <td className="py-1 text-[#64748B] truncate max-w-xs">{log.details || '-'}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      </div>
                    </Panel>
                  </>
                )}
              </PanelGroup>
            </Panel>

            {/* Panel 3: Right AI Panel */}
            {showAiPanel && (
              <>
                <PanelResizeHandle className="w-1 bg-[#E2E8F0] hover:bg-[#2563EB] transition-colors cursor-col-resize" />
                <Panel defaultSize={26} minSize={20} maxSize={45}>
                  <AiPanel />
                </Panel>
              </>
            )}
          </PanelGroup>
        </div>
      </div>

      {/* VS Code Classic Blue Bottom Status Bar */}
      <footer className="h-6 bg-[#2563EB] text-white px-3 flex items-center justify-between text-[11px] font-mono select-none z-20">
        {/* Left items */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-blue-700 px-2 py-0.5 rounded text-[10px] font-bold">
            <span>&gt;&lt;</span>
            <span>{currentProject.status === 'running' ? 'Docker: Active' : 'Docker: Standby'}</span>
          </div>

          <div className="flex items-center gap-1 text-blue-100 hover:text-white cursor-pointer">
            <GitBranch className="w-3 h-3" />
            <span>main</span>
          </div>

          <div className="flex items-center gap-1 text-blue-100">
            <span>0 ⊗ 0 ⚠</span>
          </div>
        </div>

        {/* Right items */}
        <div className="flex items-center gap-3 text-blue-100">
          <span className="hidden sm:inline">Ln 1, Col 1</span>
          <span className="hidden sm:inline">Spaces: 4</span>
          <span>UTF-8</span>
          <span className="hidden sm:inline">CRLF</span>
          <span className="font-semibold text-white capitalize">{activeTab?.language || currentProject.language}</span>
          <div className="flex items-center gap-1 text-white">
            <ShieldCheck className="w-3 h-3" />
            <span className="hidden md:inline">Storage Guardian</span>
          </div>
          <div className="flex items-center gap-1 text-emerald-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>AI: Ready</span>
          </div>
        </div>
      </footer>

      {/* AI Diff Viewer Modal */}
      {activeProposal && (
        <DiffViewerModal
          proposal={activeProposal}
          onClose={() => setActiveProposal(null)}
        />
      )}
    </div>
  );
};
