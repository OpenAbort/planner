#[tauri::command]
pub fn add_todo(title: String) -> Result<String, String> {
    if title.trim().is_empty() {
        return Err("Title cannot be empty".to_string());
    }

    Ok(format!("Added todo: {}", title))
}