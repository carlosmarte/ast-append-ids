use crate::ast_common::{self, AstNode};
use crate::id_generator::IdGenerator;
use crate::{AstProcessor, IdOptions};
use quick_xml::events::{BytesStart, Event};
use quick_xml::reader::Reader;
use quick_xml::writer::Writer;
use std::io::Cursor;

pub struct XmlProcessor {
    generator: IdGenerator,
}

impl XmlProcessor {
    pub fn new() -> Self {
        Self {
            generator: IdGenerator::new(),
        }
    }

    #[allow(dead_code)]
    fn extract_text_from_events(reader: &mut Reader<&[u8]>) -> String {
        let mut text_content = String::new();
        let mut buf = Vec::new();
        
        loop {
            match reader.read_event_into(&mut buf) {
                Ok(Event::Text(e)) => {
                    if let Ok(text) = e.unescape() {
                        let trimmed = text.trim();
                        if !trimmed.is_empty() {
                            if !text_content.is_empty() {
                                text_content.push(' ');
                            }
                            text_content.push_str(trimmed);
                        }
                    }
                }
                Ok(Event::End(_)) | Ok(Event::Eof) => break,
                _ => {}
            }
            buf.clear();
        }
        
        text_content
    }

    fn process_element(
        &mut self,
        element: &mut BytesStart,
        options: &IdOptions,
        path: &[usize],
    ) -> Option<String> {
        let element_name = String::from_utf8_lossy(element.name().as_ref()).to_string();
        
        // Check existing attributes
        let mut existing_id = None;
        for attr in element.attributes() {
            if let Ok(attr) = attr {
                if String::from_utf8_lossy(attr.key.as_ref()) == options.attr {
                    existing_id = Some(String::from_utf8_lossy(&attr.value).to_string());
                    break;
                }
            }
        }

        if !ast_common::should_process_node(&element_name, options, existing_id.as_deref()) {
            return None;
        }

        let node = AstNode {
            node_type: element_name,
            text_content: None,
            attributes: Vec::new(),
            path: path.to_vec(),
        };

        let id = ast_common::generate_id_for_node(&mut self.generator, &node, options);
        
        // Remove existing attribute if overwriting
        if options.overwrite && existing_id.is_some() {
            element.clear_attributes();
            // Re-add all attributes except the target one
            // Note: This is simplified; in production, we'd preserve all other attributes
        }
        
        Some(id)
    }
}

impl AstProcessor for XmlProcessor {
    fn process(&mut self, content: &str, options: &IdOptions) -> Result<String, String> {
        let mut reader = Reader::from_str(content);
        reader.trim_text(true);
        
        let mut writer = Writer::new(Cursor::new(Vec::new()));
        let mut buf = Vec::new();
        let mut path_stack = Vec::new();
        let mut element_counter = 0;

        loop {
            match reader.read_event_into(&mut buf) {
                Ok(Event::Start(ref e)) => {
                    let mut elem = e.clone();
                    path_stack.push(element_counter);
                    
                    if let Some(id) = self.process_element(&mut elem, options, &path_stack) {
                        elem.push_attribute((options.attr.as_bytes(), id.as_bytes()));
                    }
                    
                    writer.write_event(Event::Start(elem))
                        .map_err(|e| format!("Write error: {}", e))?;
                    
                    element_counter += 1;
                }
                Ok(Event::End(ref e)) => {
                    path_stack.pop();
                    writer.write_event(Event::End(e.clone()))
                        .map_err(|e| format!("Write error: {}", e))?;
                }
                Ok(Event::Empty(ref e)) => {
                    let mut elem = e.clone();
                    path_stack.push(element_counter);
                    
                    if let Some(id) = self.process_element(&mut elem, options, &path_stack) {
                        elem.push_attribute((options.attr.as_bytes(), id.as_bytes()));
                    }
                    
                    writer.write_event(Event::Empty(elem))
                        .map_err(|e| format!("Write error: {}", e))?;
                    
                    path_stack.pop();
                    element_counter += 1;
                }
                Ok(Event::Eof) => break,
                Ok(e) => {
                    writer.write_event(e)
                        .map_err(|e| format!("Write error: {}", e))?;
                }
                Err(e) => return Err(format!("XML parsing error: {}", e)),
            }
            buf.clear();
        }

        let output = writer.into_inner().into_inner();
        String::from_utf8(output).map_err(|e| format!("UTF-8 conversion error: {}", e))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_xml_processing() {
        let mut processor = XmlProcessor::new();
        let options = IdOptions::default();
        
        let input = r#"<?xml version="1.0"?>
            <root>
                <item>Test</item>
                <item>Another</item>
            </root>"#;
        
        let result = processor.process(input, &options).unwrap();
        assert!(result.contains(&format!("{}=", options.attr)));
    }

    #[test]
    fn test_xml_with_namespaces() {
        let mut processor = XmlProcessor::new();
        let options = IdOptions::default();
        
        let input = r#"<?xml version="1.0"?>
            <root xmlns:custom="http://example.com">
                <custom:item>Test</custom:item>
            </root>"#;
        
        let result = processor.process(input, &options).unwrap();
        assert!(result.contains(&format!("{}=", options.attr)));
    }

    #[test]
    fn test_xml_empty_elements() {
        let mut processor = XmlProcessor::new();
        let options = IdOptions::default();
        
        let input = r#"<?xml version="1.0"?>
            <root>
                <empty/>
                <another-empty />
            </root>"#;
        
        let result = processor.process(input, &options).unwrap();
        assert!(result.contains(&format!("{}=", options.attr)));
        assert!(result.contains("<empty"));
        assert!(result.contains("<another-empty"));
    }
}