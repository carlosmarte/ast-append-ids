const { createRequire } = require('module');
const path = require('path');
const fs = require('fs');

let wasmModule = null;
let initialized = false;

function detectEnvironment() {
  if (typeof process !== 'undefined' && process.versions && process.versions.node) {
    return 'node';
  }
  return 'bundler';
}

async function loadWasmModule() {
  if (initialized && wasmModule) {
    return wasmModule;
  }

  const env = detectEnvironment();
  
  try {
    let module;
    
    if (env === 'node') {
      try {
        module = require('./pkg-node/ast_append_ids.js');
      } catch (e) {
        console.warn('Failed to load Node.js WASM module, falling back to bundler version:', e);
        module = require('./pkg-bundler/ast_append_ids.js');
      }
      
      if (module.default && typeof module.default === 'function') {
        const wasmPath = path.join(__dirname, './pkg-node/ast_append_ids_bg.wasm');
        const wasmBuffer = fs.readFileSync(wasmPath);
        await module.default(wasmBuffer);
      }
    } else {
      module = require('../../cargo/ast-append-ids/pkg-bundler/ast_append_ids.js');
      if (module.default && typeof module.default === 'function') {
        await module.default();
      }
    }
    
    wasmModule = module;
    initialized = true;
    return module;
    
  } catch (error) {
    console.error(`Failed to load WASM module for environment '${env}':`, error);
    throw new Error(`Could not load ast-append-ids WASM module: ${error.message}`);
  }
}

async function ensureInitialized() {
  if (!initialized) {
    await loadWasmModule();
  }
  return wasmModule;
}

async function create_default_options() {
  const wasm = await ensureInitialized();
  return wasm.create_default_options();
}

async function version() {
  const wasm = await ensureInitialized();
  return wasm.version();
}

async function babelPluginJsxAppendIds(content, options) {
  const wasm = await ensureInitialized();
  return wasm.babelPluginJsxAppendIds(content, options);
}

async function rehypeAppendIds(content, options) {
  const wasm = await ensureInitialized();
  return wasm.rehypeAppendIds(content, options);
}

async function xastAppendIds(content, options) {
  const wasm = await ensureInitialized();
  return wasm.xastAppendIds(content, options);
}

class WasmAstProcessor {
  constructor() {
    this._instance = null;
    this._initialized = false;
  }
  
  async _ensureInstance() {
    if (!this._initialized) {
      const wasm = await ensureInitialized();
      this._instance = new wasm.WasmAstProcessor();
      this._initialized = true;
    }
    return this._instance;
  }
  
  async processJsx(content, options) {
    const instance = await this._ensureInstance();
    return instance.processJsx(content, options);
  }
  
  async processXml(content, options) {
    const instance = await this._ensureInstance();
    return instance.processXml(content, options);
  }
  
  async processHtml(content, options) {
    const instance = await this._ensureInstance();
    return instance.processHtml(content, options);
  }
  
  async processAuto(content, options) {
    const instance = await this._ensureInstance();
    return instance.processAuto(content, options);
  }
  
  free() {
    if (this._instance && this._instance.free) {
      this._instance.free();
    }
    this._instance = null;
    this._initialized = false;
  }
}

module.exports = {
  create_default_options,
  version,
  babelPluginJsxAppendIds,
  rehypeAppendIds,
  xastAppendIds,
  WasmAstProcessor
};