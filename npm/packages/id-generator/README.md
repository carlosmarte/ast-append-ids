# @thinkeloquent/id-generator

Deterministic ID generation utilities for AST nodes. This package provides the core ID generation strategies used by the ast-append-ids toolkit.

## Installation

```bash
npm install @thinkeloquent/id-generator
```

## Usage

```javascript
import { generateId, generateHashId, generateSlugId, generatePathId } from '@thinkeloquent/id-generator';

// Generate a hash-based ID
const id = generateId(node, {
  strategy: 'hash',
  prefix: 'el-',
  format: 'colon'
}, path, usedIds);
```

## API

### `generateId(node, options, path, usedIds)`

Main ID generator function that ensures uniqueness.

- `node` - AST node object
- `options` - Configuration object
  - `strategy` - 'hash' | 'slug' | 'path' (default: 'hash')
  - `prefix` - ID prefix (default: '')
  - `format` - 'colon' | 'hyphen' (default: 'colon')
- `path` - Array of indices representing path to node
- `usedIds` - Set of already used IDs

### `generateHashId(node, path, prefix)`

Generate deterministic hash from node content and path.

### `generateSlugId(node, prefix)`

Generate slug from node text content.

### `generatePathId(node, path, prefix)`

Generate ID from node position in tree.

### `ensureUniqueId(id, usedIds)`

Ensure ID uniqueness by appending counter if needed.

### `convertIdFormat(id, format)`

Convert between hyphenated and colon format.

### `extractTextContent(node)`

Extract text content from a node recursively.

## License

MIT