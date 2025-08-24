# xast-append-ids Test Specification

## Module: packages/xast-append-ids/index.js

### Purpose
Test the XAST plugin for appending IDs to XML elements with namespace support.

## Test Scenarios

### 1. Basic XML Processing
- **Given**: Simple XML document
- **When**: Plugin processes with default options
- **Then**: Should add data-ast-id to all elements

- **Given**: XML with existing IDs
- **When**: Plugin processes without overwrite
- **Then**: Should preserve existing IDs

### 2. Namespace Support Tests
- **Given**: XML with namespaced elements
- **When**: Plugin processes
- **Then**: Should handle namespaces correctly

- **Given**: XML elements
- **When**: attr set to "xml:id"
- **Then**: Should create namespaced attribute

- **Given**: XML with custom namespace
- **When**: namespace option provided
- **Then**: Should use custom namespace prefix

- **Given**: Mixed namespace document
- **When**: Plugin processes
- **Then**: Should maintain namespace integrity

### 3. Attribute Handling Tests
- **Given**: Element with existing xml:id
- **When**: Plugin checks for existing ID
- **Then**: Should recognize namespaced attribute

- **Given**: Element with multiple attributes
- **When**: setAttribute called
- **Then**: Should add attribute correctly

- **Given**: Element with conflicting attribute
- **When**: overwrite is true
- **Then**: Should replace existing attribute

### 4. Selector Tests with XML
- **Given**: XML with different element types
- **When**: Selector used
- **Then**: Should match XML elements correctly

- **Given**: XML with namespaced selectors
- **When**: Selector includes namespace
- **Then**: Should match namespaced elements

### 5. XML-Specific Edge Cases
- **Given**: XML declaration
- **When**: Plugin processes
- **Then**: Should preserve declaration

- **Given**: CDATA sections
- **When**: Plugin processes
- **Then**: Should handle CDATA correctly

- **Given**: Processing instructions
- **When**: Plugin processes
- **Then**: Should ignore processing instructions

- **Given**: DTD references
- **When**: Plugin processes
- **Then**: Should preserve DTD

### 6. Complex XML Structures
- **Given**: Deeply nested XML
- **When**: Building node paths
- **Then**: Should track paths accurately

- **Given**: XML with mixed content
- **When**: Plugin processes
- **Then**: Should only process element nodes

### 7. Integration Tests
- **Given**: Complete XML document
- **When**: Used with xast-util-from-xml and xast-util-to-xml
- **Then**: Should produce valid XML

- **Given**: XML with schemas
- **When**: Plugin processes
- **Then**: Should maintain schema validity

### 8. Special XML Attributes
- **Given**: Elements with xml:lang, xml:space
- **When**: Plugin processes
- **Then**: Should not interfere with special attributes

- **Given**: Elements with xlink attributes
- **When**: Plugin processes
- **Then**: Should maintain xlink namespace

### 9. Format Specific Tests
- **Given**: SVG document
- **When**: Plugin processes
- **Then**: Should handle SVG elements correctly

- **Given**: RSS/Atom feed
- **When**: Plugin processes
- **Then**: Should process feed elements

- **Given**: SOAP envelope
- **When**: Plugin processes
- **Then**: Should handle SOAP structure

## Performance Tests
- Large XML files (10,000+ elements)
- Complex namespace hierarchies
- Memory usage monitoring

## Error Handling
- Malformed XML
- Invalid namespaces
- Circular references
- Missing required utilities