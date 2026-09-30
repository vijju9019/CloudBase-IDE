import { Router } from 'express';
import { OllamaService } from '../ai/ollama.js';
import { AgentService } from '../ai/agent.js';
import { getDatabase } from '../database/index.js';

export const aiRouter = Router();

// AI engine status & detected models
aiRouter.get('/status', async (req, res) => {
  const status = await OllamaService.checkStatus();
  res.json(status);
});

// List models
aiRouter.get('/models', async (req, res) => {
  const status = await OllamaService.checkStatus();
  res.json(status.models);
});

// AI Chat endpoint
aiRouter.post('/chat', async (req, res) => {
  try {
    const { projectId, message, model, conversationId, currentFile, fileContent } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Missing message parameter' });
    }

    const db = getDatabase();
    const project = projectId ? (db.prepare('SELECT * FROM projects WHERE id = ?').get(projectId) as any) : null;
    const effectiveConvId = conversationId || ('conv_' + (projectId || 'global') + '_' + Date.now().toString(36));

    // Ensure conversation exists in DB
    const existing = db.prepare('SELECT id FROM ai_conversations WHERE id = ?').get(effectiveConvId);
    if (!existing && projectId) {
      db.prepare(`
        INSERT INTO ai_conversations (id, project_id, title, created_at)
        VALUES (?, ?, ?, ?)
      `).run(effectiveConvId, projectId, message.slice(0, 30), new Date().toISOString());
    }

    // Save user message
    db.prepare(`
      INSERT INTO ai_messages (id, conversation_id, role, message, created_at)
      VALUES (?, ?, 'user', ?, ?)
    `).run('msg_' + Date.now() + '_u', effectiveConvId, message, new Date().toISOString());

    // Fetch conversation history
    const historyRows = db.prepare(`
      SELECT role, message as content FROM ai_messages
      WHERE conversation_id = ?
      ORDER BY created_at ASC
      LIMIT 10
    `).all(effectiveConvId) as Array<{ role: string; content: string }>;

    const context = {
      filename: currentFile,
      code: fileContent,
      language: project?.language
    };

    const status = await OllamaService.checkStatus();
    let reply = '';

    if (status.available && status.models.length > 0) {
      const selectedModel = model || status.models[0].name;
      const systemMsg = {
        role: 'system',
        content: `You are CloudBase IDE's Local Offline Senior Coding AI Agent.
Project: ${project?.name || 'Project'} (Language: ${project?.language || 'python'})
Active File: ${currentFile || 'none'}
${fileContent ? `Active Code:\n\`\`\`\n${fileContent.slice(0, 1500)}\n\`\`\`` : ''}
Provide direct, concise, production-ready code and clear explanations tailored specifically to the user's input.`
      };
      const messagesWithSystem = [systemMsg, ...historyRows];
      let accumulated = '';

      await new Promise<void>((resolve, reject) => {
        OllamaService.chatStream(
          selectedModel,
          messagesWithSystem,
          (chunk) => { accumulated += chunk; },
          () => {
            reply = accumulated;
            resolve();
          },
          (err) => reject(err)
        );
      }).catch(async () => {
        reply = await OllamaService.fallbackAssistant(message, 'chat', context);
      });
    } else {
      reply = await OllamaService.fallbackAssistant(message, 'chat', context);
    }

    // Save assistant reply
    db.prepare(`
      INSERT INTO ai_messages (id, conversation_id, role, message, created_at)
      VALUES (?, ?, 'assistant', ?, ?)
    `).run('msg_' + Date.now() + '_a', effectiveConvId, reply, new Date().toISOString());

    res.json({
      conversationId: effectiveConvId,
      reply,
      isOfflineFallback: !status.available
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Explain code endpoint
aiRouter.post('/explain', async (req, res) => {
  try {
    const { code, filename } = req.body;
    if (!code) {
      return res.status(400).json({ error: 'Missing code parameter' });
    }

    const explanation = await OllamaService.fallbackAssistant(
      'Explain this code',
      'explain',
      { code, filename }
    );

    res.json({ explanation });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Debug error endpoint
aiRouter.post('/debug', async (req, res) => {
  try {
    const { error, filename } = req.body;
    if (!error) {
      return res.status(400).json({ error: 'Missing error parameter' });
    }

    const diagnosis = await OllamaService.fallbackAssistant(
      'Debug this error',
      'debug',
      { error, filename }
    );

    res.json({ diagnosis });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Propose file change with unified diff
aiRouter.post('/propose-change', async (req, res) => {
  try {
    const { projectId, prompt, targetFile, model } = req.body;
    if (!projectId || !prompt || !targetFile) {
      return res.status(400).json({ error: 'Missing projectId, prompt, or targetFile' });
    }

    const proposal = await AgentService.proposeChange(projectId, prompt, targetFile, model);
    res.json(proposal);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Apply approved proposal
aiRouter.post('/apply-change', (req, res) => {
  try {
    const { proposalId } = req.body;
    if (!proposalId) {
      return res.status(400).json({ error: 'Missing proposalId' });
    }

    const applied = AgentService.applyProposal(proposalId);
    res.json({ success: true, proposal: applied });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Reject proposal
aiRouter.post('/reject-change', (req, res) => {
  try {
    const { proposalId } = req.body;
    if (!proposalId) {
      return res.status(400).json({ error: 'Missing proposalId' });
    }

    const rejected = AgentService.rejectProposal(proposalId);
    res.json({ success: true, proposal: rejected });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Get conversation messages for project
aiRouter.get('/conversations/:projectId', (req, res) => {
  try {
    const { projectId } = req.params;
    const db = getDatabase();
    const messages = db.prepare(`
      SELECT m.* FROM ai_messages m
      JOIN ai_conversations c ON m.conversation_id = c.id
      WHERE c.project_id = ?
      ORDER BY m.created_at ASC
    `).all(projectId);

    res.json(messages);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
