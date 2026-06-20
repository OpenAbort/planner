use crate::core::persistent::entity::Entity;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct Task {
    pub id: String,
    pub title: String,
    pub description: String,
    pub status: String,
}

impl Task {
    pub fn new(id: String, title: String, description: String, status: String) -> Self {
        Self {
            id,
            title,
            description,
            status,
        }
    }

    pub fn set_status(&mut self, status: String) {
        self.status = status;
    }

    pub fn update_details(&mut self, title: String, description: String, status: String) {
        self.title = title;
        self.description = description;
        self.status = status;
    }
}

impl Entity<String> for Task {
    fn get_id(&self) -> &String {
        &self.id
    }
}
