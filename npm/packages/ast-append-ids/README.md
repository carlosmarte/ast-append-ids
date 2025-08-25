# @thinkeloquent/ast-append-ids

Unified AST ID appender for JSX, XML, and HTML with high-performance WASM implementation. This package automatically loads the appropriate WASM build based on your environment.

## Features

- 🚀 High-performance Rust/WASM implementation
- 🎯 Automatic environment detection (Browser, Node.js, Bundlers)
- 📦 Support for JSX, XML, and HTML processing
- 🔧 Compatible with Babel, Rehype, and XAST ecosystems
- 💻 Works in browsers, Node.js, and bundler environments
- 🔄 Deterministic ID generation

## Installation

```bash
npm install @thinkeloquent/ast-append-ids
```

or

```bash
yarn add @thinkeloquent/ast-append-ids
```

## Usage

### ESM (Modern JavaScript)

```javascript
import { 
  babelPluginJsxAppendIds, 
  rehypeAppendIds, 
  xastAppendIds,
  WasmAstProcessor 
} from '@thinkeloquent/ast-append-ids';

// Process JSX
const jsxResult = await babelPluginJsxAppendIds(jsxContent, {
  idPrefix: 'jsx',
  preserveExisting: true
});

// Process HTML
const htmlResult = await rehypeAppendIds(htmlContent, {
  idPrefix: 'html',
  idAttribute: 'data-id'
});

// Process XML
const xmlResult = await xastAppendIds(xmlContent, {
  idPrefix: 'xml',
  idSeparator: '-'
});

// Using the processor class
const processor = new WasmAstProcessor();
const result = await processor.processAuto(content, options);
processor.free(); // Clean up when done
```

### CommonJS

```javascript
const { 
  babelPluginJsxAppendIds,
  rehypeAppendIds,
  xastAppendIds,
  WasmAstProcessor 
} = require('@thinkeloquent/ast-append-ids');

// All functions return promises in CommonJS
async function processContent() {
  const result = await babelPluginJsxAppendIds(content, options);
  console.log(result);
}
```

### Browser

The package automatically loads the web-optimized WASM build when used in browsers:

```html
<script type="module">
import { babelPluginJsxAppendIds } from '@thinkeloquent/ast-append-ids';

const result = await babelPluginJsxAppendIds(jsxContent, {
  idPrefix: 'component'
});
</script>
```

## API

### Functions

#### `create_default_options()`
Returns the default options object for processing.

#### `version()`
Returns the version of the WASM module.

#### `babelPluginJsxAppendIds(content, options)`
Process JSX content and append IDs to elements.

#### `rehypeAppendIds(content, options)`
Process HTML content using rehype and append IDs.

#### `xastAppendIds(content, options)`
Process XML content using xast and append IDs.

### WasmAstProcessor Class

A class providing methods for processing different content types:

- `processJsx(content, options)` - Process JSX content
- `processXml(content, options)` - Process XML content
- `processHtml(content, options)` - Process HTML content
- `processAuto(content, options)` - Auto-detect content type and process
- `free()` - Clean up WASM resources

### Options

All processing functions accept an options object:

```typescript
interface ProcessorOptions {
  idAttribute?: string;      // Attribute name for IDs (default: 'id')
  idPrefix?: string;         // Prefix for generated IDs
  idSeparator?: string;      // Separator for ID parts (default: '_')
  skipIds?: boolean;         // Skip ID generation
  preserveExisting?: boolean; // Preserve existing IDs
}
```

## Environment Detection

The package automatically detects and loads the appropriate WASM build:

- **Browser**: Loads the web-optimized build from `pkg-web`
- **Node.js**: Loads the Node.js-specific build from `pkg-node`
- **Bundlers** (Webpack, Rollup, Vite): Loads the bundler-optimized build from `pkg-bundler`

## CLI Usage

The package includes a CLI tool:

```bash
npx ast-append-ids process input.jsx --output output.jsx --type jsx
```

## Performance

This package uses a high-performance Rust/WASM implementation that provides:

- Fast parsing and transformation
- Low memory footprint
- Deterministic ID generation
- Efficient handling of large files

## License

MIT

## Author

ThinkEloquent

## Repository

[https://github.com/thinkeloquent/ast-append-ids](https://github.com/thinkeloquent/ast-append-ids)