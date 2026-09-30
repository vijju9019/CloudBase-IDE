import { Router } from 'express';
import { DockerService } from '../docker/service.js';
import { getDatabase } from '../database/index.js';
import { StorageGuardian } from '../storage/guardian.js';

export const dockerRouter = Router();

// Global Docker health check
dockerRouter.get('/status', async (req, res) => {
  const status = await DockerService.checkStatus();
  res.json(status);
});

// List local images
dockerRouter.get('/images', async (req, res) => {
  const images = await DockerService.listImages();
  res.json(images);
});

// Inspect container environment for a specific project
dockerRouter.get('/projects/:id/environment', async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDatabase();
    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(id) as any;

    if (!project) {
      return res.status(404).json({ error: `Project "${id}" not found` });
    }

    if (!project.container_id) {
      return res.json({
        exists: false,
        status: 'none',
        containerId: null
      });
    }

    try {
      const inspect = await DockerService.inspectContainer(project.container_id);
      const isRunning = inspect.State?.Running || false;
      const statusStr = isRunning ? 'running' : 'stopped';

      // Update SQLite status
      db.prepare('UPDATE projects SET status = ? WHERE id = ?').run(statusStr, id);

      res.json({
        exists: true,
        status: statusStr,
        containerId: project.container_id,
        image: inspect.Config?.Image,
        startedAt: inspect.State?.StartedAt,
        networkMode: inspect.HostConfig?.NetworkMode,
        memoryLimit: inspect.HostConfig?.Memory
      });
    } catch (err: any) {
      // Container recorded in DB may have been pruned externally
      db.prepare('UPDATE projects SET status = ?, container_id = NULL WHERE id = ?').run('stopped', id);
      res.json({
        exists: false,
        status: 'missing',
        containerId: null,
        message: 'Container was removed or unavailable in Docker daemon'
      });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Start/Create container environment for project
dockerRouter.post('/projects/:id/start', async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDatabase();
    const project = db.prepare(`
      SELECT p.*, s.memory_limit, s.cpu_limit, s.network_enabled
      FROM projects p
      LEFT JOIN project_settings s ON p.id = s.project_id
      WHERE p.id = ?
    `).get(id) as any;

    if (!project) {
      return res.status(404).json({ error: `Project "${id}" not found` });
    }

    const dockerHealth = await DockerService.checkStatus();
    if (!dockerHealth.available) {
      return res.status(503).json({
        error: 'Docker daemon is not running. Please start Docker Desktop on your machine.',
        dockerError: dockerHealth.error
      });
    }

    let containerId = project.container_id;

    // Check if container already exists
    let needsCreation = true;
    if (containerId) {
      try {
        const inspect = await DockerService.inspectContainer(containerId);
        if (inspect.State?.Running) {
          return res.json({ success: true, containerId, status: 'running' });
        }
        needsCreation = false;
      } catch {
        needsCreation = true;
      }
    }

    if (needsCreation) {
      // Determine image based on language
      let defaultImage = 'python:3.12-slim';
      if (project.language === 'node' || project.language === 'javascript' || project.language === 'react') {
        defaultImage = 'node:22-slim';
      } else if (project.language === 'java') {
        defaultImage = 'eclipse-temurin:21-jdk';
      } else if (project.language === 'cpp') {
        defaultImage = 'gcc:13';
      } else if (project.language === 'go') {
        defaultImage = 'golang:1.22-alpine';
      }

      const workspace = StorageGuardian.getProjectWorkspacePath(id);
      containerId = await DockerService.createProjectContainer({
        projectId: id,
        workspacePath: workspace,
        dockerImage: defaultImage,
        memoryLimit: project.memory_limit,
        cpuLimit: project.cpu_limit,
        networkEnabled: !!project.network_enabled
      });

      db.prepare('UPDATE projects SET container_id = ? WHERE id = ?').run(containerId, id);
    }

    await DockerService.startContainer(containerId);
    db.prepare("UPDATE projects SET status = 'running' WHERE id = ?").run(id);

    StorageGuardian.logAudit(id, 'START_CONTAINER', 'SUCCESS', `Container started: ${containerId}`);
    res.json({ success: true, containerId, status: 'running' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Stop container environment
dockerRouter.post('/projects/:id/stop', async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDatabase();
    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(id) as any;

    if (!project || !project.container_id) {
      return res.json({ success: true, status: 'stopped' });
    }

    await DockerService.stopContainer(project.container_id);
    db.prepare("UPDATE projects SET status = 'stopped' WHERE id = ?").run(id);

    StorageGuardian.logAudit(id, 'STOP_CONTAINER', 'SUCCESS', `Container stopped: ${project.container_id}`);
    res.json({ success: true, status: 'stopped' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Restart container
dockerRouter.post('/projects/:id/restart', async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDatabase();
    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(id) as any;

    if (!project || !project.container_id) {
      return res.status(400).json({ error: 'No container exists to restart' });
    }

    await DockerService.restartContainer(project.container_id);
    db.prepare("UPDATE projects SET status = 'running' WHERE id = ?").run(id);

    res.json({ success: true, status: 'running' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Container logs
dockerRouter.get('/projects/:id/logs', async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDatabase();
    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(id) as any;

    if (!project || !project.container_id) {
      return res.json({ logs: 'No active container for this project.' });
    }

    const logs = await DockerService.getContainerLogs(project.container_id);
    res.json({ logs });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
