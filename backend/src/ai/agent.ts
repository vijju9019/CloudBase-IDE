import fs from 'node:fs';
import path from 'node:path';
import { StorageGuardian } from '../storage/guardian.js';
import { OllamaService } from './ollama.js';

export interface ProposedChange {
  filePath: string;
  originalContent: string;
  proposedContent: string;
  diffSummary: string;
}

export interface ModificationProposal {
  id: string;
  projectId: string;
  createdAt: string;
  prompt: string;
  changes: ProposedChange[];
  status: 'pending' | 'accepted' | 'rejected';
}

export class AgentService {
  private static proposals: Map<string, ModificationProposal> = new Map();

  /**
   * Scans project files for context collection, ignoring junk and secrets
   */
  static collectProjectContext(projectId: string, maxFiles = 25): { files: Array<{ path: string; size: number; snippet: string }> } {
    const workspace = StorageGuardian.getProjectWorkspacePath(projectId);
    if (!fs.existsSync(workspace)) {
      return { files: [] };
    }

    const collected: Array<{ path: string; size: number; snippet: string }> = [];
    const ignoreList = [
      'node_modules',
      '.git',
      '__pycache__',
      '.venv',
      'dist',
      'build',
      '.next',
      '.cache',
      'package-lock.json',
      'yarn.lock',
      '.env',
      '.env.local'
    ];

    const walk = (currentDir: string, relBase = '') => {
      if (collected.length >= maxFiles) return;

      const entries = fs.readdirSync(currentDir, { withFileTypes: true });
      for (const entry of entries) {
        if (ignoreList.includes(entry.name)) continue;
        if (entry.name.startsWith('.') && entry.name !== '.gitignore') continue;

        const relPath = path.join(relBase, entry.name).replace(/\\/g, '/');
        const fullPath = path.join(currentDir, entry.name);

        if (entry.isDirectory()) {
          walk(fullPath, relPath);
        } else if (entry.isFile()) {
          const stats = fs.statSync(fullPath);
          // Only collect text files under 200KB
          if (stats.size < 200 * 1024) {
            try {
              const content = fs.readFileSync(fullPath, 'utf-8');
              const snippet = content.slice(0, 1500); // First 1500 chars
              collected.push({
                path: relPath,
                size: stats.size,
                snippet
              });
            } catch {
              // Binary or unreadable
            }
          }
        }
      }
    };

    walk(workspace);
    return { files: collected };
  }

  /**
   * Controlled tool: search code across project files
   */
  static searchCode(projectId: string, query: string): Array<{ file: string; line: number; text: string }> {
    const workspace = StorageGuardian.getProjectWorkspacePath(projectId);
    const results: Array<{ file: string; line: number; text: string }> = [];

    const walk = (dir: string, relBase = '') => {
      if (results.length > 50) return;
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === '__pycache__' || entry.name === '.venv') continue;
        const full = path.join(dir, entry.name);
        const rel = path.join(relBase, entry.name).replace(/\\/g, '/');
        if (entry.isDirectory()) {
          walk(full, rel);
        } else if (entry.isFile()) {
          try {
            const content = fs.readFileSync(full, 'utf-8');
            const lines = content.split('\n');
            lines.forEach((line, index) => {
              if (line.toLowerCase().includes(query.toLowerCase()) && results.length < 50) {
                results.push({ file: rel, line: index + 1, text: line.trim() });
              }
            });
          } catch {
            // Ignore binary files
          }
        }
      }
    };

    walk(workspace);
    return results;
  }

  /**
   * Generates a proposal for file modifications
   */
  static async proposeChange(
    projectId: string,
    prompt: string,
    targetFile: string,
    modelName: string
  ): Promise<ModificationProposal> {
    const workspace = StorageGuardian.getProjectWorkspacePath(projectId);
    const safeFilePath = StorageGuardian.resolveSafeFilePath(workspace, targetFile);

    let originalContent = '';
    if (fs.existsSync(safeFilePath)) {
      originalContent = fs.readFileSync(safeFilePath, 'utf-8');
    }

    const context = this.collectProjectContext(projectId);
    const projectSummary = context.files.map(f => `- ${f.path} (${f.size} bytes)`).join('\n');

    const systemPrompt = `You are the CloudBase IDE Offline AI Senior Coding Agent.
Your task is to modify the file "${targetFile}" based on the user request.
Respond ONLY with the complete, updated source code of the file. Do NOT wrap with markdown backticks or commentary if possible, or wrap cleanly in a single code block.

Project files:
${projectSummary}

Target file "${targetFile}" current content:
\`\`\`
${originalContent}
\`\`\`
`;

    let proposedCode = '';
    const ollamaStatus = await OllamaService.checkStatus();

    if (ollamaStatus.available && ollamaStatus.models.length > 0) {
      // Use active Ollama model
      let accumulated = '';
      await new Promise<void>((resolve, reject) => {
        OllamaService.chatStream(
          modelName || ollamaStatus.models[0].name,
          [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt }
          ],
          (chunk) => { accumulated += chunk; },
          () => {
            proposedCode = accumulated;
            resolve();
          },
          (err) => reject(err)
        );
      }).catch(async () => {
        // Fallback if model failed during inference
        proposedCode = this.generateFallbackEdit(originalContent, targetFile, prompt);
      });
    } else {
      // Offline fallback generator
      proposedCode = this.generateFallbackEdit(originalContent, targetFile, prompt);
    }

    // Strip wrapping markdown code blocks if present
    const cleanedCode = this.cleanMarkdownCode(proposedCode);

    const proposalId = 'prop_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6);
    const proposal: ModificationProposal = {
      id: proposalId,
      projectId,
      createdAt: new Date().toISOString(),
      prompt,
      changes: [
        {
          filePath: targetFile,
          originalContent,
          proposedContent: cleanedCode,
          diffSummary: this.computeDiffSummary(originalContent, cleanedCode)
        }
      ],
      status: 'pending'
    };

    this.proposals.set(proposalId, proposal);
    return proposal;
  }

  /**
   * Applies approved proposed changes to disk
   */
  static applyProposal(proposalId: string): ModificationProposal {
    const proposal = this.proposals.get(proposalId);
    if (!proposal) {
      throw new Error(`Proposal "${proposalId}" not found`);
    }

    if (proposal.status === 'accepted') {
      return proposal;
    }

    const workspace = StorageGuardian.getProjectWorkspacePath(proposal.projectId);

    for (const change of proposal.changes) {
      const safeTarget = StorageGuardian.resolveSafeFilePath(workspace, change.filePath);
      const parentDir = path.dirname(safeTarget);
      if (!fs.existsSync(parentDir)) {
        fs.mkdirSync(parentDir, { recursive: true });
      }
      fs.writeFileSync(safeTarget, change.proposedContent, 'utf-8');
      StorageGuardian.logAudit(proposal.projectId, 'AI_APPLY_CHANGE', 'SUCCESS', `Modified ${change.filePath} via proposal ${proposalId}`);
    }

    proposal.status = 'accepted';
    return proposal;
  }

  /**
   * Rejects a proposal
   */
  static rejectProposal(proposalId: string): ModificationProposal {
    const proposal = this.proposals.get(proposalId);
    if (!proposal) {
      throw new Error(`Proposal "${proposalId}" not found`);
    }
    proposal.status = 'rejected';
    StorageGuardian.logAudit(proposal.projectId, 'AI_REJECT_CHANGE', 'SUCCESS', `Rejected proposal ${proposalId}`);
    return proposal;
  }

  private static cleanMarkdownCode(raw: string): string {
    const match = raw.match(/```[\w-]*\n([\s\S]*?)\n```/);
    if (match && match[1]) {
      return match[1];
    }
    return raw.trim();
  }

  private static computeDiffSummary(original: string, proposed: string): string {
    const origLines = original.split('\n');
    const propLines = proposed.split('\n');
    return `${origLines.length} lines originally -> ${propLines.length} lines proposed`;
  }

  private static generateFallbackEdit(original: string, filename: string, prompt: string): string {
    if (filename.endsWith('.py')) {
      return original
        ? `${original}\n\n# Added by CloudBase AI Assistant: ${prompt}\ndef helper_feature():\n    \"\"\"Implementation for: ${prompt}\"\"\"\n    print("Feature initialized successfully.")\n`
        : `# ${filename}\n# Created by CloudBase AI Assistant for: ${prompt}\n\ndef main():\n    print("CloudBase IDE Python project ready.")\n\nif __name__ == '__main__':\n    main()\n`;
    }

    if (filename.endsWith('.js') || filename.endsWith('.ts')) {
      return original
        ? `${original}\n\n// Added by CloudBase AI Assistant: ${prompt}\nexport function helperFeature() {\n  console.log('Feature initialized successfully for: ${prompt}');\n}\n`
        : `// ${filename}\n// Created by CloudBase IDE for: ${prompt}\n\nconsole.log('CloudBase IDE project running.');\n`;
    }

    return `${original}\n\n# Updated by CloudBase AI: ${prompt}\n`;
  }
}
