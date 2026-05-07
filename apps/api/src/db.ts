import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

export type Db = Database.Database;

export function openDb(path: string): Db {
  mkdirSync(dirname(path), { recursive: true });
  const db = new Database(path);
  db.pragma("journal_mode = WAL");
  db.exec(`
    CREATE TABLE IF NOT EXISTS skill_versions (
      name        TEXT NOT NULL,
      version     TEXT NOT NULL,
      uploaded_at TEXT NOT NULL,
      manifest    TEXT NOT NULL,
      PRIMARY KEY (name, version)
    );
  `);
  return db;
}
