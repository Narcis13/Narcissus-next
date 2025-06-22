// lib/db.ts
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { schema } from '@/db/schema'; // Import your schema

// Ensure the DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

// Create the connection client
const client = postgres(process.env.DATABASE_URL);

// Create the Drizzle instance
// We pass the client and the schema to it.
export const db = drizzle(client, { schema });