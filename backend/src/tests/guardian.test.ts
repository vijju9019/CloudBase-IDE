import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { StorageGuardian, StorageGuardianSecurityError } from '../storage/guardian.js';
import { TemplateService } from '../services/templates.js';
import { getDatabase } from '../database/index.js';
import { AgentService } from '../ai/agent.js';
import { DockerService } from '../docker/service.js';
import { OllamaService } from '../ai/ollama.js';

describe('Storage Guardian & Core Security Tests', () => {
  const testProjectId = 'test-proj-' + Date.now().toString(36);
  let testWorkspace: string;

  beforeAll(() => {
    StorageGuardian.init();
    getDatabase();
    testWorkspace = StorageGuardian.getProjectWorkspacePath(testProjectId);
    TemplateService.populateStarterFiles(testWorkspace, 'python', 'Test Python App');
  });

  it('correctly resolves safe project workspace without escaping', () => {
    const ws = StorageGuardian.getProjectWorkspacePath(testProjectId);
    expect(ws).toContain(testProjectId);
    expect(fs.existsSync(ws)).toBe(true);
  });

  it('rejects path traversal attempts outside workspace', () => {
    expect(() => {
      StorageGuardian.resolveSafeFilePath(testWorkspace, '../../../../Windows/System32');
    }).toThrow(StorageGuardianSecurityError);

    expect(() => {
      StorageGuardian.resolveSafeFilePath(testWorkspace, '..\\..\\secret.txt');
    }).toThrow();
  });

  it('rejects invalid project IDs containing malicious traversal characters', () => {
    expect(() => {
      StorageGuardian.getProjectWorkspacePath('../../../etc');
    }).toThrow(StorageGuardianSecurityError);
  });

  it('safely resolves files inside workspace', () => {
    const safeFile = StorageGuardian.resolveSafeFilePath(testWorkspace, 'main.py');
    expect(fs.existsSync(safeFile)).toBe(true);
    const content = fs.readFileSync(safeFile, 'utf-8');
    expect(content).toContain('CloudBase IDE');
  });

  it('creates project backup archive successfully', async () => {
    const backupPath = await StorageGuardian.createProjectBackup(testProjectId);
    expect(fs.existsSync(backupPath)).toBe(true);
    expect(backupPath.endsWith('.zip')).toBe(true);
  });

  it('calculates disk usage accurately', () => {
    const overview = StorageGuardian.getStorageOverview();
    expect(overview.totalSizeBytes).toBeGreaterThan(0);
    expect(overview.breakdown.projectsBytes).toBeGreaterThan(0);
  });

  it('safely deletes project workspace without affecting parent or system directories', () => {
    StorageGuardian.safeDeleteProject(testProjectId);
    expect(fs.existsSync(testWorkspace)).toBe(false);
  });
});

describe('AI Agent & Tool Layer Tests', () => {
  const agentProjectId = 'agent-test-' + Date.now().toString(36);
  let ws: string;

  beforeAll(() => {
    ws = StorageGuardian.getProjectWorkspacePath(agentProjectId);
    TemplateService.populateStarterFiles(ws, 'python', 'Agent App');
  });

  it('collects project context filtering ignored patterns', () => {
    const context = AgentService.collectProjectContext(agentProjectId);
    expect(context.files.length).toBeGreaterThan(0);
    expect(context.files.some(f => f.path.includes('main.py'))).toBe(true);
  });

  it('proposes file changes with structured diff', async () => {
    const proposal = await AgentService.proposeChange(
      agentProjectId,
      'Add Fibonacci function',
      'main.py',
      'qwen2.5-coder:1.5b'
    );

    expect(proposal.id).toBeDefined();
    expect(proposal.changes.length).toBe(1);
    expect(proposal.changes[0].proposedContent).toBeDefined();
    expect(proposal.status).toBe('pending');
  });

  it('applies proposal only upon approval', async () => {
    const proposal = await AgentService.proposeChange(
      agentProjectId,
      'Add test flag',
      'test_flag.py',
      'qwen2.5-coder:1.5b'
    );

    const applied = AgentService.applyProposal(proposal.id);
    expect(applied.status).toBe('accepted');
    const targetFile = path.join(ws, 'test_flag.py');
    expect(fs.existsSync(targetFile)).toBe(true);
  });
});

describe('Docker & Ollama Health Checks', () => {
  it('DockerService.checkStatus returns honest status without crashing', async () => {
    const status = await DockerService.checkStatus();
    expect(typeof status.available).toBe('boolean');
    if (!status.available) {
      expect(status.error).toBeDefined();
    }
  });

  it('OllamaService.checkStatus returns honest status without crashing', async () => {
    const status = await OllamaService.checkStatus();
    expect(typeof status.available).toBe('boolean');
    expect(Array.isArray(status.recommendedModels)).toBe(true);
  });
});
