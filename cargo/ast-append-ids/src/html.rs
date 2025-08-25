use crate::ast_common::{self, AstNode};
use crate::id_generator::IdGenerator;
use crate::{AstProcessor, IdOptions, IdStrategy};
use lol_html::{element, rewrite_str, RewriteStrSettings};
use std::cell::RefCell;
use std::rc::Rc;
use std::collections::HashMap;

pub struct HtmlProcessor {
    #[allow(dead_code)]
    generator: IdGenerator,
}

impl HtmlProcessor {
    pub fn new() -> Self {
        Self {
            generator: IdGenerator::new(),
        }
    }
    
    fn extract_text_content(&self, html: &str) -> HashMap<usize, String> {
        let mut text_map = HashMap::new();
        let doc = scraper::Html::parse_document(html);
        let mut counter = 0;
        
        // Use a simple approach - iterate through all elements
        for element_ref in doc.select(&scraper::Selector::parse("*").unwrap()) {
            let mut text_content = String::new();
            
            // Collect direct text nodes only (not nested)
            for text in element_ref.text() {
                let trimmed = text.trim();
                if !trimmed.is_empty() {
                    if !text_content.is_empty() {
                        text_content.push(' ');
                    }
                    text_content.push_str(trimmed);
                }
            }
            
            if !text_content.is_empty() {
                text_map.insert(counter, text_content);
            }
            counter += 1;
        }
        
        text_map
    }
}

impl AstProcessor for HtmlProcessor {
    fn process(&mut self, content: &str, options: &IdOptions) -> Result<String, String> {
        // Pre-extract text content if using slug strategy
        let text_map = if matches!(options.strategy, IdStrategy::Slug) {
            Rc::new(self.extract_text_content(content))
        } else {
            Rc::new(HashMap::new())
        };
        
        let generator = Rc::new(RefCell::new(IdGenerator::new()));
        let options = Rc::new(options.clone());
        let element_counter = Rc::new(RefCell::new(0usize));
        
        let selector = if let Some(ref selector_str) = options.selector {
            selector_str.clone()
        } else {
            "*".to_string() // Select all elements
        };
        
        let generator_clone = generator.clone();
        let options_clone = options.clone();
        let counter_clone = element_counter.clone();
        let text_map_clone = text_map.clone();
        
        let element_content_handlers = vec![
            element!(selector.as_str(), move |el| {
                let element_name = el.tag_name();
                let existing_id = el.get_attribute(&options_clone.attr);
                
                if ast_common::should_process_node(&element_name, &options_clone, existing_id.as_deref()) {
                    let counter = *counter_clone.borrow();
                    
                    let text_content = if matches!(options_clone.strategy, IdStrategy::Slug) {
                        text_map_clone.get(&counter).cloned()
                    } else {
                        None
                    };
                    
                    let path = vec![counter];
                    *counter_clone.borrow_mut() += 1;
                    
                    let ast_node = AstNode {
                        node_type: element_name.clone(),
                        text_content,
                        attributes: Vec::new(),
                        path,
                    };
                    
                    let id = ast_common::generate_id_for_node(
                        &mut *generator_clone.borrow_mut(),
                        &ast_node,
                        &options_clone
                    );
                    
                    // Set or replace the attribute
                    if existing_id.is_none() || options_clone.overwrite {
                        el.set_attribute(&options_clone.attr, &id)
                            .map_err(|e| format!("Failed to set attribute: {}", e))?;
                    }
                }
                
                Ok(())
            })
        ];
        
        let rewrite_settings = RewriteStrSettings {
            element_content_handlers,
            ..RewriteStrSettings::default()
        };
        
        rewrite_str(content, rewrite_settings)
            .map_err(|e| format!("HTML processing error: {}", e))
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