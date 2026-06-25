mod app;
mod core;
mod tasks;

use app::ApplicationContainer;
use tasks::commands::{
    add_task, add_task_prerequisite, clear_task_prerequisites, delete_task,
    delete_task_prerequisite, get_app_preference, get_task, list_task_planner_positions,
    list_task_prerequisites, list_tasks, reset_task_planner_positions, search_tasks, update_task,
    update_task_prerequisite_label, update_task_status, upsert_app_preference,
    upsert_task_planner_position,
};
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            let app_data_dir = app.path().app_data_dir()?;
            std::fs::create_dir_all(&app_data_dir)?;
            app.manage(ApplicationContainer::new(
                app_data_dir.join("openabort-planner.sqlite3"),
            )?);
            Ok(())
        })
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            add_task,
            get_task,
            list_tasks,
            search_tasks,
            update_task,
            update_task_status,
            delete_task,
            list_task_prerequisites,
            add_task_prerequisite,
            update_task_prerequisite_label,
            delete_task_prerequisite,
            clear_task_prerequisites,
            list_task_planner_positions,
            upsert_task_planner_position,
            reset_task_planner_positions,
            get_app_preference,
            upsert_app_preference
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
