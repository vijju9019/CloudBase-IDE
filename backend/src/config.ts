import path from 'node:path';
import os from 'node:os';
import dotenv from 'dotenv';

dotenv.config();

// Default storage location per Windows / cross-platform specification:
// %LOCALAPPDATA%\CloudBaseIDE or ~/.cloudbase-ide
const getDefaultStorageRoot = (): string => {
  if (process.env.CLOUDBASE_STORAGE_ROOT) {
    return path.resolve(process.env.CLOUDBASE_STORAGE_ROOT);
  }
  if (process.platform === 'win32' && process.env.LOCALAPPDATA) {
    return path.join(process.env.LOCALAPPDATA, 'CloudBaseIDE');
  }
  return path.join(os.homedir(), '.cloudbase-ide');
};

export const STORAGE_ROOT = getDefaultStorageRoot();

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  host: process.env.HOST || '127.0.0.1',
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  ollamaUrl: process.env.OLLAMA_URL || 'http://127.0.0.1:11434',
  defaultModel: process.env.DEFAULT_AI_MODEL || 'qwen2.5-coder:1.5b',
  
  // Storage paths
  storage: {
    root: STORAGE_ROOT,
    projects: path.join(STORAGE_ROOT, 'Projects'),
    models: path.join(STORAGE_ROOT, 'Models'),
    database: path.join(STORAGE_ROOT, 'Database'),
    backups: path.join(STORAGE_ROOT, 'Backups'),
    logs: path.join(STORAGE_ROOT, 'Logs'),
    cache: path.join(STORAGE_ROOT, 'Cache')
  },

  // Docker defaults
  docker: {
    // Windows named pipes or socket path
    socketPath: process.platform === 'win32' 
      ? (process.env.DOCKER_SOCKET || '//./pipe/dockerDesktopLinuxEngine')
      : (process.env.DOCKER_SOCKET || '/var/run/docker.sock'),
    host: process.env.DOCKER_HOST || undefined,
    defaultCpuLimit: 1.0,
    defaultMemoryLimit: 1024 * 1024 * 1024, // 1 GB
    defaultNetworkEnabled: false
  }
};
