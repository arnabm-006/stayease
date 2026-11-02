import { app } from './app.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import { ensurePostgresRunning } from './config/embeddedPg.js';
import { startBookingHoldCleanerJob } from './jobs/bookingHoldCleaner.js';
import { prisma } from './config/db.js';

async function bootstrap() {
  try {
    // 1. Verify PostgreSQL availability
    await ensurePostgresRunning();

    // 2. Start background clean-up job for expired holds
    const cleanerInterval = startBookingHoldCleanerJob(60000);

    // 3. Start Express server
    const server = app.listen(env.PORT, () => {
      logger.info(`🚀 StayEase API Server running on port ${env.PORT}`);
      logger.info(`🌐 Environment: ${env.NODE_ENV}`);
      logger.info(`🔗 API Base URL: ${env.API_BASE_URL}`);
      logger.info(`✨ Ready to accept client connections.`);
    });

    const shutdown = async (signal: string) => {
      logger.info(`Received ${signal}. Shutting down gracefully...`);
      clearInterval(cleanerInterval);
      server.close(async () => {
        await prisma.$disconnect();
        logger.info('Closed out remaining connections. Process exited.');
        process.exit(0);
      });
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  } catch (err: any) {
    logger.error('Fatal error during server bootstrap:', err?.message || err);
    process.exit(1);
  }
}

bootstrap();
