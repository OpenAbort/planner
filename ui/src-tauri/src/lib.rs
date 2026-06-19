mod core;
mod tasks;
mod app;

use app::ApplicationContainer;
use tasks::commands::{add_task, delete_task, get_task, list_tasks, update_task_status};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(ApplicationContainer::new())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            add_task,
            get_task,
            list_tasks,
            update_task_status,
            delete_task
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
