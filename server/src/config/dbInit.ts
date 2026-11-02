import { ensurePostgresRunning } from './embeddedPg.js';
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log('[Setup] Checking PostgreSQL server...');
  await ensurePostgresRunning();

  console.log('[Setup] Applying Prisma schema (db push)...');
  const serverDir = path.resolve(__dirname, '../../');
  
  execSync('npm run prisma:migrate', {
    cwd: serverDir,
    stdio: 'inherit',
    env: process.env,
  });

  console.log('[Setup] Database migrations / push completed successfully!');
}

main().catch((err) => {
  console.error('[Setup] Error initializing database:', err);
  process.exit(1);
});
