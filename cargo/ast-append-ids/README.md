# AST Append IDs - Rust/WASM Implementation

A unified Rust implementation that combines the functionality of three npm packages:

- `babel-plugin-jsx-append-ids` - JSX/React element ID appending
- `xast-append-ids` - XML element ID appending
- `rehype-append-ids` - HTML element ID appending

This implementation provides both a native CLI tool and WASM bindings for use in JavaScript/TypeScript projects.

## Features

- 🚀 **High Performance**: Native Rust implementation with WASM bindings
- 🎯 **Unified API**: Single tool for JSX, XML, and HTML processing
- 🔧 **Multiple Interfaces**: CLI tool, Rust library, and WASM module
- 📦 **Drop-in Replacement**: Compatible with existing npm packages
- 🎨 **Flexible ID Generation**: Hash, slug, or path-based strategies
- 🔍 **Selective Processing**: Include/exclude lists and CSS selectors

## Installation

### As a Rust CLI tool

```bash
cargo install ast-append-ids
```

### As an npm package (WASM)

```bash
npm install @thinkeloquent/ast-append-ids-wasm
```

## Usage

### CLI Usage

```bash
# Process JSX files
ast-append-ids jsx src/**/*.jsx --strategy hash --prefix "el-"

# Process XML files
ast-append-ids xml data/*.xml --attr "id" --overwrite

# Process HTML files
ast-append-ids html dist/*.html --selector "div, span" --output processed/

# Auto-detect file type
ast-append-ids auto src/**/* --verbose
```

### JavaScript/TypeScript Usage

```javascript
import { AstAppendIds } from "@thinkeloquent/ast-append-ids-wasm";

const processor = new AstAppendIds();

// Process JSX
const jsxResult = await processor.processJsx(jsxContent, {
  attr: "data-ast-id",
  strategy: "hash",
  prefix: "el-",
  include: ["div", "span"],
  exclude: ["script"],
});

// Process HTML
const htmlResult = await processor.processHtml(htmlContent, {
  selector: "*:not([id])",
  strategy: "slug",
  overwrite: false,
});

// Process XML
const xmlResult = await processor.processXml(xmlContent, {
  strategy: "path",
  prefix: "node-",
});

// Auto-detect content type
const result = await processor.processAuto(content);
```

### Plugin Compatibility

The WASM module provides drop-in replacements for the original npm packages:

```javascript
// Babel plugin
import { babelPluginJsxAppendIds } from "@thinkeloquent/ast-append-ids-wasm";

// .babelrc.js
module.exports = {
  plugins: [
    [
      babelPluginJsxAppendIds,
      {
        attr: "data-ast-id",
        strategy: "hash",
      },
    ],
  ],
};

// Rehype plugin
import { rehypeAppendIds } from "@thinkeloquent/ast-append-ids-wasm";

// Unified pipeline
unified()
  .use(rehypeParse)
  .use(rehypeAppendIds, { strategy: "slug" })
  .use(rehypeStringify)
  .process(html);

// XAST plugin
import { xastAppendIds } from "@thinkeloquent/ast-append-ids-wasm";
```

## Configuration Options

| Option      | Type                             | Default         | Description                  |
| ----------- | -------------------------------- | --------------- | ---------------------------- |
| `attr`      | string                           | `'data-ast-id'` | Attribute name for the ID    |
| `strategy`  | `'hash'` \| `'slug'` \| `'path'` | `'hash'`        | ID generation strategy       |
| `prefix`    | string                           | `'el-'`         | Prefix for generated IDs     |
| `overwrite` | boolean                          | `false`         | Overwrite existing IDs       |
| `selector`  | string                           | -               | CSS selector (HTML/XML only) |
| `include`   | string[]                         | `[]`            | Tags to include (JSX only)   |
| `exclude`   | string[]                         | `[]`            | Tags to exclude (JSX only)   |

## Building from Source

### Prerequisites

- Rust 1.70+
- wasm-pack
- Node.js 14+

### Build Commands

```bash
# Clone the repository
git clone https://github.com/thinkeloquent/ast-append-ids
cd ast-append-ids/cargo/ast-append-ids

# Build everything
./build.sh

# Or build individually:

# install
cargo install --path

# Build native CLI
cargo build --release

# Build WASM for Node.js
wasm-pack build --target nodejs --out-dir pkg-node

# Build WASM for browsers
wasm-pack build --target web --out-dir pkg-web

# Run tests
cargo test
wasm-pack test --node
```

## Performance

The Rust/WASM implementation provides significant performance improvements:

- **2-5x faster** than pure JavaScript implementations
- **Lower memory usage** through Rust's ownership model
- **Parallel processing** support for batch operations
- **Zero-copy parsing** where possible

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
