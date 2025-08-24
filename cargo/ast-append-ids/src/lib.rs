pub mod id_generator;
pub mod jsx;
pub mod xml;
pub mod html;
pub mod ast_common;

#[cfg(target_arch = "wasm32")]
pub mod wasm;

use serde::{Deserialize, Serialize};
use std::collections::HashSet;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IdOptions {
    pub attr: String,
    pub strategy: IdStrategy,
    pub prefix: String,
    pub overwrite: bool,
    pub selector: Option<String>,
    pub include: Vec<String>,
    pub exclude: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum IdStrategy {
    Hash,
    Slug,
    Path,
}

impl Default for IdOptions {
    fn default() -> Self {
        Self {
            attr: "data-ast-id".to_string(),
            strategy: IdStrategy::Hash,
            prefix: "el-".to_string(),
            overwrite: false,
            selector: None,
            include: Vec::new(),
            exclude: Vec::new(),
        }
    }
}

pub trait AstProcessor {
    fn process(&mut self, content: &str, options: &IdOptions) -> Result<String, String>;
}

#[cfg(target_arch = "wasm32")]
use wasm_bindgen::prelude::*;

#[cfg(target_arch = "wasm32")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

#[cfg(target_arch = "wasm32")]
pub fn set_panic_hook() {
    console_error_panic_hook::set_once();
}