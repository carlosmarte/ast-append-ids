use crate::id_generator::TextExtractable;
use crate::{IdOptions, IdStrategy};

pub struct AstNode {
    pub node_type: String,
    pub text_content: Option<String>,
    pub attributes: Vec<(String, String)>,
    pub path: Vec<usize>,
}

impl TextExtractable for AstNode {
    fn extract_text(&self) -> String {
        self.text_content.clone().unwrap_or_default()
    }
}

pub fn should_process_node(
    node_name: &str,
    options: &IdOptions,
    existing_id: Option<&str>,
) -> bool {
    // Check if we should overwrite existing IDs
    if existing_id.is_some() && !options.overwrite {
        return false;
    }

    // Check include list
    if !options.include.is_empty() && !options.include.contains(&node_name.to_string()) {
        return false;
    }

    // Check exclude list
    if options.exclude.contains(&node_name.to_string()) {
        return false;
    }

    true
}

pub fn generate_id_for_node(
    generator: &mut crate::id_generator::IdGenerator,
    node: &AstNode,
    options: &IdOptions,
) -> String {
    match options.strategy {
        IdStrategy::Hash => {
            generator.generate_hash_id(&node.node_type, &node.path, &options.prefix)
        }
        IdStrategy::Slug => {
            let text = node.text_content.as_deref().unwrap_or("");
            generator.generate_slug_id(text, &options.prefix)
        }
        IdStrategy::Path => {
            generator.generate_path_id(&node.node_type, &node.path, &options.prefix)
        }
    }
}

pub fn find_attribute<'a>(
    attributes: &'a [(String, String)],
    name: &str,
) -> Option<&'a str> {
    attributes
        .iter()
        .find(|(attr_name, _)| attr_name == name)
        .map(|(_, value)| value.as_str())
}

pub fn set_attribute(
    attributes: &mut Vec<(String, String)>,
    name: String,
    value: String,
) {
    if let Some(attr) = attributes.iter_mut().find(|(attr_name, _)| attr_name == &name) {
        attr.1 = value;
    } else {
        attributes.push((name, value));
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_should_process_node() {
        let mut options = IdOptions::default();
        
        // Test with no restrictions
        assert!(should_process_node("div", &options, None));
        
        // Test with existing ID and no overwrite
        assert!(!should_process_node("div", &options, Some("existing-id")));
        
        // Test with overwrite enabled
        options.overwrite = true;
        assert!(should_process_node("div", &options, Some("existing-id")));
        
        // Test include list
        options.include = vec!["div".to_string(), "span".to_string()];
        assert!(should_process_node("div", &options, None));
        assert!(!should_process_node("p", &options, None));
        
        // Test exclude list
        options.include.clear();
        options.exclude = vec!["script".to_string(), "style".to_string()];
        assert!(should_process_node("div", &options, None));
        assert!(!should_process_node("script", &options, None));
    }

    #[test]
    fn test_find_and_set_attribute() {
        let mut attributes = vec![
            ("id".to_string(), "test-id".to_string()),
            ("class".to_string(), "test-class".to_string()),
        ];
        
        assert_eq!(find_attribute(&attributes, "id"), Some("test-id"));
        assert_eq!(find_attribute(&attributes, "data-id"), None);
        
        set_attribute(&mut attributes, "data-id".to_string(), "new-id".to_string());
        assert_eq!(find_attribute(&attributes, "data-id"), Some("new-id"));
        
        set_attribute(&mut attributes, "id".to_string(), "updated-id".to_string());
        assert_eq!(find_attribute(&attributes, "id"), Some("updated-id"));
    }
}