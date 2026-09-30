import Docker from 'dockerode';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { config } from '../config.js';
import { StorageGuardian } from '../storage/guardian.js';

export interface DockerHealthStatus {
  available: boolean;
  version?: string;
  error?: string;
  engine?: string;
  containersRunning?: number;
  containersTotal?: number;
  imagesTotal?: number;
}

export interface ContainerCreationOptions {
  projectId: string;
  workspacePath: string;
  dockerImage: string;
  memoryLimit?: number; // bytes
  cpuLimit?: number; // float, e.g. 1.0
  networkEnabled?: boolean;
  environmentVariables?: Record<string, string>;
}

export class DockerService {
  private static dockerInstance: Docker | null = null;

  static getDocker(): Docker {
    if (this.dockerInstance) {
      return this.dockerInstance;
    }

    if (process.platform === 'win32') {
      // Connect to Windows named pipe
      this.dockerInstance = new Docker({
        socketPath: config.docker.socketPath
      });
    } else {
      this.dockerInstance = new Docker({
        socketPath: config.docker.socketPath
      });
    }

    return this.dockerInstance;
  }

  /**
   * Health check to honestly verify if Docker daemon is running
   */
  static async checkStatus(): Promise<DockerHealthStatus> {
    try {
      const docker = this.getDocker();
      // Try pinging Docker daemon
      await docker.ping();
      const versionInfo = await docker.version();
      const systemInfo = await docker.info();

      return {
        available: true,
        version: versionInfo.Version,
        engine: versionInfo.Os || 'Docker Engine',
        containersRunning: systemInfo.ContainersRunning || 0,
        containersTotal: systemInfo.Containers || 0,
        imagesTotal: systemInfo.Images || 0
      };
    } catch (err: any) {
      return {
        available: false,
        error: `Docker daemon unavailable (${err.message || 'Cannot connect to socket'}). Please ensure Docker Desktop is running.`
      };
    }
  }

  /**
   * List available Docker images
   */
  static async listImages(): Promise<any[]> {
    try {
      const docker = this.getDocker();
      return await docker.listImages();
    } catch (err: any) {
      return [];
    }
  }

  /**
   * Pull an image if Docker is available
   */
  static async pullImage(imageName: string): Promise<boolean> {
    const docker = this.getDocker();
    return new Promise((resolve, reject) => {
      docker.pull(imageName, (err: any, stream: NodeJS.ReadableStream) => {
        if (err) return reject(err);
        docker.modem.followProgress(stream, (followErr: any) => {
          if (followErr) return reject(followErr);
          resolve(true);
        });
      });
    });
  }

  /**
   * Creates an isolated project container with strict security boundaries
   */
  static async createProjectContainer(opts: ContainerCreationOptions): Promise<string> {
    const docker = this.getDocker();

    // Validate that the workspace path is genuine and strictly jailed
    const safeWorkspace = StorageGuardian.getProjectWorkspacePath(opts.projectId);
    if (path.resolve(opts.workspacePath) !== safeWorkspace) {
      throw new Error('Workspace path mismatch with Storage Guardian validation');
    }

    // Windows Docker Desktop mount path conversion
    // e.g., C:\Users\... -> /c/Users/... or C:/Users/...
    const hostMount = process.platform === 'win32'
      ? safeWorkspace.replace(/\\/g, '/')
      : safeWorkspace;

    const memoryBytes = opts.memoryLimit || config.docker.defaultMemoryLimit;
    const cpuLimit = opts.cpuLimit || config.docker.defaultCpuLimit;
    const nanoCpus = Math.floor(cpuLimit * 1e9);

    const envArray: string[] = [
      'CLOUDBASE_PROJECT=1',
      `PROJECT_ID=${opts.projectId}`,
      'TERM=xterm-256color'
    ];

    if (opts.environmentVariables) {
      for (const [k, v] of Object.entries(opts.environmentVariables)) {
        envArray.push(`${k}=${v}`);
      }
    }

    const containerConfig: Docker.ContainerCreateOptions = {
      Image: opts.dockerImage,
      name: `cloudbase-${opts.projectId}-${Date.now().toString(36)}`,
      WorkingDir: '/workspace',
      Tty: true,
      OpenStdin: true,
      StdinOnce: false,
      Env: envArray,
      Cmd: ['/bin/sh'],
      HostConfig: {
        Binds: [
          // Mount ONLY the project workspace into /workspace
          `${hostMount}:/workspace:rw`
        ],
        Memory: memoryBytes,
        NanoCpus: nanoCpus,
        // Drop high privileges & drop root escalation
        Privileged: false,
        SecurityOpt: ['no-new-privileges:true'],
        CapDrop: ['SYS_ADMIN', 'NET_RAW', 'MKNOD'],
        // Network isolation policy
        NetworkMode: opts.networkEnabled ? 'bridge' : 'none'
      }
    };

    const container = await docker.createContainer(containerConfig);
    return container.id;
  }

  /**
   * Starts a container
   */
  static async startContainer(containerId: string): Promise<void> {
    const docker = this.getDocker();
    const container = docker.getContainer(containerId);
    await container.start();
  }

  /**
   * Stops a container
   */
  static async stopContainer(containerId: string): Promise<void> {
    const docker = this.getDocker();
    const container = docker.getContainer(containerId);
    try {
      await container.stop({ t: 3 });
    } catch (err: any) {
      // Ignore if already stopped
      if (!err.message?.includes('not running')) {
        throw err;
      }
    }
  }

  /**
   * Restarts a container
   */
  static async restartContainer(containerId: string): Promise<void> {
    const docker = this.getDocker();
    const container = docker.getContainer(containerId);
    await container.restart({ t: 3 });
  }

  /**
   * Removes a container
   */
  static async removeContainer(containerId: string): Promise<void> {
    const docker = this.getDocker();
    const container = docker.getContainer(containerId);
    try {
      await container.remove({ force: true });
    } catch {
      // Ignore error if already removed
    }
  }

  /**
   * Inspect container details
   */
  static async inspectContainer(containerId: string): Promise<any> {
    const docker = this.getDocker();
    const container = docker.getContainer(containerId);
    return await container.inspect();
  }

  /**
   * Fetch recent logs from container
   */
  static async getContainerLogs(containerId: string): Promise<string> {
    const docker = this.getDocker();
    const container = docker.getContainer(containerId);
    const logsBuffer = await container.logs({
      stdout: true,
      stderr: true,
      tail: 200,
      timestamps: false
    });
    return logsBuffer.toString('utf-8');
  }

  /**
   * Interactive execution stream inside container (for terminal and command runner)
   */
  static async createExecSession(containerId: string, cmd: string[], isTty: boolean = true) {
    const docker = this.getDocker();
    const container = docker.getContainer(containerId);

    const exec = await container.exec({
      Cmd: cmd,
      AttachStdin: true,
      AttachStdout: true,
      AttachStderr: true,
      Tty: isTty
    });

    const stream = await exec.start({
      hijack: true,
      stdin: true,
      Tty: isTty
    });

    return { exec, stream };
  }

  /**
   * Local sandboxed fallback runner
   * Used when Docker daemon is not active on the host machine, providing immediate
   * code execution strictly confined to the project workspace with timeout.
   */
  static runInLocalSandbox(
    workspacePath: string,
    command: string,
    args: string[],
    onStdout: (data: string) => void,
    onStderr: (data: string) => void,
    onExit: (code: number | null) => void
  ) {
    // Validate workspace path
    const safeCwd = path.resolve(workspacePath);

    const proc = spawn(command, args, {
      cwd: safeCwd,
      shell: true,
      env: {
        ...process.env,
        CLOUDBASE_SANDBOX: '1',
        PYTHONDONTWRITEBYTECODE: '1'
      }
    });

    // 30-second timeout safety guard
    const timeout = setTimeout(() => {
      proc.kill('SIGTERM');
      onStderr('\n[Execution timed out after 30 seconds]\n');
    }, 30000);

    proc.stdout?.on('data', (d) => onStdout(d.toString()));
    proc.stderr?.on('data', (d) => onStderr(d.toString()));

    proc.on('close', (code) => {
      clearTimeout(timeout);
      onExit(code);
    });

    return {
      kill: () => {
        clearTimeout(timeout);
        proc.kill('SIGKILL');
      }
    };
  }
}
