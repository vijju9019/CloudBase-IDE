import { Router } from 'express';
import { z } from 'zod';
import { getDatabase } from '../database/index.js';
import { StorageGuardian } from '../storage/guardian.js';
import { TemplateService } from '../services/templates.js';
import { DockerService } from '../docker/service.js';

export const projectsRouter = Router();

const createProjectSchema = z.object({
  name: z.string().min(1).max(50).regex(/^[a-zA-Z0-9_\-\s]+$/, 'Name contains invalid characters'),
  language: z.enum(['python', 'node', 'javascript', 'react', 'java', 'cpp', 'go']),
  template: z.string().default('default'),
  cpuLimit: z.number().min(0.1).max(8.0).optional().default(1.0),
  memoryLimitMb: z.number().min(128).max(16384).optional().default(1024),
  networkEnabled: z.boolean().optional().default(false)
});

// List all projects
projectsRouter.get('/', (req, res) => {
  try {
    const db = getDatabase();
    const projects = db.prepare(`
      SELECT p.*, 
             s.memory_limit, s.cpu_limit, s.network_enabled, s.autosave
      FROM projects p
      LEFT JOIN project_settings s ON p.id = s.project_id
      ORDER BY p.updated_at DESC
    `).all() as any[];

    // Augment with calculated storage size
    const enriched = projects.map(p => {
      let sizeBytes = 0;
      try {
        sizeBytes = StorageGuardian.calculateDirectorySize(p.workspace_path);
      } catch {}
      return {
        ...p,
        sizeBytes
      };
    });

    res.json(enriched);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Create project
projectsRouter.post('/', async (req, res) => {
  try {
    const parsed = createProjectSchema.parse(req.body);
    const db = getDatabase();

    // Unique project ID
    const sanitizedName = parsed.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const projectId = `${sanitizedName}-${Date.now().toString(36)}`;
    const workspacePath = StorageGuardian.getProjectWorkspacePath(projectId);

    // Populate starter code files
    TemplateService.populateStarterFiles(workspacePath, parsed.language, parsed.name);

    const now = new Date().toISOString();

    // Insert database records
    const insertProject = db.prepare(`
      INSERT INTO projects (id, name, language, template, workspace_path, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 'stopped', ?, ?)
    `);
    insertProject.run(projectId, parsed.name, parsed.language, parsed.template, workspacePath, now, now);

    const insertSettings = db.prepare(`
      INSERT INTO project_settings (project_id, memory_limit, cpu_limit, network_enabled, autosave)
      VALUES (?, ?, ?, ?, 1)
    `);
    insertSettings.run(
      projectId,
      parsed.memoryLimitMb * 1024 * 1024,
      parsed.cpuLimit,
      parsed.networkEnabled ? 1 : 0
    );

    StorageGuardian.logAudit(projectId, 'CREATE_PROJECT', 'SUCCESS', `Created project "${parsed.name}" (${parsed.language})`);

    res.status(201).json({
      id: projectId,
      name: parsed.name,
      language: parsed.language,
      template: parsed.template,
      workspacePath,
      status: 'stopped',
      createdAt: now,
      updatedAt: now
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Get project details
projectsRouter.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const db = getDatabase();
    const project = db.prepare(`
      SELECT p.*, s.memory_limit, s.cpu_limit, s.network_enabled, s.autosave
      FROM projects p
      LEFT JOIN project_settings s ON p.id = s.project_id
      WHERE p.id = ?
    `).get(id) as any;

    if (!project) {
      return res.status(404).json({ error: `Project "${id}" not found` });
    }

    const sizeBytes = StorageGuardian.calculateDirectorySize(project.workspace_path);
    res.json({
      ...project,
      sizeBytes
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Delete project safely
projectsRouter.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDatabase();
    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(id) as any;

    if (!project) {
      return res.status(404).json({ error: `Project "${id}" not found` });
    }

    // Stop and remove associated container if present
    if (project.container_id) {
      try {
        await DockerService.stopContainer(project.container_id);
        await DockerService.removeContainer(project.container_id);
      } catch {}
    }

    // Safely remove project workspace folder ONLY
    StorageGuardian.safeDeleteProject(id);

    // Delete DB records
    db.prepare('DELETE FROM projects WHERE id = ?').run(id);

    res.json({ success: true, message: `Project "${id}" deleted safely` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
