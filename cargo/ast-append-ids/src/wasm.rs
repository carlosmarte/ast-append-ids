use wasm_bindgen::prelude::*;
use serde_wasm_bindgen::{from_value, to_value};
use crate::{AstProcessor, IdOptions};
use crate::jsx::JsxProcessor;
use crate::xml::XmlProcessor;
use crate::html::HtmlProcessor;

#[wasm_bindgen]
pub struct WasmAstProcessor {
    jsx_processor: Option<JsxProcessor>,
    xml_processor: Option<XmlProcessor>,
    html_processor: Option<HtmlProcessor>,
}

#[wasm_bindgen]
impl WasmAstProcessor {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        crate::set_panic_hook();
        Self {
            jsx_processor: None,
            xml_processor: None,
            html_processor: None,
        }
    }

    #[wasm_bindgen(js_name = processJsx)]
    pub fn process_jsx(&mut self, content: &str, options: JsValue) -> Result<String, JsValue> {
        let options: IdOptions = from_value(options)
            .map_err(|e| JsValue::from_str(&format!("Invalid options: {}", e)))?;
        
        if self.jsx_processor.is_none() {
            self.jsx_processor = Some(JsxProcessor::new());
        }
        
        self.jsx_processor
            .as_mut()
            .unwrap()
            .process(content, &options)
            .map_err(|e| JsValue::from_str(&e))
    }

    #[wasm_bindgen(js_name = processXml)]
    pub fn process_xml(&mut self, content: &str, options: JsValue) -> Result<String, JsValue> {
        let options: IdOptions = from_value(options)
            .map_err(|e| JsValue::from_str(&format!("Invalid options: {}", e)))?;
        
        if self.xml_processor.is_none() {
            self.xml_processor = Some(XmlProcessor::new());
        }
        
        self.xml_processor
            .as_mut()
            .unwrap()
            .process(content, &options)
            .map_err(|e| JsValue::from_str(&e))
    }

    #[wasm_bindgen(js_name = processHtml)]
    pub fn process_html(&mut self, content: &str, options: JsValue) -> Result<String, JsValue> {
        let options: IdOptions = from_value(options)
            .map_err(|e| JsValue::from_str(&format!("Invalid options: {}", e)))?;
        
        if self.html_processor.is_none() {
            self.html_processor = Some(HtmlProcessor::new());
        }
        
        self.html_processor
            .as_mut()
            .unwrap()
            .process(content, &options)
            .map_err(|e| JsValue::from_str(&e))
    }

    #[wasm_bindgen(js_name = processAuto)]
    pub fn process_auto(&mut self, content: &str, options: JsValue) -> Result<String, JsValue> {
        let options: IdOptions = from_value(options)
            .map_err(|e| JsValue::from_str(&format!("Invalid options: {}", e)))?;
        
        // Auto-detect content type
        let trimmed = content.trim();
        
        if trimmed.starts_with("<?xml") || trimmed.starts_with("<svg") {
            self.process_xml(content, to_value(&options).unwrap())
        } else if trimmed.starts_with("<!DOCTYPE") || trimmed.starts_with("<html") {
            self.process_html(content, to_value(&options).unwrap())
        } else if trimmed.contains("jsx") || trimmed.contains("React") || trimmed.contains("=>") {
            self.process_jsx(content, to_value(&options).unwrap())
        } else if trimmed.starts_with("<") {
            // Default to HTML for generic markup
            self.process_html(content, to_value(&options).unwrap())
        } else {
            // Assume JSX for JavaScript-like content
            self.process_jsx(content, to_value(&options).unwrap())
        }
    }
}

#[wasm_bindgen]
pub fn create_default_options() -> JsValue {
    let options = IdOptions::default();
    to_value(&options).unwrap()
}

#[wasm_bindgen]
pub fn version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}

// Babel plugin compatibility layer
#[wasm_bindgen(js_name = babelPluginJsxAppendIds)]
pub fn babel_plugin_jsx_append_ids(content: &str, options: JsValue) -> Result<String, JsValue> {
    let mut processor = WasmAstProcessor::new();
    processor.process_jsx(content, options)
}

// Rehype plugin compatibility layer
#[wasm_bindgen(js_name = rehypeAppendIds)]
pub fn rehype_append_ids(content: &str, options: JsValue) -> Result<String, JsValue> {
    let mut processor = WasmAstProcessor::new();
    processor.process_html(content, options)
}

// XAST plugin compatibility layer
#[wasm_bindgen(js_name = xastAppendIds)]
pub fn xast_append_ids(content: &str, options: JsValue) -> Result<String, JsValue> {
    let mut processor = WasmAstProcessor::new();
    processor.process_xml(content, options)
}

#[cfg(test)]
mod tests {
    use super::*;
    use wasm_bindgen_test::*;

    #[wasm_bindgen_test]
    fn test_wasm_processor_creation() {
        let processor = WasmAstProcessor::new();
        assert!(processor.jsx_processor.is_none());
        assert!(processor.xml_processor.is_none());
        assert!(processor.html_processor.is_none());
    }

    #[wasm_bindgen_test]
    fn test_version() {
        let v = version();
        assert!(!v.is_empty());
    }

    #[wasm_bindgen_test]
    fn test_default_options() {
        let options = create_default_options();
        assert!(!options.is_undefined());
    }
}