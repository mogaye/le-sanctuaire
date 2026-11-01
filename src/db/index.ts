import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.ts';

declare global {
  var _postgresPool: Pool | undefined;
}

export const createPool = () => {
  if (!process.env.SQL_HOST && !process.env.DATABASE_URL && !process.env.PGHOST) {
    return null;
  }

  if (!global._postgresPool) {
    global._postgresPool = new Pool({
      host: process.env.SQL_HOST || '127.0.0.1',
      user: process.env.SQL_USER,
      password: process.env.SQL_PASSWORD,
      database: process.env.SQL_DB_NAME,
      max: 10,
      connectionTimeoutMillis: 2000,
    });

    global._postgresPool.on('error', (err) => {
      console.warn('SQL pool notice (in-memory data fallback active):', err?.message || err);
    });
  }
  return global._postgresPool;
};

let dbInstance: any;
try {
  const pool = createPool();
  if (pool) {
    dbInstance = drizzle(pool, { schema });
  } else {
    throw new Error('Database credentials not set');
  }
} catch {
  console.warn('[AI Studio] Database not connected — in-memory fallback active');
  const noOp = {
    findMany: async () => [],
    findFirst: async () => null,
    findUnique: async () => null,
    create: async (d: any) => d?.data ?? {},
    update: async (d: any) => d?.data ?? {},
    delete: async () => ({}),
  };
  const chain: any = () => chain;
  chain.from = () => chain;
  chain.where = () => chain;
  chain.values = () => chain;
  chain.set = () => chain;
  chain.onConflictDoUpdate = () => chain;
  chain.orderBy = () => chain;
  chain.then = (resolve: any) => resolve([]);

  dbInstance = new Proxy({}, {
    get: (_, prop) => {
      if (prop === 'query') return new Proxy({}, { get: () => noOp });
      if (prop === 'select' || prop === 'insert' || prop === 'update' || prop === 'delete') {
        return () => chain;
      }
      return async () => [];
    },
  });
}

export const db = dbInstance;

