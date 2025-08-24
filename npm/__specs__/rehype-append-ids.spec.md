# rehype-append-ids Test Specification

## Module: packages/rehype-append-ids/index.js

### Purpose
Test the rehype plugin for appending IDs to HTML elements in HAST trees.

## Test Scenarios

### 1. Basic Functionality Tests
- **Given**: Simple HTML with div and span
- **When**: Plugin processes with default options
- **Then**: Should add data-ast-id to all elements

- **Given**: HTML with existing IDs
- **When**: Plugin processes without overwrite
- **Then**: Should skip elements with existing IDs

- **Given**: HTML with existing IDs
- **When**: Plugin processes with overwrite: true
- **Then**: Should replace existing IDs

### 2. Selector Tests
- **Given**: HTML with multiple element types
- **When**: Selector "div" is used
- **Then**: Should only add IDs to div elements

- **Given**: HTML with elements having IDs
- **When**: Selector "*:not([id])" is used
- **Then**: Should only add IDs to elements without existing id attribute

- **Given**: Complex HTML structure
- **When**: Multiple selectors "div, span, p" used
- **Then**: Should add IDs to all matching elements

- **Given**: HTML with classes
- **When**: Selector ".className" is used
- **Then**: Should only add IDs to elements with that class

### 3. Attribute Configuration Tests
- **Given**: HTML elements
- **When**: attr set to "id"
- **Then**: Should use standard id attribute

- **Given**: HTML elements
- **When**: attr set to "data-test-id"
- **Then**: Should use custom attribute name

### 4. Strategy Tests
- **Given**: HTML with text content
- **When**: Strategy set to 'slug'
- **Then**: Should generate slug-based IDs from text

- **Given**: HTML structure
- **When**: Strategy set to 'path'
- **Then**: Should generate path-based IDs

- **Given**: HTML structure
- **When**: Strategy set to 'hash'
- **Then**: Should generate hash-based IDs

### 5. Prefix Tests
- **Given**: HTML elements
- **When**: Custom prefix "html-" is set
- **Then**: All generated IDs should start with "html-"

### 6. Complex Structure Tests
- **Given**: Deeply nested HTML
- **When**: Plugin processes
- **Then**: Should correctly track paths for all nested elements

- **Given**: HTML with siblings
- **When**: Plugin processes
- **Then**: Should generate unique IDs for siblings

### 7. Integration Tests
- **Given**: Full HTML document
- **When**: Used in unified pipeline with rehype-parse and rehype-stringify
- **Then**: Should produce valid HTML with IDs

- **Given**: HTML fragment
- **When**: Multiple plugins in pipeline
- **Then**: Should work correctly with other plugins

### 8. Collision Handling Tests
- **Given**: Multiple elements generating same ID
- **When**: Plugin processes
- **Then**: Should append counters to ensure uniqueness

- **Given**: Existing data-ast-id attributes
- **When**: Plugin processes
- **Then**: Should respect existing IDs in collision detection

### 9. Edge Cases
- **Given**: Empty HTML
- **When**: Plugin processes
- **Then**: Should handle gracefully

- **Given**: HTML with comments
- **When**: Plugin processes
- **Then**: Should ignore comment nodes

- **Given**: HTML with text nodes
- **When**: Plugin processes
- **Then**: Should only process element nodes

- **Given**: Self-closing tags
- **When**: Plugin processes
- **Then**: Should handle correctly

## Performance Tests
- Process large HTML files (1000+ elements)
- Measure execution time
- Verify memory usage is reasonable

## Error Handling
- Invalid selectors
- Malformed HTML
- Missing dependencies
- Invalid options