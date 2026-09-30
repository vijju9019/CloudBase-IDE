import { Router } from 'express';
import { DockerService } from '../docker/service.js';
import { OllamaService } from '../ai/ollama.js';
import { StorageGuardian } from '../storage/guardian.js';
import { getDatabase } from '../database/index.js';

export const healthRouter = Router();

healthRouter.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'CloudBase IDE Backend',
    timestamp: new Date().toISOString()
  });
});

healthRouter.get('/status', async (req, res) => {
  try {
    const [dockerStatus, ollamaStatus] = await Promise.all([
      DockerService.checkStatus(),
      OllamaService.checkStatus()
    ]);

    const storageOverview = StorageGuardian.getStorageOverview();
    const db = getDatabase();
    const templates = db.prepare('SELECT * FROM environment_templates').all();
    const projectCount = (db.prepare('SELECT COUNT(*) as count FROM projects').get() as any).count;

    res.json({
      backend: {
        online: true,
        version: '1.0.0',
        nodeVersion: process.version,
        platform: process.platform,
        uptimeSeconds: Math.floor(process.uptime())
      },
      docker: dockerStatus,
      ollama: ollamaStatus,
      storage: {
        root: storageOverview.storageRoot,
        totalBytes: storageOverview.totalSizeBytes,
        breakdown: storageOverview.breakdown
      },
      stats: {
        projectsCount: projectCount,
        templatesAvailable: templates.length
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
