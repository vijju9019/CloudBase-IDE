import {
  Project,
  FileNode,
  DockerStatus,
  OllamaStatus,
  StorageOverview,
  ModificationProposal,
  ExecutionResult,
  OperationLog
} from '../types';

const BASE_URL = '/api';

export const api = {
  // System Health
  async getStatus(): Promise<{
    backend: any;
    docker: DockerStatus;
    ollama: OllamaStatus;
    storage: any;
    stats: any;
  }> {
    const res = await fetch(`${BASE_URL}/status`);
    if (!res.ok) throw new Error('Failed to fetch system status');
    return res.json();
  },

  // Projects
  async getProjects(): Promise<Project[]> {
    const res = await fetch(`${BASE_URL}/projects`);
    if (!res.ok) throw new Error('Failed to fetch projects');
    return res.json();
  },

  async getProject(id: string): Promise<Project> {
    const res = await fetch(`${BASE_URL}/projects/${id}`);
    if (!res.ok) throw new Error(`Failed to fetch project ${id}`);
    return res.json();
  },

  async createProject(data: {
    name: string;
    language: string;
    template?: string;
    cpuLimit?: number;
    memoryLimitMb?: number;
    networkEnabled?: boolean;
  }): Promise<Project> {
    const res = await fetch(`${BASE_URL}/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to create project' }));
      throw new Error(err.error || 'Failed to create project');
    }
    return res.json();
  },

  async deleteProject(id: string): Promise<void> {
    const res = await fetch(`${BASE_URL}/projects/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error(`Failed to delete project ${id}`);
  },

  // Files
  async getFileTree(projectId: string): Promise<FileNode[]> {
    const res = await fetch(`${BASE_URL}/projects/${projectId}/files`);
    if (!res.ok) throw new Error('Failed to fetch file tree');
    return res.json();
  },

  async getFileContent(projectId: string, path: string): Promise<string> {
    const res = await fetch(`${BASE_URL}/projects/${projectId}/files/content?path=${encodeURIComponent(path)}`);
    if (!res.ok) throw new Error(`Failed to read file ${path}`);
    const data = await res.json();
    return data.content;
  },

  async saveFileContent(projectId: string, path: string, content: string): Promise<void> {
    const res = await fetch(`${BASE_URL}/projects/${projectId}/files/content`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path, content })
    });
    if (!res.ok) throw new Error(`Failed to save file ${path}`);
  },

  async createFileOrFolder(projectId: string, path: string, type: 'file' | 'directory'): Promise<void> {
    const res = await fetch(`${BASE_URL}/projects/${projectId}/files`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path, type })
    });
    if (!res.ok) throw new Error(`Failed to create ${type}`);
  },

  async deleteFileOrFolder(projectId: string, path: string): Promise<void> {
    const res = await fetch(`${BASE_URL}/projects/${projectId}/files?path=${encodeURIComponent(path)}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error(`Failed to delete ${path}`);
  },

  async renameFileOrFolder(projectId: string, oldPath: string, newPath: string): Promise<void> {
    const res = await fetch(`${BASE_URL}/projects/${projectId}/files/rename`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ oldPath, newPath })
    });
    if (!res.ok) throw new Error(`Failed to rename path`);
  },

  // Docker Environment
  async getEnvironment(projectId: string): Promise<any> {
    const res = await fetch(`${BASE_URL}/projects/${projectId}/environment`);
    if (!res.ok) throw new Error('Failed to fetch environment status');
    return res.json();
  },

  async startEnvironment(projectId: string): Promise<any> {
    const res = await fetch(`${BASE_URL}/projects/${projectId}/start`, { method: 'POST' });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to start container' }));
      throw new Error(err.error || 'Failed to start container');
    }
    return res.json();
  },

  async stopEnvironment(projectId: string): Promise<any> {
    const res = await fetch(`${BASE_URL}/projects/${projectId}/stop`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to stop container');
    return res.json();
  },

  async restartEnvironment(projectId: string): Promise<any> {
    const res = await fetch(`${BASE_URL}/projects/${projectId}/restart`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to restart container');
    return res.json();
  },

  async getContainerLogs(projectId: string): Promise<string> {
    const res = await fetch(`${BASE_URL}/projects/${projectId}/logs`);
    if (!res.ok) return 'Failed to load logs';
    const data = await res.json();
    return data.logs;
  },

  // Code Execution
  async runCode(projectId: string, command?: string, waitMs = 3500): Promise<ExecutionResult> {
    const res = await fetch(`${BASE_URL}/projects/${projectId}/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command, waitMs })
    });
    if (!res.ok) throw new Error('Failed to initiate code execution');
    return res.json();
  },

  async stopExecution(projectId: string, jobId?: string): Promise<void> {
    await fetch(`${BASE_URL}/projects/${projectId}/stop-execution`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobId })
    });
  },

  // AI Assistant
  async getAiStatus(): Promise<OllamaStatus> {
    const res = await fetch(`${BASE_URL}/ai/status`);
    if (!res.ok) throw new Error('Failed to fetch AI status');
    return res.json();
  },

  async sendAiChat(
    projectId: string,
    message: string,
    model?: string,
    conversationId?: string,
    currentFile?: string,
    fileContent?: string
  ): Promise<{
    reply: string;
    conversationId: string;
    isOfflineFallback: boolean;
  }> {
    const res = await fetch(`${BASE_URL}/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId, message, model, conversationId, currentFile, fileContent })
    });
    if (!res.ok) throw new Error('Failed to communicate with AI service');
    return res.json();
  },

  async explainCode(code: string, filename?: string): Promise<string> {
    const res = await fetch(`${BASE_URL}/ai/explain`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, filename })
    });
    if (!res.ok) throw new Error('Failed to get code explanation');
    const data = await res.json();
    return data.explanation;
  },

  async debugError(error: string, filename?: string): Promise<string> {
    const res = await fetch(`${BASE_URL}/ai/debug`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error, filename })
    });
    if (!res.ok) throw new Error('Failed to debug error');
    const data = await res.json();
    return data.diagnosis;
  },

  async proposeFileChange(projectId: string, prompt: string, targetFile: string, model?: string): Promise<ModificationProposal> {
    const res = await fetch(`${BASE_URL}/ai/propose-change`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId, prompt, targetFile, model })
    });
    if (!res.ok) throw new Error('Failed to generate change proposal');
    return res.json();
  },

  async applyProposal(proposalId: string): Promise<void> {
    const res = await fetch(`${BASE_URL}/ai/apply-change`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ proposalId })
    });
    if (!res.ok) throw new Error('Failed to apply modification');
  },

  async rejectProposal(proposalId: string): Promise<void> {
    const res = await fetch(`${BASE_URL}/ai/reject-change`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ proposalId })
    });
    if (!res.ok) throw new Error('Failed to reject proposal');
  },

  // Storage Guardian
  async getStorageOverview(): Promise<StorageOverview> {
    const res = await fetch(`${BASE_URL}/storage/usage`);
    if (!res.ok) throw new Error('Failed to fetch storage overview');
    return res.json();
  },

  async getAuditLogs(projectId?: string): Promise<OperationLog[]> {
    const url = projectId ? `${BASE_URL}/storage/logs?projectId=${projectId}` : `${BASE_URL}/storage/logs`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch audit logs');
    return res.json();
  },

  async createBackup(projectId: string): Promise<{ success: boolean; backupPath: string; filename: string }> {
    const res = await fetch(`${BASE_URL}/storage/backup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId })
    });
    if (!res.ok) throw new Error('Failed to create backup');
    return res.json();
  },

  async getBackups(): Promise<any[]> {
    const res = await fetch(`${BASE_URL}/storage/backups`);
    if (!res.ok) throw new Error('Failed to list backups');
    return res.json();
  },

  async restoreBackup(backupFilename: string, targetProjectId: string): Promise<void> {
    const res = await fetch(`${BASE_URL}/storage/restore`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ backupFilename, targetProjectId })
    });
    if (!res.ok) throw new Error('Failed to restore backup');
  },

  // Settings
  async getSettings(): Promise<any> {
    const res = await fetch(`${BASE_URL}/settings`);
    if (!res.ok) throw new Error('Failed to load settings');
    return res.json();
  },

  async updateSettings(data: any): Promise<void> {
    const res = await fetch(`${BASE_URL}/settings`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to update settings');
  }
};
