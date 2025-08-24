// ES Module wrapper for the WASM module
import wasmInit from './pkg-bundler/ast_append_ids.js';
import * as wasm from './pkg-bundler/ast_append_ids.js';

let wasmInitialized = false;
let wasmModule;

async function ensureWasmInit() {
  if (!wasmInitialized) {
    wasmModule = await wasmInit();
    wasmInitialized = true;
  }
  return wasmModule;
}

// Export the main processor class
export class AstAppendIds {
  constructor() {
    this.processor = null;
    this.initPromise = this.init();
  }

  async init() {
    await ensureWasmInit();
    this.processor = new wasm.WasmAstProcessor();
  }

  async processJsx(content, options = {}) {
    await this.initPromise;
    return this.processor.processJsx(content, this._normalizeOptions(options));
  }

  async processXml(content, options = {}) {
    await this.initPromise;
    return this.processor.processXml(content, this._normalizeOptions(options));
  }

  async processHtml(content, options = {}) {
    await this.initPromise;
    return this.processor.processHtml(content, this._normalizeOptions(options));
  }

  async processAuto(content, options = {}) {
    await this.initPromise;
    return this.processor.processAuto(content, this._normalizeOptions(options));
  }

  _normalizeOptions(options) {
    return {
      attr: options.attr || 'data-ast-id',
      strategy: options.strategy || 'hash',
      prefix: options.prefix || 'el-',
      overwrite: options.overwrite || false,
      selector: options.selector || null,
      include: options.include || [],
      exclude: options.exclude || []
    };
  }
}

// Babel plugin compatibility
export function babelPluginJsxAppendIds(babel) {
  let processor;
  
  return {
    name: 'babel-plugin-jsx-append-ids-wasm',
    async visitor() {
      if (!processor) {
        processor = new AstAppendIds();
        await processor.initPromise;
      }
      
      return {
        Program(path, state) {
          const code = path.hub.file.code;
          const options = state.opts || {};
          
          try {
            const result = processor.processJsx(code, options);
            path.hub.file.code = result;
          } catch (error) {
            throw path.buildCodeFrameError(error.message);
          }
        }
      };
    }
  };
}

// Rehype plugin compatibility
export function rehypeAppendIds(options = {}) {
  let processor;
  
  return async function transformer(tree, file) {
    if (!processor) {
      processor = new AstAppendIds();
      await processor.initPromise;
    }
    
    const html = tree.toString();
    
    try {
      const result = await processor.processHtml(html, options);
      // Parse result back to HAST tree
      // This would need proper HTML parsing library in production
      return result;
    } catch (error) {
      throw new Error(`rehype-append-ids: ${error.message}`);
    }
  };
}

// XAST plugin compatibility
export function xastAppendIds(options = {}) {
  let processor;
  
  return async function transformer(tree, file) {
    if (!processor) {
      processor = new AstAppendIds();
      await processor.initPromise;
    }
    
    const xml = tree.toString();
    
    try {
      const result = await processor.processXml(xml, options);
      // Parse result back to XAST tree
      // This would need proper XML parsing library in production
      return result;
    } catch (error) {
      throw new Error(`xast-append-ids: ${error.message}`);
    }
  };
}

// Direct WASM exports for advanced users
export async function processJsx(content, options) {
  await ensureWasmInit();
  return wasm.babelPluginJsxAppendIds(content, options);
}

export async function processXml(content, options) {
  await ensureWasmInit();
  return wasm.xastAppendIds(content, options);
}

export async function processHtml(content, options) {
  await ensureWasmInit();
  return wasm.rehypeAppendIds(content, options);
}

export async function version() {
  await ensureWasmInit();
  return wasm.version();
}

export async function createDefaultOptions() {
  await ensureWasmInit();
  return wasm.create_default_options();
}

// Default export
export default AstAppendIds;