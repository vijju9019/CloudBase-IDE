export interface Project {
  id: string;
  name: string;
  language: 'python' | 'node' | 'javascript' | 'react' | 'java' | 'cpp' | 'go';
  template: string;
  workspace_path: string;
  container_id: string | null;
  status: 'running' | 'stopped' | 'error';
  created_at: string;
  updated_at: string;
  sizeBytes?: number;
  memory_limit?: number;
  cpu_limit?: number;
  network_enabled?: number;
  autosave?: number;
}

export interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  children?: FileNode[];
}

export interface EditorTab {
  path: string;
  name: string;
  language: string;
  content: string;
  isDirty: boolean;
}

export interface DockerStatus {
  available: boolean;
  version?: string;
  engine?: string;
  error?: string;
  containersRunning?: number;
  containersTotal?: number;
  imagesTotal?: number;
}

export interface OllamaModel {
  name: string;
  modified_at: string;
  size: number;
  digest: string;
}

export interface OllamaStatus {
  available: boolean;
  url: string;
  models: OllamaModel[];
  error?: string;
  recommendedModels: string[];
}

export interface StorageOverview {
  storageRoot: string;
  totalSizeBytes: number;
  breakdown: {
    projectsBytes: number;
    modelsBytes: number;
    databaseBytes: number;
    backupsBytes: number;
    logsBytes: number;
    cacheBytes: number;
  };
  projects: Array<{
    id: string;
    name: string;
    sizeBytes: number;
    path: string;
  }>;
  protectedPaths: string[];
}

export interface ProposedChange {
  filePath: string;
  originalContent: string;
  proposedContent: string;
  diffSummary: string;
}

export interface ModificationProposal {
  id: string;
  projectId: string;
  createdAt: string;
  prompt: string;
  changes: ProposedChange[];
  status: 'pending' | 'accepted' | 'rejected';
}

export interface ExecutionResult {
  success: boolean;
  jobId: string;
  command: string;
  status: 'running' | 'completed' | 'failed' | 'stopped';
  exitCode: number | null;
  output: string;
}

export interface OperationLog {
  id: string;
  project_id: string | null;
  operation: string;
  status: string;
  timestamp: string;
  details?: string;
}
