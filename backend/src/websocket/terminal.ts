import { Server, Socket } from 'socket.io';
import { spawn, spawnSync, ChildProcess } from 'node:child_process';
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
  run?: (command?: string, filePath?: string) => void;
}

/**
 * Execute code via Wandbox Cloud Compiler API (supports C, C++, Java, Python, Go, Rust, Ruby, PHP).
 * Used when local compiler is missing on host OS (e.g. gcc/javac on Windows without MinGW).
 * Falls back immediately to offline instructions if disconnected from the internet.
 */
async function runViaCloudCompiler(
  compiler: string,
  code: string,
  socket: Socket,
  getPrompt: () => string
): Promise<void> {
  const langName = compiler.split('-')[0].toUpperCase();
  socket.emit('terminal:data', `\x1b[90m[Checking runtime for ${langName}...]\x1b[0m\r\n`);
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);

    const res = await fetch('https://wandbox.org/api/compile.json', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ compiler, code }),
      signal: controller.signal
    });
    clearTimeout(timeout);

    if (!res.ok) {
      throw new Error(`Compiler service returned HTTP ${res.status}`);
    }

    const data: any = await res.json();

    if (data.compiler_error) {
      socket.emit('terminal:data', `\x1b[31m${data.compiler_error.replace(/\r?\n/g, '\r\n')}\x1b[0m\r\n`);
    }
    if (data.program_output) {
      socket.emit('terminal:data', data.program_output.replace(/\r?\n/g, '\r\n'));
      if (!data.program_output.endsWith('\n')) {
        socket.emit('terminal:data', '\r\n');
      }
    }
    if (data.program_error) {
      socket.emit('terminal:data', `\x1b[31m${data.program_error.replace(/\r?\n/g, '\r\n')}\x1b[0m\r\n`);
    }

    const codeExit = data.status;
    if (codeExit === 0 || codeExit === '0') {
      socket.emit('terminal:data', `\x1b[32m[✓ Finished]\x1b[0m\r\n`);
    } else if (codeExit !== undefined) {
      socket.emit('terminal:data', `\x1b[90m[Process exited with code ${codeExit}]\x1b[0m\r\n`);
    }
  } catch (err: any) {
    socket.emit('terminal:data',
      `\x1b[33m[Offline Mode] Host compiler for ${langName} is not installed on this system.\x1b[0m\r\n` +
      `\x1b[90m▶ To run ${langName} completely offline:\x1b[0m\r\n` +
      `\x1b[90m  • Install ${langName} locally (e.g. MinGW/GCC for C/C++, JDK for Java, Python, Go)\x1b[0m\r\n` +
      `\x1b[90m  • Or launch the project Docker container in CloudBase IDE\x1b[0m\r\n`
    );
  }
  socket.emit('terminal:data', getPrompt());
}

/**
 * Interactive workspace shell runner with full multi-language code execution support.
 * Supports: Python, Node.js, Java, C, C++, Go, Rust, Ruby, PHP, TypeScript, and inline code snippets.
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
      `\r\n\x1b[36m⚡ CloudBase IDE Multi-Language Terminal\x1b[0m\r\n` +
      `\x1b[90m▶ Write code in editor & click "Run Code" (or press Ctrl+Enter)\x1b[0m\r\n` +
      `\x1b[90m▶ Or type commands directly: "python main.py", "run hello.c", "run Main.java"\x1b[0m\r\n` +
      `\x1b[90m▶ Or type code snippets: print("hello"), console.log("hi"), printf("hello\\n")\x1b[0m\r\n` +
      `\x1b[90mWorkspace: ${this.workspaceRoot}\x1b[0m\r\n\r\n` +
      this.getPrompt()
    );
  }

  public getPrompt(): string {
    const rel = path.relative(this.workspaceRoot, this.currentDir);
    const displayPath = rel ? `/${rel.replace(/\\/g, '/')}` : '/workspace';
    return `\x1b[32mcloudbase\x1b[0m:\x1b[34m${displayPath}\x1b[0m$ `;
  }

  /**
   * Run a command triggered by the IDE Run button or shortcut
   */
  public runTrigger(command?: string, filePath?: string) {
    // If a process is currently running, interrupt it
    if (this.activeProcess) {
      try {
        this.activeProcess.kill('SIGINT');
        if (process.platform === 'win32' && this.activeProcess.pid) {
          spawn('taskkill', ['/pid', this.activeProcess.pid.toString(), '/T', '/F']);
        }
      } catch {}
      this.activeProcess = null;
    }

    const cmdToRun = command || (filePath ? `run ${filePath}` : 'run');
    this.socket.emit('terminal:data', `\r\n\x1b[36m$ ${cmdToRun}\x1b[0m\r\n`);
    this.executeCommand(cmdToRun, filePath);
  }

  public handleInput(data: string) {
    // If a program is currently running, forward input to it
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
      if (this.activeProcess.stdin && !this.activeProcess.stdin.destroyed) {
        this.activeProcess.stdin.write(data);
        this.socket.emit('terminal:data', data.replace(/\r?\n/g, '\r\n'));
      }
      return;
    }

    // Arrow Up
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

    // Arrow Down
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

    // Process characters
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

  /**
   * Find runnable file in workspace root
   */
  private detectEntryFile(): string | null {
    const w = this.workspaceRoot;
    const candidates = [
      'main.py', 'app.py', 'index.py',
      'main.js', 'index.js', 'app.js',
      'Main.java', 'main.java', 'App.java',
      'main.c', 'app.c',
      'main.cpp', 'app.cpp',
      'main.go', 'main.rs',
      'main.rb', 'main.php',
      'main.ts', 'index.ts'
    ];

    for (const file of candidates) {
      if (fs.existsSync(path.join(w, file))) {
        return file;
      }
    }

    try {
      const entries = fs.readdirSync(w);
      const exts = ['.py', '.js', '.c', '.cpp', '.java', '.go', '.rs', '.rb', '.php', '.ts'];
      for (const ext of exts) {
        const match = entries.find(e => e.endsWith(ext));
        if (match) return match;
      }
    } catch {}

    return null;
  }

  private executeCommand(cmd: string, activeFilePath?: string) {
    const trimmed = cmd.trim();
    const parts = trimmed.split(/\s+/);
    const primary = parts[0].toLowerCase();

    // ─── 1. clear / cls ───
    if (primary === 'clear' || primary === 'cls') {
      this.socket.emit('terminal:data', '\x1b[2J\x1b[H' + this.getPrompt());
      return;
    }

    // ─── 2. help ───
    if (primary === 'help') {
      this.socket.emit('terminal:data',
        `\r\n\x1b[36m╔═════════════════════════════════════════════════════════╗\x1b[0m\r\n` +
        `\x1b[36m║   CloudBase IDE Terminal — Any Language Execution       ║\x1b[0m\r\n` +
        `\x1b[36m╚═════════════════════════════════════════════════════════╝\x1b[0m\r\n\r\n` +
        `\x1b[33m▶ Run Current File / Project:\x1b[0m\r\n` +
        `  \x1b[32mrun\x1b[0m                    Auto-run the active file or entry file\r\n` +
        `  \x1b[32mrun <filename>\x1b[0m         Run any file (e.g. run hello.c, run main.py)\r\n\r\n` +
        `\x1b[33m▶ Direct Language Commands:\x1b[0m\r\n` +
        `  \x1b[32mpython main.py\x1b[0m         Python 🐍\r\n` +
        `  \x1b[32mnode index.js\x1b[0m          JavaScript / Node.js ⚡\r\n` +
        `  \x1b[32mgcc main.c && .\\a\x1b[0m      C\r\n` +
        `  \x1b[32mg++ main.cpp && .\\a\x1b[0m    C++\r\n` +
        `  \x1b[32mjava Main.java\x1b[0m         Java ☕\r\n` +
        `  \x1b[32mgo run main.go\x1b[0m         Go\r\n` +
        `  \x1b[32mnpx ts-node main.ts\x1b[0m    TypeScript\r\n\r\n` +
        `\x1b[33m▶ Direct Code Snippets (type code right into terminal!):\x1b[0m\r\n` +
        `  \x1b[32mprint("hello ")\x1b[0m        Executes Python code\r\n` +
        `  \x1b[32mconsole.log("hello ")\x1b[0m  Executes JavaScript code\r\n` +
        `  \x1b[32mprintf("hello \\n")\x1b[0m     Executes C code\r\n` +
        `  \x1b[32mSystem.out.println("hello ")\x1b[0m Executes Java code\r\n\r\n` +
        `\x1b[33m▶ Workspace Navigation:\x1b[0m\r\n` +
        `  \x1b[32mls\x1b[0m | \x1b[32mcd <dir>\x1b[0m | \x1b[32mpwd\x1b[0m | \x1b[32mcat <file>\x1b[0m | \x1b[32mtouch <file>\x1b[0m | \x1b[32mrm <file>\x1b[0m\r\n\r\n` +
        `\x1b[90mTip: Press Ctrl+Enter in editor or click "Run Code" above!\x1b[0m\r\n\r\n` +
        this.getPrompt()
      );
      return;
    }

    // ─── 3. pwd ───
    if (primary === 'pwd') {
      this.socket.emit('terminal:data', `${this.currentDir}\r\n` + this.getPrompt());
      return;
    }

    // ─── 4. cd ───
    if (primary === 'cd') {
      const target = parts[1] || '';
      if (!target || target === '~' || target === '/') {
        this.currentDir = this.workspaceRoot;
      } else {
        try {
          const resolved = StorageGuardian.resolveSafeFilePath(
            this.workspaceRoot,
            path.relative(this.workspaceRoot, path.resolve(this.currentDir, target))
          );
          if (fs.existsSync(resolved) && fs.statSync(resolved).isDirectory()) {
            this.currentDir = resolved;
          } else {
            this.socket.emit('terminal:data', `cd: no such directory: ${target}\r\n`);
          }
        } catch {
          this.socket.emit('terminal:data', `cd: access denied\r\n`);
        }
      }
      this.socket.emit('terminal:data', this.getPrompt());
      return;
    }

    // ─── 5. ls / dir ───
    if (primary === 'ls' || primary === 'dir') {
      try {
        const entries = fs.readdirSync(this.currentDir, { withFileTypes: true });
        if (entries.length === 0) {
          this.socket.emit('terminal:data', '\x1b[90m(empty directory)\x1b[0m\r\n' + this.getPrompt());
          return;
        }
        const lines: string[] = [];
        for (const entry of entries) {
          if (entry.isDirectory()) {
            lines.push(`\x1b[1;34m${entry.name}/\x1b[0m`);
          } else {
            const stats = fs.statSync(path.join(this.currentDir, entry.name));
            lines.push(`\x1b[37m${entry.name}\x1b[0m\x1b[90m (${stats.size}B)\x1b[0m`);
          }
        }
        this.socket.emit('terminal:data', lines.join('  ') + '\r\n' + this.getPrompt());
      } catch (err: any) {
        this.socket.emit('terminal:data', `Error: ${err.message}\r\n` + this.getPrompt());
      }
      return;
    }

    // ─── 6. cat ───
    if (primary === 'cat') {
      const target = parts[1];
      if (!target) {
        this.socket.emit('terminal:data', 'cat: missing filename\r\n' + this.getPrompt());
        return;
      }
      try {
        const filePath = StorageGuardian.resolveSafeFilePath(
          this.workspaceRoot,
          path.relative(this.workspaceRoot, path.resolve(this.currentDir, target))
        );
        if (!fs.existsSync(filePath)) {
          this.socket.emit('terminal:data', `cat: ${target}: No such file\r\n` + this.getPrompt());
          return;
        }
        const content = fs.readFileSync(filePath, 'utf-8').replace(/\r?\n/g, '\r\n');
        this.socket.emit('terminal:data', content + '\r\n' + this.getPrompt());
      } catch {
        this.socket.emit('terminal:data', `cat: access denied\r\n` + this.getPrompt());
      }
      return;
    }

    // ─── 7. touch ───
    if (primary === 'touch') {
      const target = parts[1];
      if (!target) {
        this.socket.emit('terminal:data', 'touch: missing filename\r\n' + this.getPrompt());
        return;
      }
      try {
        const filePath = StorageGuardian.resolveSafeFilePath(
          this.workspaceRoot,
          path.relative(this.workspaceRoot, path.resolve(this.currentDir, target))
        );
        if (!fs.existsSync(filePath)) {
          fs.writeFileSync(filePath, '', 'utf-8');
        } else {
          const now = new Date();
          fs.utimesSync(filePath, now, now);
        }
        this.socket.emit('terminal:data', this.getPrompt());
      } catch {
        this.socket.emit('terminal:data', `touch: access denied\r\n` + this.getPrompt());
      }
      return;
    }

    // ─── 8. rm ───
    if (primary === 'rm') {
      const target = parts[1];
      if (!target) {
        this.socket.emit('terminal:data', 'rm: missing filename\r\n' + this.getPrompt());
        return;
      }
      try {
        const filePath = StorageGuardian.resolveSafeFilePath(
          this.workspaceRoot,
          path.relative(this.workspaceRoot, path.resolve(this.currentDir, target))
        );
        if (!fs.existsSync(filePath)) {
          this.socket.emit('terminal:data', `rm: ${target}: No such file\r\n` + this.getPrompt());
          return;
        }
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
          fs.rmSync(filePath, { recursive: true, force: true });
        } else {
          fs.unlinkSync(filePath);
        }
        this.socket.emit('terminal:data', this.getPrompt());
      } catch {
        this.socket.emit('terminal:data', `rm: access denied\r\n` + this.getPrompt());
      }
      return;
    }

    // ─── 9. DIRECT INLINE CODE SNIPPETS (print("hello"), console.log(...), etc.) ───

    // Python snippet: print(...) or print "..."
    if (/^print\s*\(/.test(trimmed) || /^print\s+['"]/.test(trimmed)) {
      this.runProcessOrCloud(this.getPythonBinary(), ['-c', trimmed], 'cpython-head', trimmed);
      return;
    }

    // JavaScript snippet: console.log(...) or console.warn(...) etc.
    if (/^console\.\w+\s*\(/.test(trimmed)) {
      this.runLocalProcess('node', ['-e', trimmed]);
      return;
    }

    // C snippet: printf(...) or #include
    if (/^printf\s*\(/.test(trimmed) || trimmed.startsWith('#include')) {
      const cCode = trimmed.includes('main(')
        ? trimmed
        : `#include <stdio.h>\nint main() {\n    ${trimmed.endsWith(';') ? trimmed : trimmed + ';'}\n    return 0;\n}`;
      this.executeCodeInAnyLanguage('c', cCode);
      return;
    }

    // Java snippet: System.out.println(...)
    if (/^System\.out\.\w+\s*\(/.test(trimmed)) {
      const javaCode = `class Main {\n    public static void main(String[] args) {\n        ${trimmed.endsWith(';') ? trimmed : trimmed + ';'}\n    }\n}`;
      this.executeCodeInAnyLanguage('java', javaCode);
      return;
    }

    // ─── 10. SMART "run" / "run <file>" COMMAND ───
    if (primary === 'run') {
      let targetFile = parts[1];
      if (!targetFile) {
        // Use active file from editor or auto-detect
        if (activeFilePath) {
          targetFile = path.basename(activeFilePath);
        } else {
          targetFile = this.detectEntryFile() || '';
        }
      }

      if (!targetFile) {
        this.socket.emit('terminal:data',
          `\x1b[33mNo runnable file found in workspace.\x1b[0m\r\n` +
          `\x1b[90mCreate or open a file (e.g. main.py, index.js, main.c, Main.java) and click Run Code!\x1b[0m\r\n` +
          this.getPrompt()
        );
        return;
      }

      this.executeFile(targetFile);
      return;
    }

    // ─── 11. COMPILE & RUN DIRECT COMMANDS (gcc, g++, javac, java, python, node, go, etc.) ───
    // If user typed `python <file>`
    if (primary === 'python' || primary === 'py' || primary === 'python3') {
      const args = parts.slice(1);
      this.runProcessOrCloud(this.getPythonBinary(), args, 'cpython-head', args[0] ? this.readFileSafe(args[0]) : null);
      return;
    }

    // If user typed `node <file>`
    if (primary === 'node') {
      this.runLocalProcess('node', parts.slice(1));
      return;
    }

    // If user typed `gcc ...`
    if (primary === 'gcc') {
      const sourceFile = parts.find(p => p.endsWith('.c'));
      this.runOrCloudFallback(
        cmd,
        'gcc-head-c',
        sourceFile ? this.readFileSafe(sourceFile) : null
      );
      return;
    }

    // If user typed `g++ ...`
    if (primary === 'g++' || primary === 'clang++') {
      const sourceFile = parts.find(p => p.endsWith('.cpp') || p.endsWith('.cc'));
      this.runOrCloudFallback(
        cmd,
        'gcc-head',
        sourceFile ? this.readFileSafe(sourceFile) : null
      );
      return;
    }

    // If user typed `javac ...` or `java ...`
    if (primary === 'javac' || primary === 'java') {
      const sourceFile = parts.find(p => p.endsWith('.java'));
      this.runOrCloudFallback(
        cmd,
        'openjdk-jdk-21+35',
        sourceFile ? this.readFileSafe(sourceFile) : null
      );
      return;
    }

    // ─── 12. General shell execution fallback ───
    this.runGenericShell(cmd);
  }

  /**
   * Safely read a file from the workspace
   */
  private readFileSafe(fileName: string): string | null {
    try {
      const fullPath = path.resolve(this.currentDir, fileName);
      if (fs.existsSync(fullPath)) {
        return fs.readFileSync(fullPath, 'utf-8');
      }
    } catch {}
    return null;
  }

  /**
   * Execute any source file by detecting its extension
   */
  private executeFile(fileName: string) {
    const ext = path.extname(fileName).toLowerCase();
    const baseName = path.basename(fileName, ext);
    const content = this.readFileSafe(fileName);

    this.socket.emit('terminal:data', `\x1b[90m[Executing: ${fileName}]\x1b[0m\r\n`);

    switch (ext) {
      case '.py':
        this.runProcessOrCloud(this.getPythonBinary(), [fileName], 'cpython-head', content);
        break;

      case '.js':
      case '.mjs':
      case '.cjs':
        this.runLocalProcess('node', [fileName]);
        break;

      case '.ts':
        this.runGenericShell(`npx ts-node "${fileName}"`);
        break;

      case '.c':
        if (content) {
          this.executeCodeInAnyLanguage('c', content, `gcc "${fileName}" -o _out && .\\_out`);
        } else {
          this.socket.emit('terminal:data', `\x1b[31mFile "${fileName}" not found\x1b[0m\r\n` + this.getPrompt());
        }
        break;

      case '.cpp':
      case '.cc':
      case '.cxx':
        if (content) {
          this.executeCodeInAnyLanguage('cpp', content, `g++ "${fileName}" -o _out && .\\_out`);
        } else {
          this.socket.emit('terminal:data', `\x1b[31mFile "${fileName}" not found\x1b[0m\r\n` + this.getPrompt());
        }
        break;

      case '.java':
        if (content) {
          this.executeCodeInAnyLanguage('java', content, `javac "${fileName}" && java ${baseName}`);
        } else {
          this.socket.emit('terminal:data', `\x1b[31mFile "${fileName}" not found\x1b[0m\r\n` + this.getPrompt());
        }
        break;

      case '.go':
        if (content) {
          this.executeCodeInAnyLanguage('go', content, `go run "${fileName}"`);
        } else {
          this.socket.emit('terminal:data', `\x1b[31mFile "${fileName}" not found\x1b[0m\r\n` + this.getPrompt());
        }
        break;

      case '.rs':
        if (content) {
          this.executeCodeInAnyLanguage('rust', content, `rustc "${fileName}" -o _out && .\\_out`);
        } else {
          this.socket.emit('terminal:data', `\x1b[31mFile "${fileName}" not found\x1b[0m\r\n` + this.getPrompt());
        }
        break;

      case '.rb':
        this.runGenericShell(`ruby "${fileName}"`);
        break;

      case '.php':
        this.runGenericShell(`php "${fileName}"`);
        break;

      default:
        this.socket.emit('terminal:data',
          `\x1b[33mUnknown file type "${ext}". Trying generic execution...\x1b[0m\r\n`
        );
        this.runGenericShell(fileName);
    }
  }

  /**
   * Execute code in C, C++, Java, Go, Rust using local compiler if available,
   * otherwise fallback automatically to high-speed Cloud Compiler.
   */
  private executeCodeInAnyLanguage(lang: 'c' | 'cpp' | 'java' | 'go' | 'rust', code: string, localCommand?: string) {
    const compilerMap: Record<string, string> = {
      c: 'gcc-head-c',
      cpp: 'gcc-head',
      java: 'openjdk-jdk-21+35',
      go: 'go-1.23.2',
      rust: 'rust-1.82.0'
    };

    // If local command is specified, test if local binary is available
    if (localCommand) {
      const bin = localCommand.split(/\s+/)[0].replace(/['"]/g, '');
      const hasLocal = this.isBinaryAvailable(bin);
      if (hasLocal) {
        this.runGenericShell(localCommand);
        return;
      }
    }

    // Cloud compilation fallback
    const compiler = compilerMap[lang] || 'gcc-head-c';
    runViaCloudCompiler(compiler, code, this.socket, () => this.getPrompt());
  }

  private isBinaryAvailable(bin: string): boolean {
    try {
      const checker = process.platform === 'win32' ? 'where.exe' : 'which';
      const result = spawnSync(checker, [bin], { stdio: 'ignore', timeout: 800 });
      return result.status === 0;
    } catch {
      return false;
    }
  }

  private getPythonBinary(): string {
    if (this.isBinaryAvailable('python')) return 'python';
    if (this.isBinaryAvailable('py')) return 'py';
    if (this.isBinaryAvailable('python3')) return 'python3';
    return 'python';
  }

  /**
   * Try running command locally, and if compiler not found, fallback to Cloud Compiler
   */
  private runOrCloudFallback(cmd: string, cloudCompiler: string, sourceContent: string | null) {
    try {
      this.activeProcess = spawn(cmd, {
        cwd: this.currentDir,
        shell: true,
        env: {
          ...process.env,
          CLOUDBASE_TERMINAL: '1',
          FORCE_COLOR: '1'
        }
      });

      let hadError = false;

      this.activeProcess.stdout?.on('data', (d: Buffer) => {
        this.socket.emit('terminal:data', d.toString('utf-8').replace(/\r?\n/g, '\r\n'));
      });

      this.activeProcess.stderr?.on('data', (d: Buffer) => {
        const text = d.toString('utf-8');
        // Check if compiler not found on Windows
        if (text.includes('is not recognized') || text.includes('not found')) {
          hadError = true;
        } else {
          this.socket.emit('terminal:data', `\x1b[31m${text.replace(/\r?\n/g, '\r\n')}\x1b[0m`);
        }
      });

      this.activeProcess.on('close', (code: number | null) => {
        this.activeProcess = null;
        if (hadError && sourceContent) {
          this.socket.emit('terminal:data', `\x1b[33m[Host compiler not found. Automatically running via Cloud Compiler...]\x1b[0m\r\n`);
          runViaCloudCompiler(cloudCompiler, sourceContent, this.socket, () => this.getPrompt());
          return;
        }
        if (code === 0) {
          this.socket.emit('terminal:data', `\x1b[32m[✓ Finished]\x1b[0m\r\n`);
        } else if (code !== null) {
          this.socket.emit('terminal:data', `\x1b[90m[Process exited with code ${code}]\x1b[0m\r\n`);
        }
        this.socket.emit('terminal:data', this.getPrompt());
      });

      this.activeProcess.on('error', () => {
        this.activeProcess = null;
        if (sourceContent) {
          this.socket.emit('terminal:data', `\x1b[33m[Host compiler not found. Running via Cloud Compiler...]\x1b[0m\r\n`);
          runViaCloudCompiler(cloudCompiler, sourceContent, this.socket, () => this.getPrompt());
        } else {
          this.socket.emit('terminal:data', `\x1b[31m[Compiler not available on host]\x1b[0m\r\n` + this.getPrompt());
        }
      });

    } catch (err: any) {
      if (sourceContent) {
        runViaCloudCompiler(cloudCompiler, sourceContent, this.socket, () => this.getPrompt());
      } else {
        this.socket.emit('terminal:data', `\x1b[31m[Execution error: ${err.message}]\x1b[0m\r\n` + this.getPrompt());
      }
    }
  }

  /**
   * Run local binary (e.g. node, python) with clean real-time streaming
   */
  private runLocalProcess(bin: string, args: string[]) {
    try {
      this.activeProcess = spawn(bin, args, {
        cwd: this.currentDir,
        shell: false,
        env: {
          ...process.env,
          CLOUDBASE_TERMINAL: '1',
          FORCE_COLOR: '1'
        }
      });

      this.activeProcess.stdout?.on('data', (d: Buffer) => {
        this.socket.emit('terminal:data', d.toString('utf-8').replace(/\r?\n/g, '\r\n'));
      });

      this.activeProcess.stderr?.on('data', (d: Buffer) => {
        this.socket.emit('terminal:data', `\x1b[31m${d.toString('utf-8').replace(/\r?\n/g, '\r\n')}\x1b[0m`);
      });

      this.activeProcess.on('close', (code: number | null) => {
        this.activeProcess = null;
        if (code === 0) {
          this.socket.emit('terminal:data', `\x1b[32m[✓ Finished]\x1b[0m\r\n`);
        } else if (code !== null) {
          this.socket.emit('terminal:data', `\x1b[90m[Process exited with code ${code}]\x1b[0m\r\n`);
        }
        this.socket.emit('terminal:data', this.getPrompt());
      });

      this.activeProcess.on('error', (err: any) => {
        this.activeProcess = null;
        this.socket.emit('terminal:data', `\x1b[31m[Error launching ${bin}: ${err.message}]\x1b[0m\r\n` + this.getPrompt());
      });

    } catch (err: any) {
      this.socket.emit('terminal:data', `\x1b[31m[Error: ${err.message}]\x1b[0m\r\n` + this.getPrompt());
    }
  }

  /**
   * Try local binary, or if it fails, fallback to cloud
   */
  private runProcessOrCloud(bin: string, args: string[], cloudCompiler: string, codeContent: string | null) {
    try {
      this.activeProcess = spawn(bin, args, {
        cwd: this.currentDir,
        shell: false,
        env: {
          ...process.env,
          CLOUDBASE_TERMINAL: '1',
          PYTHONUNBUFFERED: '1',
          PYTHONDONTWRITEBYTECODE: '1',
          FORCE_COLOR: '1'
        }
      });

      let hasOutput = false;

      this.activeProcess.stdout?.on('data', (d: Buffer) => {
        hasOutput = true;
        this.socket.emit('terminal:data', d.toString('utf-8').replace(/\r?\n/g, '\r\n'));
      });

      this.activeProcess.stderr?.on('data', (d: Buffer) => {
        hasOutput = true;
        this.socket.emit('terminal:data', `\x1b[31m${d.toString('utf-8').replace(/\r?\n/g, '\r\n')}\x1b[0m`);
      });

      this.activeProcess.on('close', (code: number | null) => {
        this.activeProcess = null;
        if (code === 0) {
          this.socket.emit('terminal:data', `\x1b[32m[✓ Finished]\x1b[0m\r\n`);
        } else if (code !== null) {
          this.socket.emit('terminal:data', `\x1b[90m[Process exited with code ${code}]\x1b[0m\r\n`);
        }
        this.socket.emit('terminal:data', this.getPrompt());
      });

      this.activeProcess.on('error', () => {
        this.activeProcess = null;
        if (codeContent) {
          runViaCloudCompiler(cloudCompiler, codeContent, this.socket, () => this.getPrompt());
        } else {
          this.socket.emit('terminal:data', `\x1b[31m[Runtime "${bin}" not available]\x1b[0m\r\n` + this.getPrompt());
        }
      });

    } catch {
      if (codeContent) {
        runViaCloudCompiler(cloudCompiler, codeContent, this.socket, () => this.getPrompt());
      } else {
        this.socket.emit('terminal:data', `\x1b[31m[Runtime "${bin}" not available]\x1b[0m\r\n` + this.getPrompt());
      }
    }
  }

  /**
   * Run generic shell command
   */
  private runGenericShell(cmd: string) {
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
        this.socket.emit('terminal:data', d.toString('utf-8').replace(/\r?\n/g, '\r\n'));
      });

      this.activeProcess.stderr?.on('data', (d: Buffer) => {
        this.socket.emit('terminal:data', `\x1b[31m${d.toString('utf-8').replace(/\r?\n/g, '\r\n')}\x1b[0m`);
      });

      this.activeProcess.on('close', (code: number | null) => {
        this.activeProcess = null;
        if (code === 0) {
          this.socket.emit('terminal:data', `\x1b[32m[✓ Finished]\x1b[0m\r\n`);
        } else if (code !== null) {
          this.socket.emit('terminal:data', `\x1b[90m[Exited with code ${code}]\x1b[0m\r\n`);
        }
        this.socket.emit('terminal:data', this.getPrompt());
      });

      this.activeProcess.on('error', (err: any) => {
        this.activeProcess = null;
        this.socket.emit('terminal:data', `\x1b[31m[Error: ${err.message}]\x1b[0m\r\n` + this.getPrompt());
      });

    } catch (err: any) {
      this.socket.emit('terminal:data', `\x1b[31m[Execution failed: ${err.message}]\x1b[0m\r\n` + this.getPrompt());
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
                  run: (cmd) => {
                    if (cmd) {
                      stream.write(`${cmd}\n`);
                    }
                  },
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
            const shell = new InteractiveWorkspaceShell(socket, projectId, workspace);
            shell.start();

            this.sessions.set(socket.id, {
              socketId: socket.id,
              projectId,
              write: (d) => shell.handleInput(d),
              run: (command, filePath) => shell.runTrigger(command, filePath),
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

      socket.on('terminal:run', (data: { command?: string; filePath?: string }) => {
        const session = this.sessions.get(socket.id);
        if (session && session.run) {
          session.run(data.command, data.filePath);
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
