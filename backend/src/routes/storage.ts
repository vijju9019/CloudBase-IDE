import { Router } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { StorageGuardian } from '../storage/guardian.js';
import { config } from '../config.js';
import { getDatabase } from '../database/index.js';

export const storageRouter = Router();

// Storage usage breakdown
storageRouter.get('/usage', (req, res) => {
  try {
    const overview = StorageGuardian.getStorageOverview();
    res.json(overview);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Operation audit logs
storageRouter.get('/logs', (req, res) => {
  try {
    const projectId = req.query.projectId as string | undefined;
    const db = getDatabase();

    let logs;
    if (projectId) {
      logs = db.prepare(`
        SELECT * FROM operation_logs
        WHERE project_id = ?
        ORDER BY timestamp DESC
        LIMIT 100
      `).all(projectId);
    } else {
      logs = db.prepare(`
        SELECT * FROM operation_logs
        ORDER BY timestamp DESC
        LIMIT 100
      `).all();
    }

    res.json(logs);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// List backup archives
storageRouter.get('/backups', (req, res) => {
  try {
    const backupDir = config.storage.backups;
    if (!fs.existsSync(backupDir)) {
      return res.json([]);
    }

    const files = fs.readdirSync(backupDir, { withFileTypes: true });
    const backups = files
      .filter(f => f.isFile() && f.name.endsWith('.zip'))
      .map(f => {
        const fullPath = path.join(backupDir, f.name);
        const stat = fs.statSync(fullPath);
        return {
          filename: f.name,
          sizeBytes: stat.size,
          createdAt: stat.birthtime.toISOString(),
          path: fullPath
        };
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    res.json(backups);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Create backup for a project
storageRouter.post('/backup', async (req, res) => {
  try {
    const { projectId } = req.body;
    if (!projectId) {
      return res.status(400).json({ error: 'Missing projectId' });
    }

    const backupPath = await StorageGuardian.createProjectBackup(projectId);
    res.json({
      success: true,
      backupPath,
      filename: path.basename(backupPath)
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Restore backup for a project
storageRouter.post('/restore', (req, res) => {
  try {
    const { backupFilename, targetProjectId } = req.body;
    if (!backupFilename || !targetProjectId) {
      return res.status(400).json({ error: 'Missing backupFilename or targetProjectId' });
    }

    const backupPath = path.join(config.storage.backups, path.basename(backupFilename));
    if (!fs.existsSync(backupPath)) {
      return res.status(404).json({ error: `Backup archive "${backupFilename}" not found` });
    }

    StorageGuardian.restoreProjectBackup(backupPath, targetProjectId);
    res.json({ success: true, message: `Successfully restored project "${targetProjectId}"` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
