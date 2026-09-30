import { Server, Socket } from 'socket.io';
import { spawn, ChildProcess } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import { DockerService } from '../docker/service.js';
import { StorageGuardian } from '../storage/guardian.js';
import { getDatabase } from '../database/index.js';

interface TerminalSession {
  socketId: string;
  projectId: string;
  cleanUp: () => void;
  write?: (data: string) => void;
}

/**
 * Interactive workspace shell runner that provides full interactive command execution,
 * character echo, backspace, command history, real-time output, and Ctrl+C cancellation.
 */
class InteractiveWorkspaceShell {
  private socket: Socket;
  private projectId: string;
  private workspaceRoot: string;
  private currentDir: string;
  private inputBuffer: string = '';
  private history: string[] = [];
  private historyIndex: number = -1;
  private activeProcess: ChildProcess | null = null;

  constructor(socket: Socket, projectId: string, workspaceRoot: string) {
    this.socket = socket;
    this.projectId = projectId;
    this.workspaceRoot = path.resolve(workspaceRoot);
    this.currentDir = this.workspaceRoot;
  }

  public start() {
    this.socket.emit(
      'terminal:data',
      `\r\n\x1b[36m⚡ CloudBase IDE Interactive Terminal Active\x1b[0m\r\n` +
      `\x1b[90mType any command (e.g. "python main.py", "node index.js", "dir", "help")\x1b[0m\r\n` +
      `\x1b[90mWorkspace: ${this.workspaceRoot}\x1b[0m\r\n\r\n` +
      this.getPrompt()
    );
  }

  public getPrompt(): string {
    const rel = path.relative(this.workspaceRoot, this.currentDir);
    const displayPath = rel ? `/${rel.replace(/\\/g, '/')}` : '/workspace';
    return `\x1b[32mcloudbase\x1b[0m:\x1b[34m${displayPath}\x1b[0m$ `;
  }

  public handleInput(data: string) {
    // If a program is currently running (interactive input to process)
    if (this.activeProcess) {
      if (data === '\x03') {
        // Ctrl+C: Kill active running process
        this.activeProcess.kill('SIGINT');
        try {
          if (process.platform === 'win32' && this.activeProcess.pid) {
            spawn('taskkill', ['/pid', this.activeProcess.pid.toString(), '/T', '/F']);
          }
        } catch {}
        this.socket.emit('terminal:data', '^C\r\n\x1b[31m[Process interrupted]\x1b[0m\r\n' + this.getPrompt());
        this.activeProcess = null;
        return;
      }

      // Pass input directly to the running process
      if (this.activeProcess.stdin && !this.activeProcess.stdin.destroyed) {
        this.activeProcess.stdin.write(data);
        this.socket.emit('terminal:data', data.replace(/\r?\n/g, '\r\n'));
      }
      return;
    }

    // Escape sequences (arrows)
    if (data === '\x1b[A') {
      if (this.history.length > 0) {
        if (this.historyIndex === -1) {
          this.historyIndex = this.history.length - 1;
        } else if (this.historyIndex > 0) {
          this.historyIndex--;
        }
        this.replaceInputLine(this.history[this.historyIndex]);
      }
      return;
    }

    if (data === '\x1b[B') {
      if (this.historyIndex !== -1) {
        if (this.historyIndex < this.history.length - 1) {
          this.historyIndex++;
          this.replaceInputLine(this.history[this.historyIndex]);
        } else {
          this.historyIndex = -1;
          this.replaceInputLine('');
        }
      }
      return;
    }

    // Process characters in data stream
    for (let i = 0; i < data.length; i++) {
      const ch = data[i];

      if (ch === '\r' || ch === '\n') {
        this.socket.emit('terminal:data', '\r\n');
        const cmd = this.inputBuffer.trim();
        this.inputBuffer = '';
        this.historyIndex = -1;

        if (cmd) {
          this.history.push(cmd);
          if (this.history.length > 50) this.history.shift();
          this.executeCommand(cmd);
        } else {
          this.socket.emit('terminal:data', this.getPrompt());
        }
        return;
      } else if (ch === '\x7f' || ch === '\b') {
        if (this.inputBuffer.length > 0) {
          this.inputBuffer = this.inputBuffer.slice(0, -1);
          this.socket.emit('terminal:data', '\b \b');
        }
      } else if (ch === '\x03') {
        this.inputBuffer = '';
        this.socket.emit('terminal:data', '^C\r\n' + this.getPrompt());
      } else if (ch === '\t') {
        this.handleTabCompletion();
      } else if (ch >= ' ') {
        this.inputBuffer += ch;
        this.socket.emit('terminal:data', ch);
      }
    }
  }

  private replaceInputLine(newContent: string) {
    // Erase current line
    const backspaces = '\b \b'.repeat(this.inputBuffer.length);
    this.socket.emit('terminal:data', backspaces + newContent);
    this.inputBuffer = newContent;
  }

  private handleTabCompletion() {
    try {
      const parts = this.inputBuffer.split(/\s+/);
      const lastToken = parts[parts.length - 1] || '';
      const files = fs.readdirSync(this.currentDir);
      const matches = files.filter(f => f.toLowerCase().startsWith(lastToken.toLowerCase()));

      if (matches.length === 1) {
        const completion = matches[0].slice(lastToken.length);
        this.inputBuffer += completion;
        this.socket.emit('terminal:data', completion);
      } else if (matches.length > 1) {
        this.socket.emit('terminal:data', '\r\n' + matches.join('  ') + '\r\n' + this.getPrompt() + this.inputBuffer);
      }
    } catch {}
  }

  private executeCommand(cmd: string) {
    const parts = cmd.split(/\s+/);
    const primary = parts[0].toLowerCase();

    // 1. Built-in: clear / cls
    if (primary === 'clear' || primary === 'cls') {
      this.socket.emit('terminal:data', '\x1b[2J\x1b[H' + this.getPrompt());
      return;
    }

    // 2. Built-in: help
    if (primary === 'help') {
      this.socket.emit(
        'terminal:data',
        `\r\n\x1b[36mCloudBase IDE Terminal Commands:\x1b[0m\r\n` +
        `  python <file>       Run Python program (e.g. python main.py)\r\n` +
        `  node <file>         Run Node.js program (e.g. node index.js)\r\n` +
        `  pip <args>          Install/manage Python packages\r\n` +
        `  npm <args>          Install/manage Node packages\r\n` +
        `  dir / ls            List files in current directory\r\n` +
        `  cd <folder>         Change directory (confined to workspace)\r\n` +
        `  pwd                 Print current working directory\r\n` +
        `  run                 Run the project's primary program\r\n` +
        `  clear               Clear the terminal screen\r\n\r\n` +
        this.getPrompt()
      );
      return;
    }

    // 3. Built-in: pwd
    if (primary === 'pwd') {
      this.socket.emit('terminal:data', `${this.currentDir}\r\n` + this.getPrompt());
      return;
    }

    // 4. Built-in: run (auto-detect entry file)
    if (primary === 'run') {
      if (fs.existsSync(path.join(this.workspaceRoot, 'main.py'))) {
        cmd = 'python main.py';
      } else if (fs.existsSync(path.join(this.workspaceRoot, 'index.js'))) {
        cmd = 'node index.js';
      } else if (fs.existsSync(path.join(this.workspaceRoot, 'package.json'))) {
        cmd = 'npm start';
      } else {
        this.socket.emit('terminal:data', 'No runnable entry file detected (main.py, index.js).\r\n' + this.getPrompt());
        return;
      }
    }

    // 5. Built-in: cd
    if (primary === 'cd') {
      const target = parts[1] || '';
      if (!target || target === '~' || target === '/') {
        this.currentDir = this.workspaceRoot;
      } else {
        try {
          const resolved = StorageGuardian.resolveSafeFilePath(this.workspaceRoot, path.relative(this.workspaceRoot, path.resolve(this.currentDir, target)));
          if (fs.existsSync(resolved) && fs.statSync(resolved).isDirectory()) {
            this.currentDir = resolved;
          } else {
            this.socket.emit('terminal:data', `cd: no such directory: ${target}\r\n`);
          }
        } catch {
          this.socket.emit('terminal:data', `cd: access denied: cannot navigate outside workspace\r\n`);
        }
      }
      this.socket.emit('terminal:data', this.getPrompt());
      return;
    }

    // 6. Built-in: ls (cross-platform formatted directory listing)
    if (primary === 'ls') {
      try {
        const entries = fs.readdirSync(this.currentDir, { withFileTypes: true });
        if (entries.length === 0) {
          this.socket.emit('terminal:data', '\x1b[90m(directory is empty)\x1b[0m\r\n' + this.getPrompt());
          return;
        }
        const lines: string[] = [];
        for (const entry of entries) {
          if (entry.isDirectory()) {
            lines.push(`\x1b[1;34m${entry.name}/\x1b[0m`);
          } else {
            const stats = fs.statSync(path.join(this.currentDir, entry.name));
            lines.push(`\x1b[37m${entry.name}\x1b[0m \x1b[90m(${stats.size} B)\x1b[0m`);
          }
        }
        this.socket.emit('terminal:data', lines.join('  ') + '\r\n' + this.getPrompt());
        return;
      } catch (err: any) {
        this.socket.emit('terminal:data', `ls: error reading directory: ${err.message}\r\n` + this.getPrompt());
        return;
      }
    }

    // 7. Built-in: cat (display file contents within workspace)
    if (primary === 'cat') {
      const target = parts[1];
      if (!target) {
        this.socket.emit('terminal:data', 'cat: missing filename argument\r\n' + this.getPrompt());
        return;
      }
      try {
        const filePath = StorageGuardian.resolveSafeFilePath(this.workspaceRoot, path.relative(this.workspaceRoot, path.resolve(this.currentDir, target)));
        if (!fs.existsSync(filePath)) {
          this.socket.emit('terminal:data', `cat: ${target}: No such file\r\n` + this.getPrompt());
          return;
        }
        const content = fs.readFileSync(filePath, 'utf-8').replace(/\r?\n/g, '\r\n');
        this.socket.emit('terminal:data', content + '\r\n' + this.getPrompt());
        return;
      } catch {
        this.socket.emit('terminal:data', `cat: access denied: cannot access file outside workspace\r\n` + this.getPrompt());
        return;
      }
    }

    // 8. Built-in: touch (create empty file within workspace)
    if (primary === 'touch') {
      const target = parts[1];
      if (!target) {
        this.socket.emit('terminal:data', 'touch: missing file name\r\n' + this.getPrompt());
        return;
      }
      try {
        const filePath = StorageGuardian.resolveSafeFilePath(this.workspaceRoot, path.relative(this.workspaceRoot, path.resolve(this.currentDir, target)));
        if (!fs.existsSync(filePath)) {
          fs.writeFileSync(filePath, '', 'utf-8');
        } else {
          const now = new Date();
          fs.utimesSync(filePath, now, now);
        }
        this.socket.emit('terminal:data', this.getPrompt());
        return;
      } catch {
        this.socket.emit('terminal:data', `touch: access denied: cannot touch file outside workspace\r\n` + this.getPrompt());
        return;
      }
    }

    // 9. Built-in: rm (delete file within workspace)
    if (primary === 'rm') {
      const target = parts[1];
      if (!target) {
        this.socket.emit('terminal:data', 'rm: missing file argument\r\n' + this.getPrompt());
        return;
      }
      try {
        const filePath = StorageGuardian.resolveSafeFilePath(this.workspaceRoot, path.relative(this.workspaceRoot, path.resolve(this.currentDir, target)));
        if (!fs.existsSync(filePath)) {
          this.socket.emit('terminal:data', `rm: cannot remove '${target}': No such file\r\n` + this.getPrompt());
          return;
        }
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
          fs.rmSync(filePath, { recursive: true, force: true });
        } else {
          fs.unlinkSync(filePath);
        }
        this.socket.emit('terminal:data', this.getPrompt());
        return;
      } catch {
        this.socket.emit('terminal:data', `rm: access denied: cannot remove outside workspace\r\n` + this.getPrompt());
        return;
      }
    }

    // 10. External program execution in workspace
    try {
      this.activeProcess = spawn(cmd, {
        cwd: this.currentDir,
        shell: true,
        env: {
          ...process.env,
          CLOUDBASE_TERMINAL: '1',
          PYTHONUNBUFFERED: '1',
          PYTHONDONTWRITEBYTECODE: '1',
          FORCE_COLOR: '1'
        }
      });

      this.activeProcess.stdout?.on('data', (d: Buffer) => {
        // Ensure proper CRLF for xterm
        const text = d.toString('utf-8').replace(/\r?\n/g, '\r\n');
        this.socket.emit('terminal:data', text);
      });

      this.activeProcess.stderr?.on('data', (d: Buffer) => {
        const text = d.toString('utf-8').replace(/\r?\n/g, '\r\n');
        this.socket.emit('terminal:data', text);
      });

      this.activeProcess.on('close', (code: number | null) => {
        this.activeProcess = null;
        if (code !== 0 && code !== null) {
          this.socket.emit('terminal:data', `\r\n\x1b[90m[Process exited with code ${code}]\x1b[0m\r\n`);
        }
        this.socket.emit('terminal:data', this.getPrompt());
      });

      this.activeProcess.on('error', (err: any) => {
        this.activeProcess = null;
        this.socket.emit('terminal:data', `\r\n\x1b[31m[Execution error: ${err.message}]\x1b[0m\r\n` + this.getPrompt());
      });

    } catch (err: any) {
      this.socket.emit('terminal:data', `\r\n\x1b[31m[Failed to run: ${err.message}]\x1b[0m\r\n` + this.getPrompt());
    }
  }

  public dispose() {
    if (this.activeProcess) {
      try {
        this.activeProcess.kill('SIGKILL');
      } catch {}
      this.activeProcess = null;
    }
  }
}

export class TerminalManager {
  private static sessions: Map<string, TerminalSession> = new Map();

  static register(io: Server) {
    io.on('connection', (socket: Socket) => {
      socket.on('terminal:init', async (data: { projectId: string; cols?: number; rows?: number }) => {
        const { projectId } = data;
        if (!projectId) {
          socket.emit('terminal:data', '\r\n\x1b[31m[Error: Missing projectId]\x1b[0m\r\n');
          return;
        }

        this.terminateSession(socket.id);

        try {
          const workspace = StorageGuardian.getProjectWorkspacePath(projectId);
          const db = getDatabase();
          const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(projectId) as any;

          if (!project) {
            socket.emit('terminal:data', `\r\n\x1b[31m[Project "${projectId}" not found]\x1b[0m\r\n`);
            return;
          }

          let attachedToDocker = false;
          if (project.container_id) {
            try {
              const inspect = await DockerService.inspectContainer(project.container_id);
              if (inspect.State?.Running) {
                const { stream } = await DockerService.createExecSession(
                  project.container_id,
                  ['/bin/sh'],
                  true
                );

                attachedToDocker = true;
                socket.emit('terminal:data', `\r\n\x1b[36m⚡ Connected to Docker Container [${project.container_id.substring(0, 10)}]\x1b[0m\r\n`);
                socket.emit('terminal:data', `\x1b[90mWorkspace: /workspace\x1b[0m\r\n\r\n`);

                stream.on('data', (chunk: Buffer) => {
                  socket.emit('terminal:data', chunk.toString('utf-8'));
                });

                stream.on('end', () => {
                  socket.emit('terminal:data', '\r\n\x1b[33m[Container terminal session ended]\x1b[0m\r\n');
                });

                this.sessions.set(socket.id, {
                  socketId: socket.id,
                  projectId,
                  write: (d) => stream.write(d),
                  cleanUp: () => {
                    try { stream.destroy(); } catch {}
                  }
                });
              }
            } catch {
              attachedToDocker = false;
            }
          }

          if (!attachedToDocker) {
            // Interactive Workspace Shell
            const shell = new InteractiveWorkspaceShell(socket, projectId, workspace);
            shell.start();

            this.sessions.set(socket.id, {
              socketId: socket.id,
              projectId,
              write: (d) => shell.handleInput(d),
              cleanUp: () => shell.dispose()
            });
          }
        } catch (err: any) {
          socket.emit('terminal:data', `\r\n\x1b[31m[Failed to initialize terminal: ${err.message}]\x1b[0m\r\n`);
        }
      });

      socket.on('terminal:input', (data: { data: string }) => {
        const session = this.sessions.get(socket.id);
        if (session && session.write) {
          session.write(data.data);
        }
      });

      socket.on('disconnect', () => {
        this.terminateSession(socket.id);
      });
    });
  }

  private static terminateSession(socketId: string) {
    const session = this.sessions.get(socketId);
    if (session) {
      session.cleanUp();
      this.sessions.delete(socketId);
    }
  }
}
