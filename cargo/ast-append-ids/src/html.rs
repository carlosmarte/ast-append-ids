use crate::ast_common::{self, AstNode};
use crate::id_generator::IdGenerator;
use crate::{AstProcessor, IdOptions};
use scraper::{Html, Node, Selector};
use selectors::attr::CaseSensitivity;

pub struct HtmlProcessor {
    generator: IdGenerator,
}

impl HtmlProcessor {
    pub fn new() -> Self {
        Self {
            generator: IdGenerator::new(),
        }
    }

    fn extract_text_content(element: &scraper::ElementRef) -> String {
        let text_parts: Vec<String> = element
            .text()
            .filter_map(|t| {
                let trimmed = t.trim();
                if trimmed.is_empty() {
                    None
                } else {
                    Some(trimmed.to_string())
                }
            })
            .collect();
        
        text_parts.join(" ")
    }

    fn process_node_recursive(
        &mut self,
        node_id: scraper::node::NodeId,
        html: &mut Html,
        options: &IdOptions,
        path: &mut Vec<usize>,
        element_index: &mut usize,
    ) {
        let node = html.tree.get(node_id).unwrap();
        
        if let Node::Element(element) = node.value() {
            let element_name = element.name().to_string();
            
            // Check for existing attribute
            let existing_id = element.attr(&options.attr);
            
            if ast_common::should_process_node(&element_name, options, existing_id) {
                let element_ref = scraper::ElementRef::wrap(node).unwrap();
                let text_content = if matches!(options.strategy, crate::IdStrategy::Slug) {
                    Some(Self::extract_text_content(&element_ref))
                } else {
                    None
                };

                let ast_node = AstNode {
                    node_type: element_name.clone(),
                    text_content,
                    attributes: Vec::new(),
                    path: path.clone(),
                };

                let id = ast_common::generate_id_for_node(&mut self.generator, &ast_node, options);
                
                // Get mutable element to modify attributes
                if let Node::Element(element_mut) = html.tree.get_mut(node_id).unwrap().value_mut() {
                    // Remove existing attribute if overwriting
                    if options.overwrite && existing_id.is_some() {
                        element_mut.remove_attribute(&options.attr);
                    }
                    
                    // Add new attribute
                    if existing_id.is_none() || options.overwrite {
                        element_mut.set_attribute(&options.attr, &id);
                    }
                }
            }
            
            // Process children
            path.push(*element_index);
            let children: Vec<_> = node.children().collect();
            for (child_index, child_id) in children.into_iter().enumerate() {
                let mut child_element_index = child_index;
                self.process_node_recursive(
                    child_id,
                    html,
                    options,
                    path,
                    &mut child_element_index,
                );
            }
            path.pop();
            
            *element_index += 1;
        }
    }
}

impl AstProcessor for HtmlProcessor {
    fn process(&mut self, content: &str, options: &IdOptions) -> Result<String, String> {
        let mut html = Html::parse_document(content);
        
        // If a selector is provided, only process matching elements
        if let Some(selector_str) = &options.selector {
            let selector = Selector::parse(selector_str)
                .map_err(|e| format!("Invalid selector: {:?}", e))?;
            
            // Collect node IDs first to avoid borrowing issues
            let node_ids: Vec<_> = html.select(&selector)
                .map(|el| el.id())
                .collect();
            
            for node_id in node_ids {
                let mut path = Vec::new();
                let mut element_index = 0;
                self.process_node_recursive(
                    node_id,
                    &mut html,
                    options,
                    &mut path,
                    &mut element_index,
                );
            }
        } else {
            // Process all elements
            let root_element = html.root_element().id();
            let mut path = Vec::new();
            let mut element_index = 0;
            self.process_node_recursive(
                root_element,
                &mut html,
                options,
                &mut path,
                &mut element_index,
            );
        }
        
        Ok(html.html())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_html_processing() {
        let mut processor = HtmlProcessor::new();
        let options = IdOptions::default();
        
        let input = r#"<!DOCTYPE html>
            <html>
                <body>
                    <div>
                        <span>Hello</span>
                        <span>World</span>
                    </div>
                </body>
            </html>"#;
        
        let result = processor.process(input, &options).unwrap();
        assert!(result.contains(&format!("{}=", options.attr)));
    }

    #[test]
    fn test_html_with_selector() {
        let mut processor = HtmlProcessor::new();
        let mut options = IdOptions::default();
        options.selector = Some("span".to_string());
        
        let input = r#"<!DOCTYPE html>
            <html>
                <body>
                    <div>
                        <span>Hello</span>
                        <p>Not selected</p>
                    </div>
                </body>
            </html>"#;
        
        let result = processor.process(input, &options).unwrap();
        
        // Check that span has the attribute but p doesn't
        assert!(result.contains(&format!("<span {}=", options.attr)));
        assert!(!result.contains(&format!("<p {}=", options.attr)));
    }

    #[test]
    fn test_html_text_extraction() {
        let html = Html::parse_fragment("<div>Hello <span>World</span>!</div>");
        let element = html.root_element();
        let text = HtmlProcessor::extract_text_content(&element);
        assert_eq!(text, "Hello World !");
    }

    #[test]
    fn test_html_with_existing_ids() {
        let mut processor = HtmlProcessor::new();
        let mut options = IdOptions::default();
        
        let input = r#"<div data-ast-id="existing">Content</div>"#;
        
        // Without overwrite, should keep existing
        let result = processor.process(input, &options).unwrap();
        assert!(result.contains("data-ast-id=\"existing\""));
        
        // With overwrite, should replace
        options.overwrite = true;
        let mut processor2 = HtmlProcessor::new();
        let result2 = processor2.process(input, &options).unwrap();
        assert!(!result2.contains("data-ast-id=\"existing\""));
        assert!(result2.contains("data-ast-id=\""));
    }
}