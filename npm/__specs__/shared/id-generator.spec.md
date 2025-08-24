# ID Generator Test Specification

## Module: shared/id-generator.js

### Purpose
Test the core ID generation functionality that all packages depend on.

## Test Scenarios

### 1. Hash Strategy Tests
- **Given**: A node with path [0, 1, 2]
- **When**: generateHashId is called
- **Then**: Should return deterministic hash based on node content and path

- **Given**: Same node called multiple times
- **When**: generateHashId is called
- **Then**: Should return identical hash each time

- **Given**: Different nodes with same content
- **When**: generateHashId is called with different paths
- **Then**: Should return different hashes

### 2. Slug Strategy Tests
- **Given**: Node with text "Hello World"
- **When**: generateSlugId is called
- **Then**: Should return "hello-world"

- **Given**: Node with special characters "Hello! @World#"
- **When**: generateSlugId is called
- **Then**: Should return sanitized "hello-world"

- **Given**: Node with no text content
- **When**: generateSlugId is called
- **Then**: Should fallback to hash strategy

- **Given**: Node with very long text
- **When**: generateSlugId is called
- **Then**: Should truncate to 50 characters

### 3. Path Strategy Tests
- **Given**: Node at path [0, 2, 1] with tagName "div"
- **When**: generatePathId is called
- **Then**: Should return "div-0-2-1"

- **Given**: Node at root with no path
- **When**: generatePathId is called
- **Then**: Should return just the tag name with prefix

### 4. Collision Handling Tests
- **Given**: Set with existing ID "el-test"
- **When**: ensureUniqueId called with "el-test"
- **Then**: Should return "el-test-2"

- **Given**: Set with "el-test" and "el-test-2"
- **When**: ensureUniqueId called with "el-test"
- **Then**: Should return "el-test-3"

### 5. Format Conversion Tests
- **Given**: ID "1:2:3"
- **When**: convertIdFormat called with 'hyphen'
- **Then**: Should return "1-2-3"

- **Given**: ID "1-2-3"
- **When**: convertIdFormat called with 'colon'
- **Then**: Should return "1:2:3"

### 6. Text Extraction Tests
- **Given**: Node with direct text value
- **When**: extractTextContent called
- **Then**: Should return the text value

- **Given**: Node with nested children
- **When**: extractTextContent called
- **Then**: Should return concatenated text from all children

- **Given**: Node with no text
- **When**: extractTextContent called
- **Then**: Should return empty string

### 7. Main generateId Function Tests
- **Given**: Node with strategy 'hash'
- **When**: generateId called
- **Then**: Should use hash strategy

- **Given**: Node with strategy 'slug'
- **When**: generateId called
- **Then**: Should use slug strategy

- **Given**: Node with strategy 'path'
- **When**: generateId called
- **Then**: Should use path strategy

- **Given**: Node with custom prefix
- **When**: generateId called
- **Then**: Should apply prefix to generated ID

- **Given**: Generated ID that already exists
- **When**: generateId called
- **Then**: Should ensure uniqueness with counter

## Edge Cases
1. Null/undefined nodes
2. Empty paths
3. Missing properties on nodes
4. Very large usedIds sets (performance)
5. Unicode characters in text content
6. Circular references in node structures