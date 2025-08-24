# babel-plugin-jsx-append-ids Test Specification

## Module: packages/babel-plugin-jsx-append-ids/index.js

### Purpose
Test the Babel plugin for appending IDs to JSX host elements at compile time.

## Test Scenarios

### 1. Host Element Detection
- **Given**: JSX with <div> element
- **When**: Plugin transforms
- **Then**: Should add ID to div

- **Given**: JSX with <MyComponent />
- **When**: Plugin transforms
- **Then**: Should ignore React component

- **Given**: Mixed host and component elements
- **When**: Plugin transforms
- **Then**: Should only add IDs to host elements

- **Given**: Element with uppercase first letter
- **When**: Plugin transforms
- **Then**: Should treat as component and skip

### 2. JSX Transformation Tests
- **Given**: Simple JSX element
- **When**: Plugin transforms
- **Then**: Should add data-ast-id attribute

- **Given**: Self-closing JSX element
- **When**: Plugin transforms
- **Then**: Should add attribute correctly

- **Given**: JSX with existing attributes
- **When**: Plugin transforms
- **Then**: Should preserve existing attributes

### 3. Include/Exclude Lists
- **Given**: Include list ["div", "span"]
- **When**: Plugin transforms various elements
- **Then**: Should only add IDs to included elements

- **Given**: Exclude list ["svg", "path"]
- **When**: Plugin transforms
- **Then**: Should skip excluded elements

- **Given**: Both include and exclude lists
- **When**: Plugin transforms
- **Then**: Include should take precedence

### 4. JSX Expression Handling
- **Given**: JSX with expressions {variable}
- **When**: Plugin transforms
- **Then**: Should handle expressions correctly

- **Given**: JSX with spread attributes
- **When**: Plugin transforms
- **Then**: Should add ID alongside spread

- **Given**: Conditional rendering
- **When**: Plugin transforms
- **Then**: Should add IDs to rendered elements

### 5. Strategy Tests in JSX Context
- **Given**: JSX with text children
- **When**: Strategy is 'slug'
- **Then**: Should extract text for ID generation

- **Given**: JSX with expression children
- **When**: Strategy is 'slug'
- **Then**: Should handle string literals in expressions

- **Given**: Nested JSX structure
- **When**: Strategy is 'path'
- **Then**: Should generate path-based IDs

### 6. React-Specific Patterns
- **Given**: Fragment (<> </>)
- **When**: Plugin transforms
- **Then**: Should skip fragments

- **Given**: React.Fragment
- **When**: Plugin transforms
- **Then**: Should skip React.Fragment

- **Given**: Namespaced elements (e.g., <svg:circle>)
- **When**: Plugin transforms
- **Then**: Should handle namespace correctly

### 7. File-Level State Management
- **Given**: Multiple components in file
- **When**: Plugin transforms
- **Then**: Should track IDs across entire file

- **Given**: Duplicate IDs generated
- **When**: Plugin transforms
- **Then**: Should append counters for uniqueness

### 8. Complex JSX Patterns
- **Given**: Map rendering lists
- **When**: Plugin transforms
- **Then**: Should add unique IDs to each item

- **Given**: Nested components
- **When**: Plugin transforms
- **Then**: Should only process host elements

- **Given**: HOC patterns
- **When**: Plugin transforms
- **Then**: Should handle correctly

### 9. TypeScript JSX (TSX)
- **Given**: TSX file with type annotations
- **When**: Plugin transforms
- **Then**: Should handle TSX correctly

- **Given**: Generic components
- **When**: Plugin transforms
- **Then**: Should ignore generic components

### 10. Integration Tests
- **Given**: Full React component file
- **When**: Babel compiles with plugin
- **Then**: Should produce valid JavaScript

- **Given**: Create React App setup
- **When**: Plugin integrated
- **Then**: Should work with CRA pipeline

- **Given**: Next.js application
- **When**: Plugin configured
- **Then**: Should work with Next.js compilation

## Edge Cases
- JSX in loops
- Dynamically created elements
- Conditional attributes
- Elements created via React.createElement
- JSX spread children
- Keys and refs on elements

## Performance Tests
- Large component files (100+ elements)
- Complex component trees
- Build time impact measurement

## Error Handling
- Invalid JSX
- Missing Babel dependencies
- Malformed configuration
- AST traversal errors