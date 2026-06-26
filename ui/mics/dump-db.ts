import { Database } from "bun:sqlite";
import { mkdirSync, writeFileSync } from "fs";
import { join, resolve } from "path";

const APPDATA = process.env.APPDATA ?? process.env.HOME;
const DB_PATH = resolve(APPDATA!, "com.openabort.planner.ui/openabort-planner.sqlite3");
const OUT_DIR = resolve(import.meta.dir);

console.log(`Reading from: ${DB_PATH}\n`);

const db = new Database(DB_PATH, { readonly: true });

const existingTables = new Set(
  db
    .query<{ name: string }, []>("SELECT name FROM sqlite_master WHERE type='table'")
    .all()
    .map((r) => r.name)
);

const tables = [
  "tasks",
  "task_prerequisites",
  "task_planner_positions",
  "app_preferences",
] as const;

mkdirSync(OUT_DIR, { recursive: true });

for (const table of tables) {
  if (!existingTables.has(table)) {
    console.log(`⚠  ${table}: table not found, skipping`);
    continue;
  }

  const rows = db.query(`SELECT * FROM ${table}`).all();
  const outPath = join(OUT_DIR, `${table}.json`);
  writeFileSync(outPath, JSON.stringify(rows, null, 2));
  console.log(`✓ ${table}: ${rows.length} rows → mics/${table}.json`);
}

db.close();
console.log("\nDone. Use in tests: import tasks from '../mics/tasks.json'");
