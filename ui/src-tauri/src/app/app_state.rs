use std::sync::{Mutex, MutexGuard};
use crate::core::persistent::in_mem_database::InMemDatabase;

pub struct ApplicationContainer {
    database: Mutex<InMemDatabase>,
}

impl ApplicationContainer {
    pub fn new() -> Self {
        Self {
            database: Mutex::new(InMemDatabase::new()),
        }
    }

    pub fn database(&self) -> MutexGuard<'_, InMemDatabase> {
        self.database.lock().unwrap()
    }
}
