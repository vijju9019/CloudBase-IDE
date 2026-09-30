import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { config } from '../config.js';

let dbInstance: DatabaseSync | null = null;

export function getDatabase(): DatabaseSync {
  if (dbInstance) {
    return dbInstance;
  }

  // Ensure database directory exists
  if (!fs.existsSync(config.storage.database)) {
    fs.mkdirSync(config.storage.database, { recursive: true });
  }

  const dbPath = path.join(config.storage.database, 'cloudbase.sqlite');
  dbInstance = new DatabaseSync(dbPath);

  // Enable WAL mode & foreign keys for concurrency & performance
  dbInstance.exec('PRAGMA journal_mode = WAL;');
  dbInstance.exec('PRAGMA foreign_keys = ON;');

  initSchema(dbInstance);
  return dbInstance;
}

function initSchema(db: DatabaseSync): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      language TEXT NOT NULL,
      template TEXT NOT NULL,
      workspace_path TEXT NOT NULL,
      container_id TEXT,
      status TEXT NOT NULL DEFAULT 'stopped',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS environment_templates (
      id TEXT PRIMARY KEY,
      language TEXT NOT NULL,
      version TEXT NOT NULL,
      docker_image TEXT NOT NULL,
      configuration TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS project_settings (
      project_id TEXT PRIMARY KEY,
      memory_limit INTEGER NOT NULL DEFAULT 1073741824,
      cpu_limit REAL NOT NULL DEFAULT 1.0,
      network_enabled INTEGER NOT NULL DEFAULT 0,
      autosave INTEGER NOT NULL DEFAULT 1,
      configuration TEXT,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS ai_conversations (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      title TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS ai_messages (
      id TEXT PRIMARY KEY,
      conversation_id TEXT NOT NULL,
      role TEXT NOT NULL,
      message TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (conversation_id) REFERENCES ai_conversations(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS model_settings (
      id TEXT PRIMARY KEY,
      model_name TEXT NOT NULL,
      provider TEXT NOT NULL DEFAULT 'ollama',
      configuration TEXT
    );

    CREATE TABLE IF NOT EXISTS operation_logs (
      id TEXT PRIMARY KEY,
      project_id TEXT,
      operation TEXT NOT NULL,
      status TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      details TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
    CREATE INDEX IF NOT EXISTS idx_ai_messages_conv ON ai_messages(conversation_id);
    CREATE INDEX IF NOT EXISTS idx_operation_logs_proj ON operation_logs(project_id);
  `);

  // Seed default templates if empty
  const count = (db.prepare('SELECT COUNT(*) as count FROM environment_templates').get() as { count: number }).count;
  if (count === 0) {
    const insertTemplate = db.prepare(`
      INSERT INTO environment_templates (id, language, version, docker_image, configuration)
      VALUES (?, ?, ?, ?, ?)
    `);

    const templates = [
      {
        id: 'python-312',
        language: 'python',
        version: '3.12',
        docker_image: 'python:3.12-slim',
        configuration: JSON.stringify({ runCommand: 'python main.py', entryFile: 'main.py' })
      },
      {
        id: 'node-22',
        language: 'node',
        version: '22',
        docker_image: 'node:22-slim',
        configuration: JSON.stringify({ runCommand: 'node index.js', entryFile: 'index.js' })
      },
      {
        id: 'react-vite',
        language: 'react',
        version: '18',
        docker_image: 'node:22-slim',
        configuration: JSON.stringify({ runCommand: 'npm run dev', previewPort: 5173 })
      },
      {
        id: 'java-21',
        language: 'java',
        version: '21',
        docker_image: 'eclipse-temurin:21-jdk',
        configuration: JSON.stringify({ runCommand: 'javac Main.java && java Main', entryFile: 'Main.java' })
      },
      {
        id: 'cpp-gcc',
        language: 'cpp',
        version: 'gcc-13',
        docker_image: 'gcc:13',
        configuration: JSON.stringify({ runCommand: 'g++ -o main main.cpp && ./main', entryFile: 'main.cpp' })
      },
      {
        id: 'go-122',
        language: 'go',
        version: '1.22',
        docker_image: 'golang:1.22-alpine',
        configuration: JSON.stringify({ runCommand: 'go run main.go', entryFile: 'main.go' })
      }
    ];

    for (const t of templates) {
      insertTemplate.run(t.id, t.language, t.version, t.docker_image, t.configuration);
    }
  }

  // Seed default model settings if empty
  const modelCount = (db.prepare('SELECT COUNT(*) as count FROM model_settings').get() as { count: number }).count;
  if (modelCount === 0) {
    const insertModel = db.prepare(`
      INSERT INTO model_settings (id, model_name, provider, configuration)
      VALUES (?, ?, ?, ?)
    `);

    insertModel.run('qwen2.5-coder-1.5b', 'qwen2.5-coder:1.5b', 'ollama', JSON.stringify({ contextLength: 4096, temperature: 0.2 }));
    insertModel.run('qwen2.5-coder-3b', 'qwen2.5-coder:3b', 'ollama', JSON.stringify({ contextLength: 8192, temperature: 0.2 }));
    insertModel.run('qwen2.5-coder-7b', 'qwen2.5-coder:7b', 'ollama', JSON.stringify({ contextLength: 16384, temperature: 0.2 }));
  }
}
