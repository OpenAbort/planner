use crate::kafka::{self, TaskSubmittedEvent};
use rusqlite::Connection;
use std::path::PathBuf;
use std::sync::{Mutex, MutexGuard};

pub struct ApplicationContainer {
    database: Mutex<Connection>,
    kafka_bootstrap_servers: Mutex<Option<String>>,
}

impl ApplicationContainer {
    pub fn new(database_path: PathBuf) -> rusqlite::Result<Self> {
        let connection = Connection::open(database_path)?;
        initialize_schema(&connection)?;

        let kafka_bootstrap_servers = connection
            .query_row(
                "SELECT value FROM app_preferences WHERE key = 'kafka.bootstrap_servers'",
                [],
                |row| row.get::<_, String>(0),
            )
            .ok();

        Ok(Self {
            database: Mutex::new(connection),
            kafka_bootstrap_servers: Mutex::new(kafka_bootstrap_servers),
        })
    }

    pub fn database(&self) -> MutexGuard<'_, Connection> {
        self.database.lock().unwrap()
    }

    pub fn update_kafka_servers(&self, bootstrap_servers: &str) {
        *self.kafka_bootstrap_servers.lock().unwrap() = Some(bootstrap_servers.to_string());
    }

    /// Spawns a Tokio task to publish the event — never blocks the caller.
    pub fn publish_task_submitted(&self, task_id: String, prompt: String) {
        let servers = self.kafka_bootstrap_servers.lock().unwrap().clone();
        let Some(servers) = servers else { return };

        let event = TaskSubmittedEvent {
            task_id,
            user_id: "local-user".to_string(),
            prompt,
            submitted_at: chrono::Utc::now().to_rfc3339(),
        };

        tokio::spawn(async move {
            kafka::publish_event(servers, event).await;
        });
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
            start_date TEXT,
            due_date TEXT,
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

    let task_columns = connection
        .prepare("PRAGMA table_info(tasks)")?
        .query_map([], |row| row.get::<_, String>(1))?
        .collect::<Result<Vec<_>, _>>()?;

    if !task_columns
        .iter()
        .any(|column_name| column_name == "start_date")
    {
        connection.execute("ALTER TABLE tasks ADD COLUMN start_date TEXT", [])?;
    }

    if !task_columns
        .iter()
        .any(|column_name| column_name == "due_date")
    {
        connection.execute("ALTER TABLE tasks ADD COLUMN due_date TEXT", [])?;
    }

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
