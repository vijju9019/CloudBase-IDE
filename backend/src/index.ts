import express from 'express';
import http from 'node:http';
import cors from 'cors';
import path from 'node:path';
import fs from 'node:fs';
import { Server as SocketIOServer } from 'socket.io';
import { config } from './config.js';
import { StorageGuardian } from './storage/guardian.js';
import { getDatabase } from './database/index.js';
import { TerminalManager } from './websocket/terminal.js';

// Import route modules
import { healthRouter } from './routes/health.js';
import { projectsRouter } from './routes/projects.js';
import { filesRouter } from './routes/files.js';
import { dockerRouter } from './routes/docker.js';
import { executionRouter } from './routes/execution.js';
import { aiRouter } from './routes/ai.js';
import { storageRouter } from './routes/storage.js';
import { settingsRouter } from './routes/settings.js';

async function bootstrap() {
  console.log('----------------------------------------------------');
  console.log('🚀 Initializing CloudBase IDE Backend Service...');
  console.log('----------------------------------------------------');

  // 1. Initialize Storage Guardian boundaries and folders
  StorageGuardian.init();
  console.log(`[StorageGuardian] Root initialized at: ${config.storage.root}`);

  // 2. Initialize Database & Migrations
  const db = getDatabase();
  console.log('[Database] SQLite initialized with WAL mode.');

  const app = express();
  const server = http.createServer(app);

  // 3. Socket.IO for real-time container/sandbox terminals
  const io = new SocketIOServer(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  TerminalManager.register(io);
  console.log('[WebSocket] Real-time terminal bridge registered.');

  // 4. Middlewares
  app.use(cors({
    origin: '*',
    credentials: true
  }));
  app.use(express.json({ limit: '20mb' }));
  app.use(express.urlencoded({ extended: true, limit: '20mb' }));

  // 5. REST Endpoints
  app.use('/api', healthRouter);
  app.use('/api/projects', projectsRouter);
  app.use('/api/projects/:id/files', filesRouter);
  app.use('/api/docker', dockerRouter);
  app.use('/api', dockerRouter);
  app.use('/api', executionRouter);
  app.use('/api/ai', aiRouter);
  app.use('/api/storage', storageRouter);
  app.use('/api/settings', settingsRouter);

  // 6. Controlled Local Live Preview for Web / React projects
  // Proxies or serves static HTML/JS files strictly within the project workspace
  app.get('/api/preview/:projectId/*', (req, res) => {
    try {
      const { projectId } = req.params;
      const subPath = (req.params as any)[0] || 'index.html';
      const workspace = StorageGuardian.getProjectWorkspacePath(projectId);
      const safeFile = StorageGuardian.resolveSafeFilePath(workspace, subPath);

      if (fs.existsSync(safeFile) && !fs.statSync(safeFile).isDirectory()) {
        return res.sendFile(safeFile);
      }

      // Fallback to index.html if SPA route
      const indexFile = path.join(workspace, 'index.html');
      if (fs.existsSync(indexFile)) {
        return res.sendFile(indexFile);
      }

      res.status(404).send('Preview file not found in project workspace');
    } catch (err: any) {
      res.status(403).send(`Access Denied: ${err.message}`);
    }
  });

  // 7. Static serving of Frontend production build if available
  const possibleDistPaths = [
    path.resolve(process.cwd(), 'frontend/dist'),
    path.resolve(process.cwd(), '../frontend/dist'),
    path.resolve(__dirname, '../../frontend/dist')
  ];

  let frontendDist: string | null = null;
  for (const p of possibleDistPaths) {
    if (fs.existsSync(p)) {
      frontendDist = p;
      break;
    }
  }

  if (frontendDist) {
    console.log(`[Frontend] Serving production bundle from: ${frontendDist}`);
    app.use(express.static(frontendDist));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api') || req.path.startsWith('/socket.io')) {
        return next();
      }
      res.sendFile(path.join(frontendDist!, 'index.html'));
    });
  }

  // Global Error Handler
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('[Unhandled Error]', err);
    res.status(500).json({ error: err.message || 'Internal Server Error' });
  });

  server.listen(config.port, config.host, () => {
    console.log(`✅ CloudBase IDE Backend is listening on http://${config.host}:${config.port}`);
    console.log(`🌐 Ready for frontend connections from ${config.clientOrigin}`);
  });
}

bootstrap().catch((err) => {
  console.error('Fatal initialization error:', err);
  process.exit(1);
});
