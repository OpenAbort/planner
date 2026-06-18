use std::any::Any;
use std::collections::HashMap;

use super::entity_set::EntitySet;

pub struct InMemDatabase {
    db: HashMap<String, EntitySet<Box<dyn Any>, String>>,
}

impl InMemDatabase {
    pub fn new() -> Self {
        Self {
            db: HashMap::new(),
        }
    }

    pub fn add<T: Any>(&mut self, collection: impl Into<String>, entity: T) {
        self.db
            .entry(collection.into())
            .or_insert_with(EntitySet::new)
            .add(Box::new(entity));
    }
}
