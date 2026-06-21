use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct Task {
    pub id: String,
    pub title: String,
    pub description: String,
    pub status: String,
    #[serde(rename = "startDate")]
    pub start_date: Option<String>,
    #[serde(rename = "dueDate")]
    pub due_date: Option<String>,
}

impl Task {
    pub fn new(
        id: String,
        title: String,
        description: String,
        status: String,
        start_date: Option<String>,
        due_date: Option<String>,
    ) -> Self {
        Self {
            id,
            title,
            description,
            status,
            start_date,
            due_date,
        }
    }
}

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct TaskPrerequisite {
    #[serde(rename = "prerequisiteTaskId")]
    pub prerequisite_task_id: String,
    #[serde(rename = "taskId")]
    pub task_id: String,
    pub label: Option<String>,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct TaskPlannerPosition {
    #[serde(rename = "taskId")]
    pub task_id: String,
    pub x: f64,
    pub y: f64,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct AppPreference {
    pub key: String,
    pub value: String,
}

impl AppPreference {
    pub fn new(key: String, value: String) -> Self {
        Self { key, value }
    }
}

impl TaskPlannerPosition {
    pub fn new(task_id: String, x: f64, y: f64) -> Self {
        Self { task_id, x, y }
    }
}

impl TaskPrerequisite {
    pub fn new(prerequisite_task_id: String, task_id: String, label: Option<String>) -> Self {
        Self {
            prerequisite_task_id,
            task_id,
            label,
        }
    }
}
