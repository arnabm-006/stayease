import EmbeddedPostgres from 'embedded-postgres';
import net from 'net';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = parseInt(process.env.PG_PORT || '5433', 10);
const DATA_DIR = path.resolve(__dirname, '../../../pgdata');

function isPortOpen(port: number, host = '127.0.0.1'): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(1000);
    socket.once('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.once('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.once('error', () => {
      socket.destroy();
      resolve(false);
    });
    socket.connect(port, host);
  });
}

export async function ensurePostgresRunning(): Promise<void> {
  const isRunning = await isPortOpen(PORT);
  if (isRunning) {
    console.log(`[Database] PostgreSQL is already running and reachable on port ${PORT}.`);
    return;
  }

  console.log(`[Database] Starting Embedded PostgreSQL server on port ${PORT}...`);
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  const pg = new EmbeddedPostgres({
    databaseDir: DATA_DIR,
    port: PORT,
    user: 'postgres',
    password: 'postgres',
    persistent: true,
  });

  const clusterInitFile = path.join(DATA_DIR, 'PG_VERSION');
  if (!fs.existsSync(clusterInitFile)) {
    console.log('[Database] Initializing new PostgreSQL data cluster in:', DATA_DIR);
    await pg.initialise();
  }

  await pg.start();
  console.log(`[Database] PostgreSQL server started successfully on 127.0.0.1:${PORT}`);

  try {
    await pg.createDatabase('stayease');
    console.log('[Database] Database "stayease" verified / created.');
  } catch (err: any) {
    // Database might already exist, which is expected
    if (!err?.message?.includes('already exists')) {
      console.log('[Database] Database creation note:', err?.message || err);
    }
  }

  process.on('SIGINT', async () => {
    console.log('[Database] Shutting down PostgreSQL gracefully...');
    try {
      await pg.stop();
    } catch {}
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('[Database] Shutting down PostgreSQL gracefully...');
    try {
      await pg.stop();
    } catch {}
    process.exit(0);
  });
}

// If executed directly via CLI
if (process.argv[1] && process.argv[1].includes('embeddedPg')) {
  ensurePostgresRunning().then(() => {
    console.log('[Database] Embedded PostgreSQL daemon ready.');
  }).catch((err) => {
    console.error('[Database] Failed to start Embedded PostgreSQL:', err);
    process.exit(1);
  });
}
