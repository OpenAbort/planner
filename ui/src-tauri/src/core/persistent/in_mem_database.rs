use super::entity_set::{EntitySet, ThreadSharedEntitySet};
use crate::core::persistent::entity::StoredEntity;
use std::collections::HashMap;

pub struct InMemDatabase {
    db: HashMap<String, ThreadSharedEntitySet>,
}

impl InMemDatabase {
    pub fn new() -> Self {
        Self { db: HashMap::new() }
    }

    pub fn add<T: StoredEntity + 'static>(&mut self, collection: impl Into<String>, entity: T) {
        self.db
            .entry(collection.into())
            .or_insert_with(EntitySet::new)
            .add(Box::new(entity));
    }

    pub fn find<T: 'static>(&self, collection: &str, id: &str) -> Option<&T> {
        self.db.get(collection)?.iter().find_map(|entity| {
            if entity.get_id() == id {
                entity.as_any().downcast_ref::<T>()
            } else {
                None
            }
        })
    }

    pub fn list<T: 'static>(&self, collection: &str) -> Vec<&T> {
        self.db
            .get(collection)
            .map(|set| {
                set.iter()
                    .filter_map(|entity| entity.as_any().downcast_ref::<T>())
                    .collect()
            })
            .unwrap_or_default()
    }

    pub fn update<T: StoredEntity>(&mut self, collection: &str, entity: T) -> bool {
        if let Some(set) = self.db.get_mut(collection) {
            for existing in set.iter_mut() {
                if existing.get_id() == entity.get_id() {
                    *existing = Box::new(entity);
                    return true;
                }
            }
        }

        false
    }

    pub fn delete(&mut self, collection: &str, id: &str) -> bool {
        self.db
            .get_mut(collection)
            .map(|set| set.remove_by_id(&id.to_string()))
            .unwrap_or(false)
    }
}
