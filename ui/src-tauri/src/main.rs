// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
mod commands;

use crate::commands::add_todo;

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            add_todo
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri app");
}
