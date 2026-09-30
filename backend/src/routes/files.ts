import { Router } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { StorageGuardian } from '../storage/guardian.js';

export const filesRouter = Router({ mergeParams: true });

interface FileNode {
  name: string;
  path: string; // relative to workspace
  type: 'file' | 'directory';
  size?: number;
  children?: FileNode[];
}

function buildFileTree(dirPath: string, relPath = ''): FileNode[] {
  if (!fs.existsSync(dirPath)) return [];
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  const nodes: FileNode[] = [];

  for (const entry of entries) {
    if (entry.name === '.git' || entry.name === 'node_modules' || entry.name === '__pycache__' || entry.name === '.venv') {
      continue;
    }

    const currentRel = relPath ? `${relPath}/${entry.name}` : entry.name;
    const currentFull = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      nodes.push({
        name: entry.name,
        path: currentRel,
        type: 'directory',
        children: buildFileTree(currentFull, currentRel)
      });
    } else {
      const stats = fs.statSync(currentFull);
      nodes.push({
        name: entry.name,
        path: currentRel,
        type: 'file',
        size: stats.size
      });
    }
  }

  // Sort folders first, then files alphabetically
  return nodes.sort((a, b) => {
    if (a.type === b.type) return a.name.localeCompare(b.name);
    return a.type === 'directory' ? -1 : 1;
  });
}

// Get file tree
filesRouter.get('/', (req, res) => {
  try {
    const { id } = req.params as { id: string };
    const workspace = StorageGuardian.getProjectWorkspacePath(id);
    const tree = buildFileTree(workspace);
    res.json(tree);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Read file
filesRouter.get('/content', (req, res) => {
  try {
    const { id } = req.params as { id: string };
    const relPath = req.query.path as string;
    if (!relPath) {
      return res.status(400).json({ error: 'Missing path query parameter' });
    }

    const workspace = StorageGuardian.getProjectWorkspacePath(id);
    const safeTarget = StorageGuardian.resolveSafeFilePath(workspace, relPath);

    if (!fs.existsSync(safeTarget) || fs.statSync(safeTarget).isDirectory()) {
      return res.status(404).json({ error: `File "${relPath}" not found` });
    }

    const content = fs.readFileSync(safeTarget, 'utf-8');
    res.json({ path: relPath, content });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Write / Save file
filesRouter.put('/content', (req, res) => {
  try {
    const { id } = req.params as { id: string };
    const { path: relPath, content } = req.body;
    if (!relPath || typeof content !== 'string') {
      return res.status(400).json({ error: 'Invalid path or content' });
    }

    const workspace = StorageGuardian.getProjectWorkspacePath(id);
    const safeTarget = StorageGuardian.resolveSafeFilePath(workspace, relPath);

    const parentDir = path.dirname(safeTarget);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }

    fs.writeFileSync(safeTarget, content, 'utf-8');
    res.json({ success: true, path: relPath });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Create file or folder
filesRouter.post('/', (req, res) => {
  try {
    const { id } = req.params as { id: string };
    const { path: relPath, type } = req.body; // type: 'file' | 'directory'
    if (!relPath) {
      return res.status(400).json({ error: 'Missing path parameter' });
    }

    const workspace = StorageGuardian.getProjectWorkspacePath(id);
    const safeTarget = StorageGuardian.resolveSafeFilePath(workspace, relPath);

    if (type === 'directory') {
      if (!fs.existsSync(safeTarget)) {
        fs.mkdirSync(safeTarget, { recursive: true });
      }
    } else {
      const parentDir = path.dirname(safeTarget);
      if (!fs.existsSync(parentDir)) {
        fs.mkdirSync(parentDir, { recursive: true });
      }
      if (!fs.existsSync(safeTarget)) {
        fs.writeFileSync(safeTarget, '', 'utf-8');
      }
    }

    res.status(201).json({ success: true, path: relPath, type });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Delete file or folder
filesRouter.delete('/', (req, res) => {
  try {
    const { id } = req.params as { id: string };
    const relPath = req.query.path as string;
    if (!relPath) {
      return res.status(400).json({ error: 'Missing path query parameter' });
    }

    const workspace = StorageGuardian.getProjectWorkspacePath(id);
    const safeTarget = StorageGuardian.resolveSafeFilePath(workspace, relPath);

    if (fs.existsSync(safeTarget)) {
      fs.rmSync(safeTarget, { recursive: true, force: true });
    }

    res.json({ success: true, path: relPath });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Rename file or folder
filesRouter.post('/rename', (req, res) => {
  try {
    const { id } = req.params as { id: string };
    const { oldPath, newPath } = req.body;
    if (!oldPath || !newPath) {
      return res.status(400).json({ error: 'Missing oldPath or newPath' });
    }

    const workspace = StorageGuardian.getProjectWorkspacePath(id);
    const safeOld = StorageGuardian.resolveSafeFilePath(workspace, oldPath);
    const safeNew = StorageGuardian.resolveSafeFilePath(workspace, newPath);

    if (!fs.existsSync(safeOld)) {
      return res.status(404).json({ error: `Path "${oldPath}" does not exist` });
    }

    const parentDir = path.dirname(safeNew);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }

    fs.renameSync(safeOld, safeNew);
    res.json({ success: true, oldPath, newPath });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});
