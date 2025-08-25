let wasmModule = null;
let initialized = false;

function detectEnvironment() {
  if (typeof window !== 'undefined' && typeof window.document !== 'undefined') {
    return 'browser';
  }
  
  if (typeof process !== 'undefined' && process.versions && process.versions.node) {
    return 'node';
  }
  
  if (typeof importScripts === 'function') {
    return 'webworker';
  }
  
  if (typeof __webpack_require__ === 'function' || typeof __non_webpack_require__ === 'function') {
    return 'bundler';
  }
  
  if (typeof define === 'function' && define.amd) {
    return 'amd';
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
    
    switch (env) {
      case 'browser':
      case 'webworker':
        module = await import('./pkg-web/ast_append_ids.js');
        if (module.default && typeof module.default === 'function') {
          await module.default();
        }
        break;
        
      case 'node':
        try {
          module = await import('./pkg-node/ast_append_ids.js');
        } catch (e) {
          console.warn('Failed to load Node.js WASM module, falling back to bundler version:', e);
          module = await import('./pkg-bundler/ast_append_ids.js');
        }
        if (module.default && typeof module.default === 'function') {
          const fs = await import('fs');
          const path = await import('path');
          const { fileURLToPath } = await import('url');
          const __dirname = path.dirname(fileURLToPath(import.meta.url));
          const wasmPath = path.join(__dirname, './pkg-node/ast_append_ids_bg.wasm');
          const wasmBuffer = fs.readFileSync(wasmPath);
          await module.default(wasmBuffer);
        }
        break;
        
      case 'bundler':
      case 'amd':
      default:
        module = await import('../../cargo/ast-append-ids/pkg-bundler/ast_append_ids.js');
        if (module.default && typeof module.default === 'function') {
          await module.default();
        }
        break;
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

export async function create_default_options() {
  const wasm = await ensureInitialized();
  return wasm.create_default_options();
}

export async function version() {
  const wasm = await ensureInitialized();
  return wasm.version();
}

export async function babelPluginJsxAppendIds(content, options) {
  const wasm = await ensureInitialized();
  return wasm.babelPluginJsxAppendIds(content, options);
}

export async function rehypeAppendIds(content, options) {
  const wasm = await ensureInitialized();
  return wasm.rehypeAppendIds(content, options);
}

export async function xastAppendIds(content, options) {
  const wasm = await ensureInitialized();
  return wasm.xastAppendIds(content, options);
}

export class WasmAstProcessor {
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

export default {
  create_default_options,
  version,
  babelPluginJsxAppendIds,
  rehypeAppendIds,
  xastAppendIds,
  WasmAstProcessor
};