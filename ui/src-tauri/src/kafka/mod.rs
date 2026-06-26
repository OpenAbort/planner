use chrono::Utc;
use rskafka::client::partition::{Compression, UnknownTopicHandling};
use rskafka::client::ClientBuilder;
use rskafka::record::Record;
use serde::Serialize;
use std::collections::BTreeMap;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TaskSubmittedEvent {
    pub task_id: String,
    pub user_id: String,
    pub prompt: String,
    pub submitted_at: String,
}

pub async fn publish_event(bootstrap_servers: String, event: TaskSubmittedEvent) {
    let hosts: Vec<String> = bootstrap_servers
        .split(',')
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty())
        .collect();

    let client = match ClientBuilder::new(hosts).build().await {
        Ok(c) => c,
        Err(e) => {
            eprintln!("Kafka connect failed: {e}");
            return;
        }
    };

    let partition_client = match client
        .partition_client("task.submitted", 0, UnknownTopicHandling::Retry)
        .await
    {
        Ok(c) => c,
        Err(e) => {
            eprintln!("Kafka partition error: {e}");
            return;
        }
    };

    let key = event.task_id.as_bytes().to_vec();
    let payload = match serde_json::to_vec(&event) {
        Ok(p) => p,
        Err(e) => {
            eprintln!("Kafka serialize failed: {e}");
            return;
        }
    };

    if let Err(e) = partition_client
        .produce(
            vec![Record {
                key: Some(key),
                value: Some(payload),
                headers: BTreeMap::new(),
                timestamp: Utc::now(),
            }],
            Compression::NoCompression,
        )
        .await
    {
        eprintln!("Failed to publish task.submitted: {e}");
    }
}
