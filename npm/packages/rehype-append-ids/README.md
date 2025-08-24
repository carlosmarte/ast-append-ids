# @thinkeloquent/rehype-append-ids

A [rehype](https://github.com/rehypejs/rehype) plugin to append deterministic IDs to HTML elements.

## Installation

```bash
npm install @thinkeloquent/rehype-append-ids
```

## Usage

```javascript
import { unified } from 'unified';
import rehypeParse from 'rehype-parse';
import rehypeStringify from 'rehype-stringify';
import rehypeAppendIds from '@thinkeloquent/rehype-append-ids';

const processor = unified()
  .use(rehypeParse)
  .use(rehypeAppendIds, {
    selector: 'div, span',
    attr: 'data-ast-id',
    strategy: 'hash',
    prefix: 'html-',
    overwrite: false
  })
  .use(rehypeStringify);

const html = '<div><span>Hello</span></div>';
const result = processor.processSync(html).toString();
// <div data-ast-id="html-a1b2c3d4"><span data-ast-id="html-e5f6g7h8">Hello</span></div>
```

## Options

- `selector` (string, default: `'*:not([id])'`) - CSS selector for targeting elements
- `attr` (string, default: `'data-ast-id'`) - Attribute name for the ID
- `strategy` (string, default: `'hash'`) - ID generation strategy: `'hash'`, `'slug'`, or `'path'`
- `prefix` (string, default: `'el-'`) - Prefix for generated IDs
- `overwrite` (boolean, default: `false`) - Whether to overwrite existing IDs

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
- `hast-util-select` - CSS selector support for HAST
- `unist-util-visit` - Tree traversal utilities

## License

MIT