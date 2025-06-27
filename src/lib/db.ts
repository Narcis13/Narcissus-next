// lib/db.ts
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { schema } from '@/db/schema'; // Import your schema

// Ensure the DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

// Use global to persist the connection across hot reloads in development
declare global {
  var __db: ReturnType<typeof drizzle> | undefined;
  var __dbClient: postgres.Sql | undefined;
}

// Create the connection client
if (!global.__dbClient) {
  console.log('[Database] Creating new database connection for process:', process.pid);
  
  global.__dbClient = postgres(process.env.DATABASE_URL!, {
    // Disable prepared statements for PgBouncer compatibility
    prepare: false,
    // Set to session pooling mode behavior
    connection: {
      application_name: `nextjs_${process.pid}`,
    },
    // Ensure connections are not reused across requests
    max: 1,
  });
}

// Create the Drizzle instance
if (!global.__db) {
  global.__db = drizzle(global.__dbClient, { schema });
}

export const db = global.__db;