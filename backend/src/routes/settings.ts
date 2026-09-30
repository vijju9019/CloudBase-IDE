import { Router } from 'express';
import { config } from '../config.js';
import { getDatabase } from '../database/index.js';
import { OllamaService } from '../ai/ollama.js';

export const settingsRouter = Router();

settingsRouter.get('/', (req, res) => {
  const db = getDatabase();
  const templates = db.prepare('SELECT * FROM environment_templates').all();
  const models = db.prepare('SELECT * FROM model_settings').all();

  res.json({
    general: {
      theme: 'dark',
      storageRoot: config.storage.root,
      defaultLanguage: 'python'
    },
    docker: {
      socketPath: config.docker.socketPath,
      defaultCpuLimit: config.docker.defaultCpuLimit,
      defaultMemoryLimitMb: config.docker.defaultMemoryLimit / (1024 * 1024),
      defaultNetworkEnabled: config.docker.defaultNetworkEnabled
    },
    ai: {
      ollamaUrl: OllamaService.getBaseUrl(),
      defaultModel: config.defaultModel,
      models
    },
    templates
  });
});

settingsRouter.patch('/', (req, res) => {
  try {
    const { ollamaUrl, defaultCpuLimit, defaultMemoryLimitMb } = req.body;
    if (ollamaUrl) {
      OllamaService.setBaseUrl(ollamaUrl);
    }
    if (defaultCpuLimit) {
      config.docker.defaultCpuLimit = Number(defaultCpuLimit);
    }
    if (defaultMemoryLimitMb) {
      config.docker.defaultMemoryLimit = Number(defaultMemoryLimitMb) * 1024 * 1024;
    }

    res.json({ success: true, message: 'Settings updated' });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});
