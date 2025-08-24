use sha2::{Digest, Sha256};
use std::collections::HashSet;

pub struct IdGenerator {
    used_ids: HashSet<String>,
    node_counter: usize,
}

impl IdGenerator {
    pub fn new() -> Self {
        Self {
            used_ids: HashSet::new(),
            node_counter: 0,
        }
    }

    pub fn generate_hash_id(&mut self, node_type: &str, path: &[usize], prefix: &str) -> String {
        let path_string = path
            .iter()
            .map(|i| i.to_string())
            .collect::<Vec<_>>()
            .join(":");

        let content = format!(
            "{{\"type\":\"{}\",\"path\":\"{}\"}}",
            node_type, path_string
        );

        let mut hasher = Sha256::new();
        hasher.update(content.as_bytes());
        let result = hasher.finalize();
        let hash = format!("{:x}", result);
        let short_hash = &hash[..8];

        let id = format!("{}{}", prefix, short_hash);
        self.ensure_unique(id)
    }

    pub fn generate_slug_id(&mut self, text: &str, prefix: &str) -> String {
        if text.is_empty() {
            return self.generate_hash_id("unknown", &[], prefix);
        }

        let slug = text
            .to_lowercase()
            .trim()
            .chars()
            .map(|c| {
                if c.is_alphanumeric() || c == ' ' || c == '-' {
                    c
                } else {
                    ' '
                }
            })
            .collect::<String>()
            .split_whitespace()
            .collect::<Vec<_>>()
            .join("-")
            .chars()
            .take(50)
            .collect::<String>();

        let id = format!("{}{}", prefix, slug);
        self.ensure_unique(id)
    }

    pub fn generate_path_id(&mut self, node_type: &str, path: &[usize], prefix: &str) -> String {
        let path_string = if path.is_empty() {
            String::new()
        } else {
            format!(
                "-{}",
                path.iter()
                    .map(|i| i.to_string())
                    .collect::<Vec<_>>()
                    .join("-")
            )
        };

        let id = format!("{}{}{}", prefix, node_type, path_string);
        self.ensure_unique(id)
    }

    pub fn ensure_unique(&mut self, id: String) -> String {
        if !self.used_ids.contains(&id) {
            self.used_ids.insert(id.clone());
            return id;
        }

        let mut counter = 2;
        loop {
            let unique_id = format!("{}-{}", id, counter);
            if !self.used_ids.contains(&unique_id) {
                self.used_ids.insert(unique_id.clone());
                return unique_id;
            }
            counter += 1;
        }
    }

    pub fn extract_text_content(node: &impl TextExtractable) -> String {
        node.extract_text()
    }

    pub fn increment_counter(&mut self) {
        self.node_counter += 1;
    }

    pub fn get_counter(&self) -> usize {
        self.node_counter
    }
}

pub trait TextExtractable {
    fn extract_text(&self) -> String;
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_hash_id_generation() {
        let mut gen = IdGenerator::new();
        let id1 = gen.generate_hash_id("div", &[0, 1, 2], "el-");
        let id2 = gen.generate_hash_id("div", &[0, 1, 2], "el-");
        assert_ne!(id1, id2); // Should be different due to uniqueness
        assert!(id1.starts_with("el-"));
        assert!(id2.ends_with("-2"));
    }

    #[test]
    fn test_slug_id_generation() {
        let mut gen = IdGenerator::new();
        let id = gen.generate_slug_id("Hello World! 123", "el-");
        assert_eq!(id, "el-hello-world-123");

        let id2 = gen.generate_slug_id("Hello World! 123", "el-");
        assert_eq!(id2, "el-hello-world-123-2");
    }

    #[test]
    fn test_path_id_generation() {
        let mut gen = IdGenerator::new();
        let id = gen.generate_path_id("div", &[0, 1, 2], "el-");
        assert_eq!(id, "el-div-0-1-2");

        let id2 = gen.generate_path_id("span", &[], "el-");
        assert_eq!(id2, "el-span");
    }

    #[test]
    fn test_uniqueness() {
        let mut gen = IdGenerator::new();
        let id1 = gen.ensure_unique("test-id".to_string());
        let id2 = gen.ensure_unique("test-id".to_string());
        let id3 = gen.ensure_unique("test-id".to_string());

        assert_eq!(id1, "test-id");
        assert_eq!(id2, "test-id-2");
        assert_eq!(id3, "test-id-3");
    }
}