// db/migrate.ts
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { config } from "dotenv";
config({ path: ".env.local" });
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set in .env');
}

async function runMigrations() {
  console.log('Connecting to database...');
  const connectionString = process.env.DATABASE_URL!;
  // For migrations, it's good practice to use a connection with max: 1
  const sql = postgres(connectionString, { max: 1 });
  const db = drizzle(sql);

  console.log('Running migrations...');
  
  await migrate(db, { migrationsFolder: 'src/db/migrations' });

  console.log('Migrations completed successfully!');
  
  // It's important to end the connection, otherwise the script will hang
  await sql.end();
}

runMigrations().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});