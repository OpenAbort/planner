use crate::app::ApplicationContainer;
use crate::common::constants::TASKS_COLLECTION;
use crate::tasks::model::Task;
use nanoid::nanoid;
use tauri::State;

#[tauri::command]
pub fn add_task(
    title: String,
    description: String,
    status: String,
    container: State<ApplicationContainer>,
) -> Result<Task, String> {
    if title.trim().is_empty() {
        return Err("Title cannot be empty".to_string());
    }

    let task = Task::new(nanoid!(), title, description, status);
    let mut db = container.database();

    db.add(TASKS_COLLECTION, task.clone());

    Ok(task)
}

#[tauri::command]
pub fn get_task(
    id: String,
    container: State<ApplicationContainer>,
) -> Result<Option<Task>, String> {
    let db = container.database();

    Ok(db.find::<Task>(TASKS_COLLECTION, &id).cloned())
}

#[tauri::command]
pub fn list_tasks(
    limit: usize,
    offset: usize,
    container: State<ApplicationContainer>) -> Result<Vec<Task>, String> {
    let db = container.database();

    Ok(db
        .list::<Task>(TASKS_COLLECTION, limit, offset)
        .into_iter()
        .cloned()
        .collect())
}

#[tauri::command]
pub fn update_task_status(
    id: String,
    status: String,
    container: State<ApplicationContainer>,
) -> Result<Option<Task>, String> {
    let mut db = container.database();
    let Some(existing_task) = db.find::<Task>(TASKS_COLLECTION, &id).cloned() else {
        return Ok(None);
    };

    let mut updated_task = existing_task;
    updated_task.set_status(status);
    db.update(TASKS_COLLECTION, updated_task.clone());

    Ok(Some(updated_task))
}

#[tauri::command]
pub fn update_task(
    id: String,
    title: String,
    description: String,
    status: String,
    container: State<ApplicationContainer>,
) -> Result<Option<Task>, String> {
    if title.trim().is_empty() {
        return Err("Title cannot be empty".to_string());
    }

    let mut db = container.database();
    let Some(existing_task) = db.find::<Task>(TASKS_COLLECTION, &id).cloned() else {
        return Ok(None);
    };

    let mut updated_task = existing_task;
    updated_task.update_details(title, description, status);
    db.update(TASKS_COLLECTION, updated_task.clone());

    Ok(Some(updated_task))
}

#[tauri::command]
pub fn delete_task(id: String, container: State<ApplicationContainer>) -> Result<bool, String> {
    let mut db = container.database();

    Ok(db.delete(TASKS_COLLECTION, &id))
}
