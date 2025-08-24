# @thinkeloquent/xast-append-ids

An [xast](https://github.com/syntax-tree/xast) plugin to append deterministic IDs to XML elements with proper namespace support.

## Installation

```bash
npm install @thinkeloquent/xast-append-ids
```

## Usage

```javascript
import { unified } from 'unified';
import { fromXml } from 'xast-util-from-xml';
import { toXml } from 'xast-util-to-xml';
import xastAppendIds from '@thinkeloquent/xast-append-ids';

const processor = unified()
  .use(xastFromXml)
  .use(xastAppendIds, {
    selector: '*:not([xml:id])',
    attr: 'xml:id',
    strategy: 'hash',
    prefix: 'xml-',
    overwrite: false
  })
  .use(xastToXml);

const xml = '<root><element>Content</element></root>';
const result = processor.processSync(xml).toString();
// <root><element xml:id="xml-a1b2c3d4">Content</element></root>
```

## Options

- `selector` (string, default: `'*:not([id])'`) - CSS selector for targeting elements
- `attr` (string, default: `'data-ast-id'`) - Attribute name for the ID (supports namespaces like `'xml:id'`)
- `strategy` (string, default: `'hash'`) - ID generation strategy: `'hash'`, `'slug'`, or `'path'`
- `prefix` (string, default: `'el-'`) - Prefix for generated IDs
- `overwrite` (boolean, default: `false`) - Whether to overwrite existing IDs
- `namespace` (string, optional) - XML namespace prefix for the ID attribute

## Namespace Support

This plugin correctly handles XML namespaces. You can use namespaced attributes like `xml:id`:

```javascript
{
  attr: 'xml:id',        // Namespaced attribute
  namespace: 'custom'    // Custom namespace prefix
}
```

## ID Generation Strategies

### Hash (Default)
Generates a deterministic hash from the element's path and content.

### Slug
Creates IDs from the element's text content.

### Path
Generates IDs based on the element's position in the tree.

## Module System

This package uses ES Modules (ESM) with `.mjs` file extension. Make sure your project supports ESM or configure your build tools accordingly.

## Dependencies

This package depends on:
- `@thinkeloquent/id-generator` - Core ID generation utilities
- `xast-util-select` - CSS selector support for XAST
- `unist-util-visit` - Tree traversal utilities

## License

MIT