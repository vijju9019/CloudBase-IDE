import { Router } from 'express';
import { ExecutionService } from '../services/execution.js';
import { getDatabase } from '../database/index.js';

export const executionRouter = Router();

// Execute code for a project
executionRouter.post('/projects/:id/run', async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDatabase();
    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(id) as any;

    if (!project) {
      return res.status(404).json({ error: `Project "${id}" not found` });
    }

    // Determine command to run
    let cmd = req.body.command as string | undefined;
    if (!cmd) {
      switch (project.language) {
        case 'python':
          cmd = 'python main.py';
          break;
        case 'node':
        case 'javascript':
          cmd = 'node index.js';
          break;
        case 'react':
          cmd = 'npm run dev';
          break;
        case 'java':
          cmd = 'javac Main.java && java Main';
          break;
        case 'cpp':
          cmd = 'g++ -o main main.cpp && ./main';
          break;
        case 'go':
          cmd = 'go run main.go';
          break;
        default:
          cmd = 'echo "No run command configured for this project"';
      }
    }

    // Set up output accumulator
    let outputText = '';
    let finalExitCode: number | null = null;

    const jobId = await ExecutionService.runProject(
      id,
      project.container_id,
      cmd,
      (chunk) => { outputText += chunk; },
      (exitCode) => { finalExitCode = exitCode; }
    );

    // If client requested synchronous wait (default 4 seconds for scripts)
    const waitMs = req.body.waitMs !== undefined ? parseInt(req.body.waitMs, 10) : 3500;
    if (waitMs > 0) {
      const start = Date.now();
      while (Date.now() - start < waitMs && finalExitCode === null) {
        await new Promise(r => setTimeout(r, 100));
      }
    }

    const job = ExecutionService.getJob(jobId);

    res.json({
      success: true,
      jobId,
      command: cmd,
      status: job?.status || (finalExitCode !== null ? 'completed' : 'running'),
      exitCode: finalExitCode,
      output: outputText
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Stop running execution job
executionRouter.post('/projects/:id/stop-execution', (req, res) => {
  try {
    const { id } = req.params;
    const { jobId } = req.body;

    if (jobId) {
      const stopped = ExecutionService.stopExecution(jobId);
      return res.json({ success: stopped, jobId });
    }

    // Stop all active jobs for project
    const activeJobs = ExecutionService.getActiveJobsForProject(id);
    for (const j of activeJobs) {
      ExecutionService.stopExecution(j.jobId);
    }

    res.json({ success: true, stoppedCount: activeJobs.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get active execution jobs for project
executionRouter.get('/projects/:id/jobs', (req, res) => {
  try {
    const { id } = req.params;
    const jobs = ExecutionService.getActiveJobsForProject(id);
    res.json(jobs);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
