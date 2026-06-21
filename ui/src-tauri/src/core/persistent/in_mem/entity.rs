use std::any::Any;

pub trait Entity<Key> {
    fn get_id(&self) -> &Key;
}

pub trait StoredEntity: Entity<String> + Any + Send + Sync {
    fn as_any(&self) -> &dyn Any;
}

impl<T> StoredEntity for T
where
    T: Entity<String> + Any + Send + Sync,
{
    fn as_any(&self) -> &dyn Any {
        self
    }
}

impl Entity<String> for Box<dyn StoredEntity> {
    fn get_id(&self) -> &String {
        self.as_ref().get_id()
    }
}
