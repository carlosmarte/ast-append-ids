use crate::ast_common::{self, AstNode};
use crate::id_generator::IdGenerator;
use crate::{AstProcessor, IdOptions};
use swc_core::common::{FileName, SourceMap, DUMMY_SP};
use swc_core::ecma::ast::*;
use swc_core::ecma::parser::{lexer::Lexer, Parser, StringInput, Syntax, TsConfig};
use swc_core::ecma::visit::{VisitMut, VisitMutWith};
use std::sync::Arc;

pub struct JsxProcessor {
    generator: IdGenerator,
}

impl JsxProcessor {
    pub fn new() -> Self {
        Self {
            generator: IdGenerator::new(),
        }
    }

    fn is_host_element(name: &str) -> bool {
        name.chars().next().map_or(false, |c| c.is_lowercase())
    }

    fn extract_jsx_element_name(name: &JSXElementName) -> String {
        match name {
            JSXElementName::Ident(ident) => ident.sym.to_string(),
            JSXElementName::JSXMemberExpr(member) => {
                Self::extract_jsx_member_name(&member.prop)
            }
            JSXElementName::JSXNamespacedName(ns) => ns.name.sym.to_string(),
        }
    }

    fn extract_jsx_member_name(member: &swc_core::ecma::ast::Ident) -> String {
        member.sym.to_string()
    }

    #[allow(dead_code)]
    fn extract_text_from_jsx_children(children: &[JSXElementChild]) -> String {
        let mut text_parts = Vec::new();
        
        for child in children {
            match child {
                JSXElementChild::JSXText(text) => {
                    let trimmed = text.value.trim();
                    if !trimmed.is_empty() {
                        text_parts.push(trimmed.to_string());
                    }
                }
                JSXElementChild::JSXExprContainer(expr) => {
                    if let JSXExpr::Expr(expr) = &expr.expr {
                        if let Expr::Lit(Lit::Str(s)) = &**expr {
                            text_parts.push(s.value.to_string());
                        }
                    }
                }
                JSXElementChild::JSXElement(el) => {
                    let child_text = Self::extract_text_from_jsx_children(&el.children);
                    if !child_text.is_empty() {
                        text_parts.push(child_text);
                    }
                }
                _ => {}
            }
        }
        
        text_parts.join(" ")
    }
}

struct JsxVisitor<'a> {
    options: &'a IdOptions,
    generator: &'a mut IdGenerator,
    path_stack: Vec<usize>,
}

impl<'a> JsxVisitor<'a> {
    fn new(options: &'a IdOptions, generator: &'a mut IdGenerator) -> Self {
        Self {
            options,
            generator,
            path_stack: Vec::new(),
        }
    }

    fn process_jsx_opening(&mut self, opening: &mut JSXOpeningElement) {
        let element_name = JsxProcessor::extract_jsx_element_name(&opening.name);
        
        if !JsxProcessor::is_host_element(&element_name) {
            return;
        }

        let existing_attr = opening.attrs.iter().find_map(|attr| {
            if let JSXAttrOrSpread::JSXAttr(attr) = attr {
                if let JSXAttrName::Ident(ident) = &attr.name {
                    if ident.sym == self.options.attr.as_str() {
                        if let Some(JSXAttrValue::Lit(Lit::Str(s))) = &attr.value {
                            return Some(s.value.to_string());
                        }
                    }
                }
            }
            None
        });

        if !ast_common::should_process_node(&element_name, self.options, existing_attr.as_deref()) {
            return;
        }

        let node = AstNode {
            node_type: element_name.clone(),
            text_content: None, // Will be extracted from children if needed
            attributes: Vec::new(),
            path: self.path_stack.clone(),
        };

        let id = ast_common::generate_id_for_node(self.generator, &node, self.options);

        // Remove existing attribute if overwriting
        if self.options.overwrite {
            opening.attrs.retain(|attr| {
                if let JSXAttrOrSpread::JSXAttr(attr) = attr {
                    if let JSXAttrName::Ident(ident) = &attr.name {
                        return ident.sym != self.options.attr.as_str();
                    }
                }
                true
            });
        }

        // Add new attribute
        if existing_attr.is_none() || self.options.overwrite {
            let new_attr = JSXAttr {
                span: DUMMY_SP,
                name: JSXAttrName::Ident(swc_core::ecma::ast::Ident {
                    span: DUMMY_SP,
                    sym: self.options.attr.clone().into(),
                    optional: false,
                }),
                value: Some(JSXAttrValue::Lit(Lit::Str(Str {
                    span: DUMMY_SP,
                    value: id.into(),
                    raw: None,
                }))),
            };
            opening.attrs.push(JSXAttrOrSpread::JSXAttr(new_attr));
        }

        self.generator.increment_counter();
    }
}

impl<'a> VisitMut for JsxVisitor<'a> {
    fn visit_mut_jsx_element(&mut self, node: &mut JSXElement) {
        let index = self.path_stack.len();
        self.path_stack.push(self.generator.get_counter());
        
        self.process_jsx_opening(&mut node.opening);
        node.children.visit_mut_children_with(self);
        
        self.path_stack.truncate(index);
    }

    fn visit_mut_jsx_fragment(&mut self, node: &mut JSXFragment) {
        let index = self.path_stack.len();
        self.path_stack.push(self.generator.get_counter());
        
        node.children.visit_mut_children_with(self);
        
        self.path_stack.truncate(index);
    }
}

impl AstProcessor for JsxProcessor {
    fn process(&mut self, content: &str, options: &IdOptions) -> Result<String, String> {
        let cm = Arc::new(SourceMap::default());
        let fm = cm.new_source_file(FileName::Anon, content.to_string());
        
        let lexer = Lexer::new(
            Syntax::Typescript(TsConfig {
                tsx: true,
                decorators: true,
                ..Default::default()
            }),
            Default::default(),
            StringInput::from(&*fm),
            None,
        );

        let mut parser = Parser::new_from(lexer);
        
        let mut module = parser
            .parse_module()
            .map_err(|e| format!("Parse error: {:?}", e))?;

        let mut visitor = JsxVisitor::new(options, &mut self.generator);
        module.visit_mut_with(&mut visitor);

        // Convert back to string
        let output = to_code(&module);
        
        Ok(output)
    }
}

fn to_code(module: &Module) -> String {
    use swc_core::common::sync::Lrc;
    use swc_core::ecma::codegen::{text_writer::JsWriter, Emitter};
    
    let cm = Lrc::new(SourceMap::default());
    let mut buf = Vec::new();
    let writer = Box::new(JsWriter::new(cm.clone(), "\n", &mut buf, None));
    
    let mut emitter = Emitter {
        cfg: swc_core::ecma::codegen::Config::default(),
        cm: cm.clone(),
        comments: None,
        wr: writer,
    };
    
    emitter.emit_module(module).unwrap();
    String::from_utf8(buf).unwrap()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_jsx_processing() {
        let mut processor = JsxProcessor::new();
        let options = IdOptions::default();
        
        let input = r#"
            function App() {
                return <div><span>Hello</span></div>;
            }
        "#;
        
        let result = processor.process(input, &options).unwrap();
        assert!(result.contains("data-ast-id"));
    }

    #[test]
    fn test_host_element_detection() {
        assert!(JsxProcessor::is_host_element("div"));
        assert!(JsxProcessor::is_host_element("span"));
        assert!(!JsxProcessor::is_host_element("Component"));
        assert!(!JsxProcessor::is_host_element("MyComponent"));
    }
}