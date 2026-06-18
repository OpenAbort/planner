pub struct Task {
    pub id: String,
    pub title: String,
    pub description: String,
    pub status: String,
}

impl Task {
    pub fn new(id: String, title: String, description: String) -> Self {
        Self {
            id,
            title,
            description,
        }
    }

    pub fn set_status(&mut self, status: String) {
        self.status = status;
    }
}
