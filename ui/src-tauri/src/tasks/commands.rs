use crate::app::ApplicationContainer;
use crate::tasks::model::{AppPreference, Task, TaskPlannerPosition, TaskPrerequisite};
use nanoid::nanoid;
use rusqlite::{params, Connection, OptionalExtension};
use std::collections::{HashMap, HashSet};
use tauri::State;

#[tauri::command]
pub fn add_task(
    title: String,
    description: String,
    status: String,
    start_date: Option<String>,
    due_date: Option<String>,
    container: State<ApplicationContainer>,
) -> Result<Task, String> {
    if title.trim().is_empty() {
        return Err("Title cannot be empty".to_string());
    }

    let schedule = validate_task_schedule(start_date, due_date)?;
    let task = Task::new(
        nanoid!(),
        title,
        description,
        status,
        schedule.start_date,
        schedule.due_date,
    );
    let db = container.database();

    db.execute(
        "
        INSERT INTO tasks (id, title, description, status, start_date, due_date)
        VALUES (?1, ?2, ?3, ?4, ?5, ?6)
        ",
        params![
            &task.id,
            &task.title,
            &task.description,
            &task.status,
            &task.start_date,
            &task.due_date
        ],
    )
    .map_err(|error| error.to_string())?;

    drop(db);

    let prompt = format!("{} {}", task.title, task.description)
        .trim()
        .to_string();
    container.publish_task_submitted(task.id.clone(), prompt);

    Ok(task)
}

#[tauri::command]
pub fn get_task(
    id: String,
    container: State<ApplicationContainer>,
) -> Result<Option<Task>, String> {
    let db = container.database();

    find_task(&db, &id).map_err(|error| error.to_string())
}

#[tauri::command]
pub fn list_tasks(
    limit: usize,
    offset: usize,
    container: State<ApplicationContainer>,
) -> Result<Vec<Task>, String> {
    let db = container.database();
    let mut statement = db
        .prepare(
            "
            SELECT id, title, description, status, start_date, due_date
            FROM tasks
            ORDER BY created_at DESC, rowid DESC
            LIMIT ?1 OFFSET ?2
            ",
        )
        .map_err(|error| error.to_string())?;

    let tasks = statement
        .query_map(params![limit as i64, offset as i64], row_to_task)
        .map_err(|error| error.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|error| error.to_string())?;

    Ok(tasks)
}

#[tauri::command]
pub fn search_tasks(
    query: String,
    limit: usize,
    offset: usize,
    container: State<ApplicationContainer>,
) -> Result<Vec<Task>, String> {
    let db = container.database();
    let mut statement = db
        .prepare(
            "
            SELECT id, title, description, status, start_date, due_date
            FROM tasks
            WHERE title LIKE ?1 ESCAPE '\\'
            ORDER BY created_at DESC, rowid DESC
            LIMIT ?2 OFFSET ?3
            ",
        )
        .map_err(|error| error.to_string())?;

    let pattern = format!("%{}%", escape_like(&query));
    let tasks = statement
        .query_map(params![pattern, limit as i64, offset as i64], row_to_task)
        .map_err(|error| error.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|error| error.to_string())?;

    Ok(tasks)
}

// Escape LIKE wildcards so a literal % or _ in the query isn't treated as a pattern.
fn escape_like(input: &str) -> String {
    input
        .replace('\\', "\\\\")
        .replace('%', "\\%")
        .replace('_', "\\_")
}

#[tauri::command]
pub fn update_task_status(
    id: String,
    status: String,
    container: State<ApplicationContainer>,
) -> Result<Option<Task>, String> {
    let db = container.database();

    db.execute(
        "UPDATE tasks SET status = ?1 WHERE id = ?2",
        params![&status, &id],
    )
    .map_err(|error| error.to_string())?;

    find_task(&db, &id).map_err(|error| error.to_string())
}

#[tauri::command]
pub fn update_task(
    id: String,
    title: String,
    description: String,
    status: String,
    start_date: Option<String>,
    due_date: Option<String>,
    container: State<ApplicationContainer>,
) -> Result<Option<Task>, String> {
    if title.trim().is_empty() {
        return Err("Title cannot be empty".to_string());
    }

    let schedule = validate_task_schedule(start_date, due_date)?;
    let db = container.database();

    db.execute(
        "
        UPDATE tasks
        SET title = ?1, description = ?2, status = ?3, start_date = ?4, due_date = ?5
        WHERE id = ?6
        ",
        params![
            &title,
            &description,
            &status,
            &schedule.start_date,
            &schedule.due_date,
            &id
        ],
    )
    .map_err(|error| error.to_string())?;

    find_task(&db, &id).map_err(|error| error.to_string())
}

#[tauri::command]
pub fn delete_task(id: String, container: State<ApplicationContainer>) -> Result<bool, String> {
    let db = container.database();
    let deleted = db
        .execute("DELETE FROM tasks WHERE id = ?1", params![&id])
        .map_err(|error| error.to_string())?;

    Ok(deleted > 0)
}

#[tauri::command]
pub fn list_task_prerequisites(
    container: State<ApplicationContainer>,
) -> Result<Vec<TaskPrerequisite>, String> {
    let db = container.database();
    let mut statement = db
        .prepare(
            "
            SELECT prerequisite_task_id, task_id, label
            FROM task_prerequisites
            ORDER BY prerequisite_task_id, task_id
            ",
        )
        .map_err(|error| error.to_string())?;

    let links = statement
        .query_map([], row_to_task_prerequisite)
        .map_err(|error| error.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|error| error.to_string())?;

    Ok(links)
}

#[tauri::command]
pub fn add_task_prerequisite(
    prerequisite_task_id: String,
    task_id: String,
    container: State<ApplicationContainer>,
) -> Result<bool, String> {
    if prerequisite_task_id == task_id {
        return Err("A task cannot be its own prerequisite.".to_string());
    }

    let db = container.database();

    if find_task(&db, &prerequisite_task_id)
        .map_err(|error| error.to_string())?
        .is_none()
        || find_task(&db, &task_id)
            .map_err(|error| error.to_string())?
            .is_none()
    {
        return Err("Both tasks must exist before linking prerequisites.".to_string());
    }

    let links = load_prerequisite_links(&db).map_err(|error| error.to_string())?;

    if links
        .iter()
        .any(|link| link.prerequisite_task_id == prerequisite_task_id && link.task_id == task_id)
    {
        return Ok(false);
    }

    if would_create_cycle(&links, &prerequisite_task_id, &task_id) {
        return Err("That prerequisite would create a cycle.".to_string());
    }

    let inserted = db
        .execute(
            "
            INSERT OR IGNORE INTO task_prerequisites (prerequisite_task_id, task_id)
            VALUES (?1, ?2)
            ",
            params![&prerequisite_task_id, &task_id],
        )
        .map_err(|error| error.to_string())?;

    Ok(inserted > 0)
}

#[tauri::command]
pub fn update_task_prerequisite_label(
    prerequisite_task_id: String,
    task_id: String,
    label: String,
    container: State<ApplicationContainer>,
) -> Result<Option<TaskPrerequisite>, String> {
    let db = container.database();
    let trimmed_label = label.trim();
    let next_label = if trimmed_label.is_empty() {
        None
    } else {
        Some(trimmed_label.to_string())
    };

    let updated = db
        .execute(
            "
            UPDATE task_prerequisites
            SET label = ?3
            WHERE prerequisite_task_id = ?1 AND task_id = ?2
            ",
            params![&prerequisite_task_id, &task_id, &next_label],
        )
        .map_err(|error| error.to_string())?;

    if updated == 0 {
        return Ok(None);
    }

    Ok(Some(TaskPrerequisite::new(
        prerequisite_task_id,
        task_id,
        next_label,
    )))
}

#[tauri::command]
pub fn delete_task_prerequisite(
    prerequisite_task_id: String,
    task_id: String,
    container: State<ApplicationContainer>,
) -> Result<bool, String> {
    let db = container.database();
    let deleted = db
        .execute(
            "
            DELETE FROM task_prerequisites
            WHERE prerequisite_task_id = ?1 AND task_id = ?2
            ",
            params![&prerequisite_task_id, &task_id],
        )
        .map_err(|error| error.to_string())?;

    Ok(deleted > 0)
}

#[tauri::command]
pub fn clear_task_prerequisites(
    task_id: String,
    container: State<ApplicationContainer>,
) -> Result<usize, String> {
    let db = container.database();
    let deleted = db
        .execute(
            "DELETE FROM task_prerequisites WHERE task_id = ?1",
            params![&task_id],
        )
        .map_err(|error| error.to_string())?;

    Ok(deleted)
}

#[tauri::command]
pub fn list_task_planner_positions(
    container: State<ApplicationContainer>,
) -> Result<Vec<TaskPlannerPosition>, String> {
    let db = container.database();
    let mut statement = db
        .prepare(
            "
            SELECT task_id, x, y
            FROM task_planner_positions
            ORDER BY task_id
            ",
        )
        .map_err(|error| error.to_string())?;

    let positions = statement
        .query_map([], row_to_task_planner_position)
        .map_err(|error| error.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|error| error.to_string())?;

    Ok(positions)
}

#[tauri::command]
pub fn upsert_task_planner_position(
    task_id: String,
    x: f64,
    y: f64,
    container: State<ApplicationContainer>,
) -> Result<TaskPlannerPosition, String> {
    let db = container.database();

    if find_task(&db, &task_id)
        .map_err(|error| error.to_string())?
        .is_none()
    {
        return Err("Task must exist before saving planner position.".to_string());
    }

    db.execute(
        "
        INSERT INTO task_planner_positions (task_id, x, y)
        VALUES (?1, ?2, ?3)
        ON CONFLICT(task_id) DO UPDATE SET x = excluded.x, y = excluded.y
        ",
        params![&task_id, x, y],
    )
    .map_err(|error| error.to_string())?;

    Ok(TaskPlannerPosition::new(task_id, x, y))
}

#[tauri::command]
pub fn reset_task_planner_positions(
    container: State<ApplicationContainer>,
) -> Result<usize, String> {
    let db = container.database();
    let deleted = db
        .execute("DELETE FROM task_planner_positions", [])
        .map_err(|error| error.to_string())?;

    Ok(deleted)
}

#[tauri::command]
pub fn get_app_preference(
    key: String,
    container: State<ApplicationContainer>,
) -> Result<Option<AppPreference>, String> {
    let db = container.database();

    db.query_row(
        "
        SELECT key, value
        FROM app_preferences
        WHERE key = ?1
        ",
        params![&key],
        row_to_app_preference,
    )
    .optional()
    .map_err(|error| error.to_string())
}

#[tauri::command]
pub fn upsert_app_preference(
    key: String,
    value: String,
    container: State<ApplicationContainer>,
) -> Result<AppPreference, String> {
    if key.trim().is_empty() {
        return Err("Preference key cannot be empty.".to_string());
    }

    let db = container.database();
    let preference = AppPreference::new(key, value);

    db.execute(
        "
        INSERT INTO app_preferences (key, value)
        VALUES (?1, ?2)
        ON CONFLICT(key) DO UPDATE
            SET value = excluded.value,
                updated_at = unixepoch()
        ",
        params![&preference.key, &preference.value],
    )
    .map_err(|error| error.to_string())?;

    Ok(preference)
}

#[tauri::command]
pub fn update_kafka_config(
    bootstrap_servers: String,
    container: State<ApplicationContainer>,
) -> Result<(), String> {
    let servers = bootstrap_servers.trim().to_string();
    if servers.is_empty() {
        return Err("Bootstrap servers cannot be empty.".to_string());
    }

    let db = container.database();
    db.execute(
        "
        INSERT INTO app_preferences (key, value)
        VALUES ('kafka.bootstrap_servers', ?1)
        ON CONFLICT(key) DO UPDATE
            SET value = excluded.value,
                updated_at = unixepoch()
        ",
        params![&servers],
    )
    .map_err(|error| error.to_string())?;
    drop(db);

    container.update_kafka_servers(&servers);
    Ok(())
}

fn find_task(connection: &Connection, id: &str) -> rusqlite::Result<Option<Task>> {
    connection
        .query_row(
            "
            SELECT id, title, description, status, start_date, due_date
            FROM tasks
            WHERE id = ?1
            ",
            params![id],
            row_to_task,
        )
        .optional()
}

fn load_prerequisite_links(connection: &Connection) -> rusqlite::Result<Vec<TaskPrerequisite>> {
    let mut statement = connection.prepare(
        "
        SELECT prerequisite_task_id, task_id, label
        FROM task_prerequisites
        ",
    )?;

    let links = statement
        .query_map([], row_to_task_prerequisite)?
        .collect::<Result<Vec<_>, _>>()?;

    Ok(links)
}

fn row_to_task(row: &rusqlite::Row<'_>) -> rusqlite::Result<Task> {
    Ok(Task {
        id: row.get(0)?,
        title: row.get(1)?,
        description: row.get(2)?,
        status: row.get(3)?,
        start_date: row.get(4)?,
        due_date: row.get(5)?,
    })
}

struct ValidatedSchedule {
    start_date: Option<String>,
    due_date: Option<String>,
}

fn validate_task_schedule(
    start_date: Option<String>,
    due_date: Option<String>,
) -> Result<ValidatedSchedule, String> {
    let start_date = normalize_datetime_local(start_date, "Start date")?;
    let due_date = normalize_datetime_local(due_date, "Due date")?;

    if let (Some(start_date), Some(due_date)) = (&start_date, &due_date) {
        if due_date < start_date {
            return Err("Due date must be on or after start date.".to_string());
        }
    }

    Ok(ValidatedSchedule {
        start_date,
        due_date,
    })
}

fn normalize_datetime_local(value: Option<String>, label: &str) -> Result<Option<String>, String> {
    let Some(value) = value else {
        return Ok(None);
    };

    let trimmed_value = value.trim();

    if trimmed_value.is_empty() {
        return Ok(None);
    }

    if is_datetime_local(trimmed_value) {
        Ok(Some(trimmed_value.to_string()))
    } else {
        Err(format!("{label} must use YYYY-MM-DDTHH:mm format."))
    }
}

fn is_datetime_local(value: &str) -> bool {
    let bytes = value.as_bytes();

    value.len() == 16
        && bytes[4] == b'-'
        && bytes[7] == b'-'
        && bytes[10] == b'T'
        && bytes[13] == b':'
        && bytes
            .iter()
            .enumerate()
            .all(|(index, byte)| matches!(index, 4 | 7 | 10 | 13) || byte.is_ascii_digit())
}

fn row_to_task_prerequisite(row: &rusqlite::Row<'_>) -> rusqlite::Result<TaskPrerequisite> {
    Ok(TaskPrerequisite::new(row.get(0)?, row.get(1)?, row.get(2)?))
}

fn row_to_task_planner_position(row: &rusqlite::Row<'_>) -> rusqlite::Result<TaskPlannerPosition> {
    Ok(TaskPlannerPosition::new(
        row.get(0)?,
        row.get(1)?,
        row.get(2)?,
    ))
}

fn row_to_app_preference(row: &rusqlite::Row<'_>) -> rusqlite::Result<AppPreference> {
    Ok(AppPreference::new(row.get(0)?, row.get(1)?))
}

fn would_create_cycle(
    links: &[TaskPrerequisite],
    prerequisite_task_id: &str,
    task_id: &str,
) -> bool {
    let mut dependents_by_prerequisite = HashMap::<&str, Vec<&str>>::new();

    for link in links {
        dependents_by_prerequisite
            .entry(&link.prerequisite_task_id)
            .or_default()
            .push(&link.task_id);
    }

    let mut stack = vec![task_id];
    let mut visited = HashSet::<&str>::new();

    while let Some(current_task_id) = stack.pop() {
        if !visited.insert(current_task_id) {
            continue;
        }

        if current_task_id == prerequisite_task_id {
            return true;
        }

        if let Some(dependents) = dependents_by_prerequisite.get(current_task_id) {
            stack.extend(dependents.iter().copied());
        }
    }

    false
}
