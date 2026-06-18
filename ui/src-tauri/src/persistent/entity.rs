pub trait Entity<Key> {
    fn get_id(&self) -> &Key;
}