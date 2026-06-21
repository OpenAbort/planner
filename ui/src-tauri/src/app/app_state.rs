use rusqlite::Connection;
use std::path::PathBuf;
use std::sync::{Mutex, MutexGuard};

pub struct ApplicationContainer {
    database: Mutex<Connection>,
}

impl ApplicationContainer {
    pub fn new(database_path: PathBuf) -> rusqlite::Result<Self> {
        let connection = Connection::open(database_path)?;
        initialize_schema(&connection)?;

        Ok(Self {
            database: Mutex::new(connection),
        })
    }

    pub fn database(&self) -> MutexGuard<'_, Connection> {
        self.database.lock().unwrap()
    }
}

fn initialize_schema(connection: &Connection) -> rusqlite::Result<()> {
    connection.execute_batch(
        "
        PRAGMA foreign_keys = ON;

        CREATE TABLE IF NOT EXISTS tasks (
            id TEXT PRIMARY KEY NOT NULL,
            title TEXT NOT NULL,
            description TEXT NOT NULL,
            status TEXT NOT NULL,
            created_at INTEGER NOT NULL DEFAULT (unixepoch())
        );

        CREATE TABLE IF NOT EXISTS task_prerequisites (
            prerequisite_task_id TEXT NOT NULL,
            task_id TEXT NOT NULL,
            label TEXT,
            PRIMARY KEY (prerequisite_task_id, task_id),
            FOREIGN KEY (prerequisite_task_id) REFERENCES tasks(id) ON DELETE CASCADE,
            FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
            CHECK (prerequisite_task_id <> task_id)
        );

        CREATE TABLE IF NOT EXISTS task_planner_positions (
            task_id TEXT PRIMARY KEY NOT NULL,
            x REAL NOT NULL,
            y REAL NOT NULL,
            FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS app_preferences (
            key TEXT PRIMARY KEY NOT NULL,
            value TEXT NOT NULL,
            updated_at INTEGER NOT NULL DEFAULT (unixepoch())
        );
        ",
    )?;

    let has_prerequisite_label = connection
        .prepare("PRAGMA table_info(task_prerequisites)")?
        .query_map([], |row| row.get::<_, String>(1))?
        .collect::<Result<Vec<_>, _>>()?
        .iter()
        .any(|column_name| column_name == "label");

    if !has_prerequisite_label {
        connection.execute("ALTER TABLE task_prerequisites ADD COLUMN label TEXT", [])?;
    }

    Ok(())
}
