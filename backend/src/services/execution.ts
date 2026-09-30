import { DockerService } from '../docker/service.js';
import { StorageGuardian } from '../storage/guardian.js';

export interface ExecutionJob {
  jobId: string;
  projectId: string;
  command: string;
  status: 'running' | 'completed' | 'failed' | 'stopped';
  exitCode?: number | null;
  startedAt: string;
  output: string;
}

export class ExecutionService {
  private static activeJobs: Map<string, { job: ExecutionJob; stop: () => void }> = new Map();

  static getJob(jobId: string): ExecutionJob | undefined {
    return this.activeJobs.get(jobId)?.job;
  }

  static getActiveJobsForProject(projectId: string): ExecutionJob[] {
    return Array.from(this.activeJobs.values())
      .filter(item => item.job.projectId === projectId)
      .map(item => item.job);
  }

  /**
   * Executes project code inside Docker container or fallback sandbox
   */
  static async runProject(
    projectId: string,
    containerId: string | null,
    command: string,
    onOutput: (chunk: string) => void,
    onExit: (code: number | null) => void
  ): Promise<string> {
    const jobId = 'exec_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6);
    const workspace = StorageGuardian.getProjectWorkspacePath(projectId);

    const job: ExecutionJob = {
      jobId,
      projectId,
      command,
      status: 'running',
      startedAt: new Date().toISOString(),
      output: ''
    };

    let stopped = false;
    let stopFn = () => { stopped = true; };

    this.activeJobs.set(jobId, {
      job,
      stop: () => stopFn()
    });

    const appendOutput = (text: string) => {
      job.output += text;
      onOutput(text);
    };

    // Check if Docker container is available and running
    let runInDocker = false;
    if (containerId) {
      try {
        const inspect = await DockerService.inspectContainer(containerId);
        if (inspect.State?.Running) {
          runInDocker = true;
        }
      } catch {
        runInDocker = false;
      }
    }

    if (runInDocker && containerId) {
      appendOutput(`\r\n\x1b[36m[CloudBase IDE] Running inside Docker container (${containerId.substring(0, 12)})...\x1b[0m\r\n`);
      appendOutput(`\x1b[90m$ ${command}\x1b[0m\r\n`);

      try {
        const cmdParts = ['/bin/sh', '-c', command];
        const { exec, stream } = await DockerService.createExecSession(containerId, cmdParts, false);

        stopFn = () => {
          stopped = true;
          try {
            stream.destroy();
          } catch {}
        };

        stream.on('data', (chunk: Buffer) => {
          appendOutput(chunk.toString('utf-8'));
        });

        stream.on('end', async () => {
          const inspect = await exec.inspect();
          const exitCode = inspect.ExitCode ?? 0;
          job.status = exitCode === 0 ? 'completed' : 'failed';
          job.exitCode = exitCode;
          appendOutput(`\r\n\x1b[36m[Process exited with code ${exitCode}]\x1b[0m\r\n`);
          onExit(exitCode);
          StorageGuardian.logAudit(projectId, 'CODE_EXECUTION_DOCKER', job.status, `Command: "${command}" Code: ${exitCode}`);
        });

      } catch (err: any) {
        job.status = 'failed';
        appendOutput(`\r\n\x1b[31m[Docker execution error: ${err.message}]\x1b[0m\r\n`);
        onExit(1);
      }

    } else {
      // Fallback sandbox execution (strict workspace boundary)
      appendOutput(`\r\n\x1b[33m[CloudBase IDE] Docker container not active; executing in sandboxed workspace environment...\x1b[0m\r\n`);
      appendOutput(`\x1b[90m$ ${command}\x1b[0m\r\n`);

      const parts = command.trim().split(/\s+/);
      const bin = parts[0];
      const args = parts.slice(1);

      const runner = DockerService.runInLocalSandbox(
        workspace,
        bin,
        args,
        (data) => appendOutput(data),
        (data) => appendOutput(data),
        (code) => {
          job.status = code === 0 ? 'completed' : 'failed';
          job.exitCode = code;
          appendOutput(`\r\n\x1b[36m[Process exited with code ${code ?? 0}]\x1b[0m\r\n`);
          onExit(code);
          StorageGuardian.logAudit(projectId, 'CODE_EXECUTION_SANDBOX', job.status, `Command: "${command}" Code: ${code}`);
        }
      );

      stopFn = () => {
        runner.kill();
        job.status = 'stopped';
        appendOutput('\r\n\x1b[31m[Execution aborted by user]\x1b[0m\r\n');
      };
    }

    return jobId;
  }

  /**
   * Stop an active execution job
   */
  static stopExecution(jobId: string): boolean {
    const item = this.activeJobs.get(jobId);
    if (!item) return false;
    item.stop();
    item.job.status = 'stopped';
    return true;
  }
}
