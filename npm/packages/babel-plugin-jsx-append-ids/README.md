# @thinkeloquent/babel-plugin-jsx-append-ids

A Babel plugin to append deterministic IDs to JSX host elements at compile time.

## Installation

```bash
npm install --save-dev @thinkeloquent/babel-plugin-jsx-append-ids
```

## Usage

Configure in your Babel configuration:

```javascript
// babel.config.js (ESM)
import babelPluginJsxAppendIds from '@thinkeloquent/babel-plugin-jsx-append-ids';

export default {
  plugins: [
    [babelPluginJsxAppendIds, {
      "attr": "data-ast-id",
      "strategy": "hash",
      "prefix": "jsx-",
      "overwrite": false,
      "include": [],
      "exclude": ["svg"]
    }]
  ]
};

// Or in .babelrc (JSON)
{
  "plugins": [
    ["@thinkeloquent/babel-plugin-jsx-append-ids", {
      "attr": "data-ast-id",
      "strategy": "hash"
    }]
  ]
}
```

## Example

```jsx
// Input
function App() {
  return (
    <div>
      <span>Hello</span>
      <MyComponent />  {/* Components are ignored */}
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

## Options

- `attr` (string, default: `'data-ast-id'`) - Attribute name for the ID
- `strategy` (string, default: `'hash'`) - ID generation strategy: `'hash'`, `'slug'`, or `'path'`
- `prefix` (string, default: `'el-'`) - Prefix for generated IDs
- `overwrite` (boolean, default: `false`) - Whether to overwrite existing IDs
- `include` (array, default: `[]`) - Array of tag names to include (empty = all host elements)
- `exclude` (array, default: `[]`) - Array of tag names to exclude

## Important Notes

- This plugin only targets **host elements** (lowercase HTML tags like `div`, `span`, etc.)
- React components (uppercase tags) are automatically ignored
- IDs are generated deterministically at compile time for consistent results

## ID Generation Strategies

### Hash (Default)
Generates a deterministic hash based on the element's location in the source code.

### Slug
Creates IDs from the element's text content when available.

### Path
Generates IDs based on the element's position in the JSX tree.

## Module System

This package uses ES Modules (ESM) with `.mjs` file extension. The plugin can be imported as an ESM module or referenced by name in Babel configurations.

## Dependencies

This package depends on:
- `@thinkeloquent/id-generator` - Core ID generation utilities
- `@babel/core` - Babel core functionality

## License

MIT