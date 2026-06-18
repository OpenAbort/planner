mod commands;
mod persistent;
use commands::add_todo;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![add_todo])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
