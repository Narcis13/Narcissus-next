// db/fix-migration-state.ts
import postgres from 'postgres';
import { config } from "dotenv";

config({ path: ".env.local" });

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set in .env');
}

async function fixMigrationState() {
  console.log('Connecting to database...');
  const connectionString = process.env.DATABASE_URL!;
  const sql = postgres(connectionString, { max: 1 });

  try {
    // Check current migration state
    const migrations = await sql`
      SELECT * FROM drizzle.__drizzle_migrations ORDER BY created_at
    `;

    console.log('Current migrations in database:', migrations.length);
    migrations.forEach(m => console.log(`- ${m.hash}`));

    // Check if first migration is missing
    const firstMigrationExists = migrations.some(m => m.hash === '0000_oval_annihilus');

    if (!firstMigrationExists) {
      console.log('First migration not recorded, adding it...');
      
      await sql`
        INSERT INTO drizzle.__drizzle_migrations (hash, created_at)
        VALUES ('0000_oval_annihilus', EXTRACT(EPOCH FROM NOW()) * 1000)
      `;
      
      console.log('✅ First migration marked as applied');
    } else {
      console.log('✅ Migration state looks correct');
    }

  } catch (error) {
    console.error('Error fixing migration state:', error);
  } finally {
    await sql.end();
  }
}

fixMigrationState().catch((err) => {
  console.error('Failed to fix migration state:', err);
  process.exit(1);
});
