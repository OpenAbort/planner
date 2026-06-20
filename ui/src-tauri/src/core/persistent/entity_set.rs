use super::entity::{Entity, StoredEntity};
use super::queryable::QueryableSet;
use std::marker::PhantomData;

pub struct EntitySet<T, Key> {
    data: Vec<T>,
    _key_type: PhantomData<Key>,
}

impl<T, Key> EntitySet<T, Key> {
    pub fn new() -> Self {
        Self {
            data: Vec::new(),
            _key_type: PhantomData,
        }
    }

    pub fn add(&mut self, entity: T) {
        self.data.push(entity);
    }

    pub fn iter(&self) -> impl Iterator<Item = &T> {
        self.data.iter()
    }

    pub fn iter_mut(&mut self) -> impl Iterator<Item = &mut T> {
        self.data.iter_mut()
    }

    pub fn remove_by_id(&mut self, key: &Key) -> bool
    where
        T: Entity<Key>,
        Key: PartialEq,
    {
        let initial_len = self.data.len();
        self.data.retain(|entity| entity.get_id() != key);
        self.data.len() != initial_len
    }
}

impl<T, Key> QueryableSet<T, Key> for EntitySet<T, Key>
where
    T: Entity<Key>,
    Key: PartialEq,
{
    fn find_by_id(&self, key: Key) -> Option<&T> {
        self.data.iter().find(|entity| entity.get_id() == &key)
    }

    fn insert(&mut self, entity: T) {
        self.add(entity);
    }

    fn update(&mut self, entity: T) {
        if let Some(index) = self
            .data
            .iter()
            .position(|existing| existing.get_id() == entity.get_id())
        {
            self.data[index] = entity;
        }
    }

    fn delete(&mut self, key: Key) {
        self.data.retain(|entity| entity.get_id() != &key);
    }
}

pub type ThreadSharedEntitySet = EntitySet<Box<dyn StoredEntity>, String>;
