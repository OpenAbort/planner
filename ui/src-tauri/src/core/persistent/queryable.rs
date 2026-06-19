pub trait QueryableSet<T, Key> {
    fn find_by_id(&self, key: Key) -> Option<&T>;
    fn insert(&mut self, entity: T);
    fn update(&mut self, entity: T);
    fn delete(&mut self, key: Key);
}