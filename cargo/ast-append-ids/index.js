// Node.js wrapper for the WASM module
const wasm = require('./pkg-node/ast_append_ids');

// Export the main processor class
class AstAppendIds {
  constructor() {
    this.processor = new wasm.WasmAstProcessor();
  }

  processJsx(content, options = {}) {
    return this.processor.processJsx(content, this._normalizeOptions(options));
  }

  processXml(content, options = {}) {
    return this.processor.processXml(content, this._normalizeOptions(options));
  }

  processHtml(content, options = {}) {
    return this.processor.processHtml(content, this._normalizeOptions(options));
  }

  processAuto(content, options = {}) {
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
function babelPluginJsxAppendIds(babel) {
  const processor = new AstAppendIds();
  
  return {
    name: 'babel-plugin-jsx-append-ids-wasm',
    visitor: {
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
    }
  };
}

// Rehype plugin compatibility
function rehypeAppendIds(options = {}) {
  const processor = new AstAppendIds();
  
  return function transformer(tree, file) {
    const html = tree.toString();
    
    try {
      const result = processor.processHtml(html, options);
      // Parse result back to HAST tree
      // This would need proper HTML parsing library in production
      return result;
    } catch (error) {
      throw new Error(`rehype-append-ids: ${error.message}`);
    }
  };
}

// XAST plugin compatibility
function xastAppendIds(options = {}) {
  const processor = new AstAppendIds();
  
  return function transformer(tree, file) {
    const xml = tree.toString();
    
    try {
      const result = processor.processXml(xml, options);
      // Parse result back to XAST tree
      // This would need proper XML parsing library in production
      return result;
    } catch (error) {
      throw new Error(`xast-append-ids: ${error.message}`);
    }
  };
}

// Export everything
module.exports = {
  AstAppendIds,
  babelPluginJsxAppendIds,
  rehypeAppendIds,
  xastAppendIds,
  // Direct WASM exports for advanced users
  processJsx: wasm.babelPluginJsxAppendIds,
  processXml: wasm.xastAppendIds,
  processHtml: wasm.rehypeAppendIds,
  version: wasm.version,
  createDefaultOptions: wasm.create_default_options
};

// Also export as default
module.exports.default = AstAppendIds;