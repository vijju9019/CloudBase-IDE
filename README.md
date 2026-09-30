# CloudBase IDE

> **Your Code. Your Environment. Your AI. All in One Place.**

CloudBase IDE is a local-first, browser-based AI development environment engineered with Monaco Editor, Docker container isolation, an offline neural coding agent powered by Ollama, and a dedicated **Storage Guardian** system that strictly protects your personal files.

---

## 🌟 Key Capabilities

1. **Monaco Editor Experience**: Professional VS Code-like coding experience with syntax highlighting, code folding, auto-indentation, and multiple editor tabs.
2. **Docker-Based Project Isolation**: Every project runs inside its own isolated Docker container (or local workspace sandbox) with controlled CPU and memory limits, dropped Linux capabilities, and no access to the host Docker socket.
3. **Storage Guardian**: A security layer guaranteeing zero access to personal host directories (`C:\Users`, `Documents`, `Desktop`, `Downloads`, `Pictures`). Only the project's assigned workspace folder is mounted.
4. **Offline Local AI Coding Agent**: Powered by Ollama and the Qwen2.5-Coder model family. Code explanation, error debugging, unit test generation, and multi-file change proposals run 100% locally without sending source code to cloud APIs.
5. **Interactive Diff Review**: AI modifications are previewed using side-by-side Monaco diffs with explicit user approval required before any file changes are written to disk.
6. **Real Integrated Terminal**: `xterm.js` terminal connected in real time via WebSockets directly into the project's running container.
7. **One-Click Code Execution**: Run Python, Node.js, React, Java, C++, and Go projects with streaming logs, exit codes, and controlled live web previews.
8. **Native SQLite Database**: Powered by Node 24's built-in `node:sqlite` for high-performance WAL-mode persistence with zero C++ compilation dependencies.
9. **Project Backup & Restore**: Full project exports with Zip-Slip attack prevention and comprehensive audit logging.
10. **Windows 11 Native Support**: Tailored PowerShell automation scripts for setup, health diagnostics, startup, and shutdown.

---

## 🏛 Architecture

```
┌────────────────────────────────────────────────────────┐
│              Browser Client (Port 5173)                │
│   React 18 • Monaco Editor • xterm.js • Tailwind CSS   │
└───────────────────────────┬────────────────────────────┘
                            │ HTTP & WebSockets
┌───────────────────────────▼────────────────────────────┐
│          CloudBase Backend Service (Port 3000)          │
│          Node.js 24 + Express + Native SQLite          │
│                                                        │
│  ┌───────────────────┐       ┌──────────────────────┐  │
│  │ Storage Guardian  │       │ Docker Manager       │  │
│  │ - Canonical Paths │       │ - Dockerode Service  │  │
│  │ - Traversal Block │       │ - Resource Limits    │  │
│  │ - Zip-Slip Shield │       │ - Exec TTY Stream    │  │
│  └───────────────────┘       └──────────────────────┘  │
│  ┌───────────────────┐       ┌──────────────────────┐  │
│  │ Offline AI Agent  │       │ Project Execution    │  │
│  │ - Ollama REST API │       │ - Runner & Sandbox   │  │
│  │ - Context Scanner │       │ - Live Web Preview   │  │
│  │ - Diff Generator  │       │ - Process Lifecycle  │  │
│  └───────────────────┘       └──────────────────────┘  │
└─────────────┬───────────────────────────┬──────────────┘
              │                           │
┌─────────────▼─────────────┐ ┌───────────▼──────────────┐
│       Docker Engine       │ │     Ollama AI Engine     │
│ Isolated Container Mounts │ │ 127.0.0.1:11434 (Local)  │
│ python:3.12 / node:22     │ │ Qwen2.5-Coder 1.5B/3B/7B │
└───────────────────────────┘ └──────────────────────────┘
```

---

## 🛡 Storage Guardian Isolation Directory Layout

Storage is isolated by default in `%LOCALAPPDATA%\CloudBaseIDE\`:

```
CloudBaseIDE/
  ├── Projects/
  │   ├── project-001/       <-- Container mounts ONLY this folder
  │   └── project-002/       <-- Container mounts ONLY this folder
  ├── Models/                <-- Local model storage
  ├── Database/
  │   └── cloudbase.sqlite   <-- Projects, settings, audit trails
  ├── Backups/               <-- Verified zip backup archives
  ├── Logs/                  <-- Container & runtime execution logs
  └── Cache/                 <-- Temporary build artifacts
```

### Strictly Protected Host Paths (NEVER Mounted)
- `C:\Users` and `C:\Users\<username>`
- `Documents`, `Desktop`, `Downloads`, `Pictures`, `Videos`, `Music`
- Entire drive roots (`C:\`, `D:\`)
- Parent `CloudBaseIDE` system directory

---

## 🚀 Quick Start Guide (Windows 11)

### Prerequisites
- **Node.js**: v20 or v24 (LTS recommended)
- **Docker Desktop**: For isolated container execution (with WSL2 backend)
- **Ollama**: For offline AI neural model inference

### 1. Installation
Clone the repository and run the setup script:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\setup.ps1
```

### 2. Verify System Health
Run diagnostic checks on your environment:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\health-check.ps1
```

### 3. Launch Application
Start the CloudBase IDE backend and web interface:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\start.ps1
```
Or start manually via npm:
```bash
npm run dev
```

Open your browser at:
- **Frontend IDE**: `http://localhost:5173`
- **Backend API**: `http://127.0.0.1:3000`

---

## 🤖 Ollama Local AI Setup

To enable offline coding assistance:

1. Download and install Ollama from [https://ollama.com/download](https://ollama.com/download).
2. Pull the recommended coding model:
   ```bash
   ollama pull qwen2.5-coder:1.5b
   ```
   *(For high-spec machines: `ollama pull qwen2.5-coder:7b`)*
3. Ensure Ollama is running:
   ```bash
   ollama serve
   ```
4. CloudBase IDE will automatically detect the model in the AI panel dropdown. If Ollama is not running, CloudBase IDE's built-in offline heuristic assistant provides intelligent code analysis, debugging advice, and test generation.

---

## 📡 REST API Reference

| Endpoint | Method | Description |
|---|---|---|
| `/api/health` | GET | Basic service heartbeat |
| `/api/status` | GET | Real-time status of Backend, Docker, Ollama, and Storage |
| `/api/projects` | GET / POST | List all projects or create a new project |
| `/api/projects/:id` | GET / DELETE | Get project details or delete isolated project |
| `/api/projects/:id/files` | GET / POST / DELETE | File tree, file creation, and deletion |
| `/api/projects/:id/files/content` | GET / PUT | Read or save file content |
| `/api/projects/:id/start` | POST | Start isolated project container |
| `/api/projects/:id/stop` | POST | Stop project container |
| `/api/projects/:id/run` | POST | Execute code inside container or sandbox |
| `/api/projects/:id/stop-execution` | POST | Abort running command execution |
| `/api/ai/status` | GET | Ollama connectivity and installed models |
| `/api/ai/chat` | POST | Streaming offline AI chat |
| `/api/ai/explain` | POST | Explain selected code |
| `/api/ai/debug` | POST | Debug terminal error output |
| `/api/ai/propose-change` | POST | Generate unified diff proposal |
| `/api/ai/apply-change` | POST | Apply approved proposal to disk |
| `/api/storage/usage` | GET | Storage Guardian disk usage breakdown |
| `/api/storage/backup` | POST | Create safe zip backup of project |
| `/api/storage/restore` | POST | Restore backup with Zip-Slip protection |
| `/api/preview/:id/*` | GET | Controlled live web preview for web apps |

---

## 🧪 Testing

Automated test suite using Vitest verifying security boundaries, path traversal rejection, Docker service health, and diff proposals:

```bash
npm run test
```

---

## 📄 License
MIT License. CloudBase IDE.
