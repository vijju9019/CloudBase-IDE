import { create } from 'zustand';
import { Project, FileNode, EditorTab, ModificationProposal } from '../types';
import { api } from '../services/api';

function getLanguageFromPath(filePath: string): string {
  const ext = filePath.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'py': return 'python';
    case 'js': return 'javascript';
    case 'jsx': return 'javascript';
    case 'ts': return 'typescript';
    case 'tsx': return 'typescript';
    case 'html': return 'html';
    case 'css': return 'css';
    case 'json': return 'json';
    case 'java': return 'java';
    case 'cpp':
    case 'c':
    case 'h': return 'cpp';
    case 'go': return 'go';
    case 'md': return 'markdown';
    default: return 'plaintext';
  }
}

interface ProjectState {
  currentProject: Project | null;
  fileTree: FileNode[];
  openTabs: EditorTab[];
  activeTabPath: string | null;
  isLoadingProject: boolean;

  // Execution state
  isExecuting: boolean;
  executionOutput: string;
  executionExitCode: number | null;

  // Layout state
  bottomTab: 'terminal' | 'output' | 'preview' | 'logs' | 'audit';
  showAiPanel: boolean;
  showBottomPanel: boolean;

  // Active AI change proposal pending review
  activeProposal: ModificationProposal | null;

  // Actions
  loadProject: (id: string) => Promise<void>;
  refreshFileTree: () => Promise<void>;
  openFile: (path: string, name: string) => Promise<void>;
  closeTab: (path: string) => void;
  setActiveTab: (path: string) => void;
  updateTabContent: (path: string, content: string) => void;
  saveActiveFile: () => Promise<void>;
  runCode: () => Promise<void>;
  stopCode: () => Promise<void>;
  setBottomTab: (tab: 'terminal' | 'output' | 'preview' | 'logs' | 'audit') => void;
  toggleAiPanel: () => void;
  toggleBottomPanel: () => void;
  setActiveProposal: (proposal: ModificationProposal | null) => void;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  currentProject: null,
  fileTree: [],
  openTabs: [],
  activeTabPath: null,
  isLoadingProject: false,

  isExecuting: false,
  executionOutput: '',
  executionExitCode: null,

  bottomTab: 'terminal',
  showAiPanel: true,
  showBottomPanel: true,
  activeProposal: null,

  loadProject: async (id: string) => {
    set({ isLoadingProject: true });
    try {
      const project = await api.getProject(id);
      const tree = await api.getFileTree(id);

      set({
        currentProject: project,
        fileTree: tree,
        isLoadingProject: false,
        openTabs: [],
        activeTabPath: null,
        executionOutput: ''
      });

      // Automatically open main file if present
      const mainFiles = ['main.py', 'index.js', 'src/App.jsx', 'Main.java', 'main.cpp', 'main.go', 'README.md'];
      for (const mf of mainFiles) {
        try {
          const content = await api.getFileContent(id, mf);
          get().openFile(mf, mf);
          break;
        } catch {
          // Continue searching
        }
      }
    } catch (err) {
      set({ isLoadingProject: false });
      throw err;
    }
  },

  refreshFileTree: async () => {
    const { currentProject } = get();
    if (!currentProject) return;
    try {
      const tree = await api.getFileTree(currentProject.id);
      set({ fileTree: tree });
    } catch {}
  },

  openFile: async (filePath: string, name: string) => {
    const { openTabs, currentProject } = get();
    if (!currentProject) return;

    // Check if already open
    const existing = openTabs.find(t => t.path === filePath);
    if (existing) {
      set({ activeTabPath: filePath });
      return;
    }

    try {
      const content = await api.getFileContent(currentProject.id, filePath);
      const newTab: EditorTab = {
        path: filePath,
        name,
        language: getLanguageFromPath(filePath),
        content,
        isDirty: false
      };

      set({
        openTabs: [...openTabs, newTab],
        activeTabPath: filePath
      });
    } catch (err: any) {
      console.error('Failed to open file', err);
    }
  },

  closeTab: (filePath: string) => {
    const { openTabs, activeTabPath } = get();
    const remaining = openTabs.filter(t => t.path !== filePath);
    let nextActive = activeTabPath;

    if (activeTabPath === filePath) {
      nextActive = remaining.length > 0 ? remaining[remaining.length - 1].path : null;
    }

    set({
      openTabs: remaining,
      activeTabPath: nextActive
    });
  },

  setActiveTab: (path: string) => {
    set({ activeTabPath: path });
  },

  updateTabContent: (path: string, content: string) => {
    const { openTabs } = get();
    set({
      openTabs: openTabs.map(t => (t.path === path ? { ...t, content, isDirty: true } : t))
    });
  },

  saveActiveFile: async () => {
    const { currentProject, openTabs, activeTabPath } = get();
    if (!currentProject || !activeTabPath) return;

    const tab = openTabs.find(t => t.path === activeTabPath);
    if (!tab) return;

    try {
      await api.saveFileContent(currentProject.id, tab.path, tab.content);
      set({
        openTabs: openTabs.map(t => (t.path === activeTabPath ? { ...t, isDirty: false } : t))
      });
    } catch (err) {
      console.error('Save failed', err);
    }
  },

  runCode: async () => {
    const { currentProject, saveActiveFile } = get();
    if (!currentProject) return;

    // Autosave dirty files before running
    await saveActiveFile();

    set({
      isExecuting: true,
      bottomTab: 'output',
      showBottomPanel: true,
      executionOutput: `⚡ Initializing code execution for project ${currentProject.name}...\r\n`
    });

    try {
      const result = await api.runCode(currentProject.id);
      set({
        isExecuting: false,
        executionOutput: result.output || 'Execution completed without output.',
        executionExitCode: result.exitCode
      });
    } catch (err: any) {
      set({
        isExecuting: false,
        executionOutput: `\r\n❌ Execution Error: ${err.message}\r\n`,
        executionExitCode: 1
      });
    }
  },

  stopCode: async () => {
    const { currentProject } = get();
    if (!currentProject) return;

    try {
      await api.stopExecution(currentProject.id);
      set({ isExecuting: false });
    } catch (err) {
      console.error('Stop failed', err);
    }
  },

  setBottomTab: (tab) => set({ bottomTab: tab }),
  toggleAiPanel: () => set(state => ({ showAiPanel: !state.showAiPanel })),
  toggleBottomPanel: () => set(state => ({ showBottomPanel: !state.showBottomPanel })),
  setActiveProposal: (proposal) => set({ activeProposal: proposal })
}));
