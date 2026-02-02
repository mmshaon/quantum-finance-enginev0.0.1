import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import multipart from '@fastify/multipart';
import rateLimit from '@fastify/rate-limit';
import dotenv from 'dotenv';
import { prismaPlugin } from './plugins/prisma';
import errorHandler from './plugins/error-handler';
import authPlugin from './plugins/auth';
import authRoutes from './routes/auth';
import dashboardRoutes from './routes/dashboard';
import controlPanelRoutes from './routes/control-panel';
import expensesRoutes from './routes/expenses';
import incomeRoutes from './routes/income';
import projectsRoutes from './routes/projects';
import hrRoutes from './routes/hr';
import settingsRoutes from './routes/settings';

dotenv.config({ path: '../../.env' });

const server = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
    transport: {
      target: 'pino-pretty',
      options: {
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname'
      }
    }
  }
});

async function start() {
  try {
    // Register plugins
    await server.register(cors, {
      origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      credentials: true
    });

    await server.register(helmet, {
      contentSecurityPolicy: false
    });

    await server.register(multipart, {
      limits: {
        fileSize: 5 * 1024 * 1024 // 5MB
      }
    });

    await server.register(rateLimit, {
      max: 100,
      timeWindow: '1 minute'
    });

    await server.register(prismaPlugin);
    await server.register(authPlugin);
    await server.register(errorHandler);

    // Register routes
    await server.register(authRoutes, { prefix: '/auth' });
    await server.register(dashboardRoutes, { prefix: '/dashboard' });
    await server.register(controlPanelRoutes, { prefix: '/control-panel' });
    await server.register(expensesRoutes, { prefix: '/expenses' });
    await server.register(incomeRoutes, { prefix: '/income' });
    await server.register(projectsRoutes, { prefix: '/projects' });
    await server.register(hrRoutes, { prefix: '/hr' });
    await server.register(settingsRoutes, { prefix: '/settings' });

    // Health check
    server.get('/health', async () => {
      return { status: 'healthy', timestamp: new Date().toISOString() };
    });

    // Start server
    const PORT = Number(process.env.API_PORT) || 3001;
    const HOST = process.env.API_HOST || '0.0.0.0';

    await server.listen({ port: PORT, host: HOST });
    
    console.log('');
    console.log('========================================');
    console.log('🚀 Quantum Finance Engine API');
    console.log('========================================');
    console.log(`Server running on http://${HOST}:${PORT}`);
    console.log('');
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nShutting down gracefully...');
  await server.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\nShutting down gracefully...');
  await server.close();
  process.exit(0);
});

start();
