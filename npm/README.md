# ast-append-ids

A monorepo toolkit for deterministically appending unique IDs to elements in various Abstract Syntax Trees (ASTs). This toolkit provides modular plugins for HTML, XML, and JSX ecosystems.

## Features

- 🔒 **Deterministic ID Generation** - Stable IDs across multiple builds
- 🎯 **Selective Targeting** - CSS-like selectors for precise element selection
- 🔧 **Multiple Strategies** - Hash, slug, and path-based ID generation
- 🚀 **Non-Destructive** - Preserves existing IDs by default
- 📦 **Modular Design** - Separate packages for each ecosystem

## Packages

This monorepo contains four specialized packages:

- [`@thinkeloquent/id-generator`](#id-generator) - Core ID generation utilities
- [`@thinkeloquent/rehype-append-ids`](#rehype-append-ids) - For HTML processing with rehype
- [`@thinkeloquent/xast-append-ids`](#xast-append-ids) - For XML processing with xast
- [`@thinkeloquent/babel-plugin-jsx-append-ids`](#babel-plugin-jsx-append-ids) - For JSX at compile time with Babel

## Installation

Install the package you need:

```bash
# For HTML processing
npm install @thinkeloquent/rehype-append-ids

# For XML processing
npm install @thinkeloquent/xast-append-ids

# For JSX/React
npm install --save-dev @thinkeloquent/babel-plugin-jsx-append-ids

# Core ID generation utilities (installed automatically as dependency)
npm install @thinkeloquent/id-generator
```

## Configuration

All packages share a similar configuration interface:

```javascript
{
  selector: '*:not([id])',  // CSS selector for targeting elements
  attr: 'data-ast-id',      // Attribute name for the ID
  strategy: 'hash',         // ID generation strategy: 'hash', 'slug', 'path'
  prefix: 'el-',            // Prefix for generated IDs
  overwrite: false          // Whether to overwrite existing IDs
}
```

## Module System

All packages in this monorepo use ES Modules (ESM) with `.mjs` file extensions. This ensures:

- Modern JavaScript module syntax
- Better tree-shaking capabilities
- Consistent module resolution
- Future-proof architecture

### Usage Example

```javascript
// ESM import syntax
import rehypeAppendIds from "@thinkeloquent/rehype-append-ids";
import xastAppendIds from "@thinkeloquent/xast-append-ids";
import babelPluginJsxAppendIds from "@thinkeloquent/babel-plugin-jsx-append-ids";
```

## ID Generation Strategies

### Hash Strategy (Default)

Generates a deterministic hash from the node's path and content. This ensures stability across builds while being collision-resistant.

```html
<!-- Input -->
<div>Content</div>

<!-- Output -->
<div data-ast-id="el-a3f9b2c1">Content</div>
```

### Slug Strategy

Creates IDs from the element's text content.

```html
<!-- Input -->
<h1>Hello World</h1>

<!-- Output -->
<h1 data-ast-id="el-hello-world">Hello World</h1>
```

### Path Strategy

Generates IDs based on the element's position in the tree.

```html
<!-- Input -->
<div>
  <span>Text</span>
</div>

<!-- Output -->
<div data-ast-id="el-div-0">
  <span data-ast-id="el-span-0-0">Text</span>
</div>
```

## rehype-append-ids

Process HTML with the unified/rehype ecosystem.

### Usage

```javascript
const unified = require("unified");
const rehypeParse = require("rehype-parse");
const rehypeStringify = require("rehype-stringify");
const rehypeAppendIds = require("rehype-append-ids");

const processor = unified()
  .use(rehypeParse)
  .use(rehypeAppendIds, {
    selector: "div, span",
    attr: "data-ast-id",
    strategy: "hash",
    prefix: "html-",
    overwrite: false,
  })
  .use(rehypeStringify);

const html = "<div><span>Hello</span></div>";
const result = processor.processSync(html).toString();
```

## xast-append-ids

Process XML with proper namespace support.

### Usage

```javascript
const unified = require("unified");
const xastFromXml = require("xast-util-from-xml");
const xastToXml = require("xast-util-to-xml");
const xastAppendIds = require("xast-append-ids");

const processor = unified()
  .use(xastFromXml)
  .use(xastAppendIds, {
    selector: "*:not([xml:id])",
    attr: "xml:id", // Can use namespaced attributes
    strategy: "hash",
    prefix: "xml-",
    overwrite: false,
  })
  .use(xastToXml);

const xml = "<root><element>Content</element></root>";
const result = processor.processSync(xml).toString();
```

### Namespace Support

The plugin correctly handles XML namespaces:

```javascript
{
  attr: 'xml:id',        // Namespaced attribute
  namespace: 'custom'    // Custom namespace prefix
}
```

## babel-plugin-jsx-append-ids

Add IDs to JSX elements at compile time. Only targets host elements (lowercase tags like `div`, `span`) and ignores React components.

### Usage

Configure in your Babel configuration:

```javascript
// .babelrc or babel.config.js
{
  "plugins": [
    ["babel-plugin-jsx-append-ids", {
      "attr": "data-ast-id",
      "strategy": "hash",
      "prefix": "jsx-",
      "overwrite": false,
      "include": [],        // Optional: only include these tags
      "exclude": ["svg"]    // Optional: exclude these tags
    }]
  ]
}
```

### Example

```jsx
// Input
function App() {
  return (
    <div>
      <span>Hello</span>
      <MyComponent /> {/* Components are ignored */}
    </div>
  );
}

// Output
function App() {
  return (
    <div data-ast-id="jsx-a1b2c3d4">
      <span data-ast-id="jsx-e5f6g7h8">Hello</span>
      <MyComponent />
    </div>
  );
}
```

## Collision Handling

When ID collisions occur, the toolkit automatically appends a counter:

```html
<!-- If "el-header" already exists -->
<div data-ast-id="el-header">First</div>
<div data-ast-id="el-header-2">Second</div>
<div data-ast-id="el-header-3">Third</div>
```

## Format Conversion

The toolkit supports conversion between hyphenated and colon formats:

- Colon format (internal): `1:3:45`
- Hyphen format (URLs): `1-3-45`

## Security Considerations

- ✅ Sanitized ID generation prevents XSS vectors
- ✅ Safe attribute names and values
- ✅ No execution of user-provided code
- ✅ Proper escaping of generated content

## Development

This is a monorepo using npm workspaces. To work on the packages:

```bash
# Install dependencies
npm install

# Run tests for all packages
npm test

# Build all packages
npm run build
```

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Prior Art

This toolkit builds upon and extends ideas from:

- [rehype-slug](https://github.com/rehypejs/rehype-slug) - Heading IDs for rehype
- [babel-plugin-jsx-auto-test-id](https://github.com/michellocana/babel-plugin-jsx-auto-test-id) - Test IDs for JSX

# Makefile

Development:

- make install - Install dependencies
- make test - Run all tests
- make test-coverage - Run tests with coverage
- make build - Build all packages
- make lint - Lint all packages

Publishing:

- make version-patch - Bump patch versions
- make publish-dry - Preview what gets published
- make publish - Publish to npm

1. make changeset - Create changesets describing your changes
2. make version - Update package versions based on changesets
3. make publish - Publish packages in correct dependency order
4. make release - Full workflow (test + lint + build + version + publish)

Complete Release Workflows:

- make release-patch - Test → Build → Version Patch → Publish
- make release-minor - Test → Build → Version Minor → Publish
- make release-major - Test → Build → Version Major → Publish
