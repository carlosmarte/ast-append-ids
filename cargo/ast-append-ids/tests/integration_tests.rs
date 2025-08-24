use ast_append_ids::{AstProcessor, IdOptions, IdStrategy};
use ast_append_ids::jsx::JsxProcessor;
use ast_append_ids::xml::XmlProcessor;
use ast_append_ids::html::HtmlProcessor;

#[test]
fn test_jsx_basic_processing() {
    let mut processor = JsxProcessor::new();
    let options = IdOptions::default();
    
    let input = r#"
        function Component() {
            return (
                <div>
                    <span>Hello</span>
                    <span>World</span>
                </div>
            );
        }
    "#;
    
    let result = processor.process(input, &options).unwrap();
    
    // Check that IDs were added
    assert!(result.contains("data-ast-id"));
    
    // Check that the structure is preserved
    assert!(result.contains("function Component"));
    assert!(result.contains("<div"));
    assert!(result.contains("<span"));
}

#[test]
fn test_jsx_with_include_exclude() {
    let mut processor = JsxProcessor::new();
    let mut options = IdOptions::default();
    options.include = vec!["div".to_string()];
    
    let input = r#"
        function Component() {
            return (
                <div>
                    <span>Hello</span>
                </div>
            );
        }
    "#;
    
    let result = processor.process(input, &options).unwrap();
    
    // Only div should have ID
    assert!(result.contains("<div") && result.contains("data-ast-id"));
    
    // Reset and test exclude
    let mut processor2 = JsxProcessor::new();
    options.include.clear();
    options.exclude = vec!["span".to_string()];
    
    let result2 = processor2.process(input, &options).unwrap();
    
    // div should have ID, span should not
    assert!(result2.contains("<div") && result2.contains("data-ast-id"));
}

#[test]
fn test_xml_basic_processing() {
    let mut processor = XmlProcessor::new();
    let options = IdOptions::default();
    
    let input = r#"<?xml version="1.0"?>
        <root>
            <item>First</item>
            <item>Second</item>
        </root>"#;
    
    let result = processor.process(input, &options).unwrap();
    
    // Check that IDs were added
    assert!(result.contains("data-ast-id"));
    
    // Check that structure is preserved
    assert!(result.contains("<root"));
    assert!(result.contains("<item"));
    assert!(result.contains("First"));
    assert!(result.contains("Second"));
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
    
    assert!(result.contains("data-ast-id"));
    assert!(result.contains("custom:item"));
}

#[test]
fn test_html_basic_processing() {
    let mut processor = HtmlProcessor::new();
    let options = IdOptions::default();
    
    let input = r#"<!DOCTYPE html>
        <html>
            <head><title>Test</title></head>
            <body>
                <div>
                    <p>Hello</p>
                    <p>World</p>
                </div>
            </body>
        </html>"#;
    
    let result = processor.process(input, &options).unwrap();
    
    // Check that IDs were added
    assert!(result.contains("data-ast-id"));
    
    // Check that structure is preserved
    assert!(result.contains("<!DOCTYPE html>"));
    assert!(result.contains("<html"));
    assert!(result.contains("<body"));
    assert!(result.contains("<div"));
    assert!(result.contains("<p"));
}

#[test]
fn test_html_with_selector() {
    let mut processor = HtmlProcessor::new();
    let mut options = IdOptions::default();
    options.selector = Some("p".to_string());
    
    let input = r#"<div>
        <p>Paragraph</p>
        <span>Span</span>
    </div>"#;
    
    let result = processor.process(input, &options).unwrap();
    
    // Only p elements should have IDs
    assert!(result.contains("<p") && result.contains("data-ast-id"));
    
    // span should not have ID
    let span_with_id = result.contains("<span") && 
                       result.split("<span").nth(1).unwrap_or("").contains("data-ast-id");
    assert!(!span_with_id);
}

#[test]
fn test_id_strategies() {
    let mut processor = HtmlProcessor::new();
    
    let input = "<div>Test Content</div>";
    
    // Test hash strategy
    let mut options = IdOptions::default();
    options.strategy = IdStrategy::Hash;
    let result_hash = processor.process(input, &options).unwrap();
    assert!(result_hash.contains("el-")); // Default prefix
    
    // Test slug strategy
    let mut processor2 = HtmlProcessor::new();
    options.strategy = IdStrategy::Slug;
    let result_slug = processor2.process(input, &options).unwrap();
    assert!(result_slug.contains("el-test-content"));
    
    // Test path strategy
    let mut processor3 = HtmlProcessor::new();
    options.strategy = IdStrategy::Path;
    let result_path = processor3.process(input, &options).unwrap();
    assert!(result_path.contains("el-div"));
}

#[test]
fn test_overwrite_existing_ids() {
    let mut processor = HtmlProcessor::new();
    let mut options = IdOptions::default();
    
    let input = r#"<div data-ast-id="existing-id">Content</div>"#;
    
    // Without overwrite
    let result = processor.process(input, &options).unwrap();
    assert!(result.contains("existing-id"));
    
    // With overwrite
    let mut processor2 = HtmlProcessor::new();
    options.overwrite = true;
    let result2 = processor2.process(input, &options).unwrap();
    assert!(!result2.contains("existing-id"));
    assert!(result2.contains("data-ast-id"));
}

#[test]
fn test_custom_prefix() {
    let mut processor = HtmlProcessor::new();
    let mut options = IdOptions::default();
    options.prefix = "custom-".to_string();
    
    let input = "<div>Test</div>";
    let result = processor.process(input, &options).unwrap();
    
    assert!(result.contains("custom-"));
}

#[test]
fn test_custom_attribute_name() {
    let mut processor = HtmlProcessor::new();
    let mut options = IdOptions::default();
    options.attr = "id".to_string();
    
    let input = "<div>Test</div>";
    let result = processor.process(input, &options).unwrap();
    
    assert!(result.contains("id=\""));
    assert!(!result.contains("data-ast-id"));
}

#[test]
fn test_unique_id_generation() {
    let mut processor = HtmlProcessor::new();
    let mut options = IdOptions::default();
    options.strategy = IdStrategy::Path;
    
    let input = r#"
        <div>
            <span>First</span>
            <span>Second</span>
            <span>Third</span>
        </div>
    "#;
    
    let result = processor.process(input, &options).unwrap();
    
    // Count occurrences of the attribute
    let attr_count = result.matches(&format!("{}=\"", options.attr)).count();
    
    // Should have at least 4 elements with IDs (div + 3 spans)
    assert!(attr_count >= 4);
    
    // Extract all IDs and check for uniqueness
    let ids: Vec<&str> = result
        .split(&format!("{}=\"", options.attr))
        .skip(1)
        .map(|s| s.split('"').next().unwrap_or(""))
        .collect();
    
    let unique_ids: std::collections::HashSet<_> = ids.iter().cloned().collect();
    assert_eq!(ids.len(), unique_ids.len(), "All IDs should be unique");
}