import rehypeAppendIds from '../index.mjs';

describe('rehype-append-ids Unit Tests', () => {
  describe('Plugin initialization', () => {
    it('should return a transformer function', () => {
      const plugin = rehypeAppendIds();
      expect(typeof plugin).toBe('function');
    });
    
    it('should accept options object', () => {
      const plugin = rehypeAppendIds({
        selector: 'div',
        attr: 'id',
        strategy: 'slug',
        prefix: 'test-',
        overwrite: true
      });
      expect(typeof plugin).toBe('function');
    });
    
    it('should use default options when none provided', () => {
      const plugin = rehypeAppendIds();
      const tree = {
        type: 'root',
        children: [
          { type: 'element', tagName: 'div', properties: {}, children: [] }
        ]
      };
      
      expect(typeof plugin).toBe('function');
      const result = plugin(tree);
      expect(result).toBeDefined();
    });
  });
  
  describe('Basic ID generation', () => {
    it('should add IDs to elements without existing IDs', () => {
      const plugin = rehypeAppendIds();
      const tree = {
        type: 'root',
        children: [
          {
            type: 'element',
            tagName: 'div',
            properties: {},
            children: []
          }
        ]
      };
      
      const result = plugin(tree);
      expect(result.children[0].properties).toBeDefined();
      expect(result.children[0].properties['data-ast-id']).toBeDefined();
      expect(typeof result.children[0].properties['data-ast-id']).toBe('string');
    });
    
    it('should skip elements with existing IDs when overwrite is false', () => {
      const plugin = rehypeAppendIds({ overwrite: false });
      const existingId = 'existing-id';
      const tree = {
        type: 'root',
        children: [
          {
            type: 'element',
            tagName: 'div',
            properties: { 'data-ast-id': existingId },
            children: []
          }
        ]
      };
      
      const result = plugin(tree);
      expect(result.children[0].properties['data-ast-id']).toBe(existingId);
    });
    
    it('should overwrite existing IDs when overwrite is true', () => {
      const plugin = rehypeAppendIds({ overwrite: true });
      const tree = {
        type: 'root',
        children: [
          {
            type: 'element',
            tagName: 'div',
            properties: { 'data-ast-id': 'old-id' },
            children: []
          }
        ]
      };
      
      const result = plugin(tree);
      expect(result.children[0].properties['data-ast-id']).not.toBe('old-id');
    });
  });
  
  describe('Custom attribute names', () => {
    it('should use custom attribute name', () => {
      const plugin = rehypeAppendIds({ attr: 'id' });
      const tree = {
        type: 'root',
        children: [
          {
            type: 'element',
            tagName: 'div',
            properties: {},
            children: []
          }
        ]
      };
      
      const result = plugin(tree);
      expect(result.children[0].properties.id).toBeDefined();
      expect(result.children[0].properties['data-ast-id']).toBeUndefined();
    });
    
    it('should use custom data attribute', () => {
      const plugin = rehypeAppendIds({ attr: 'data-test-id' });
      const tree = {
        type: 'root',
        children: [
          {
            type: 'element',
            tagName: 'span',
            properties: {},
            children: []
          }
        ]
      };
      
      const result = plugin(tree);
      expect(result.children[0].properties['data-test-id']).toBeDefined();
    });
  });
  
  describe('Strategy configuration', () => {
    it('should use hash strategy', () => {
      const plugin = rehypeAppendIds({ strategy: 'hash', prefix: 'hash-' });
      const tree = {
        type: 'root',
        children: [
          {
            type: 'element',
            tagName: 'div',
            properties: {},
            children: []
          }
        ]
      };
      
      const result = plugin(tree);
      const id = result.children[0].properties['data-ast-id'];
      expect(id).toMatch(/^hash-[a-f0-9]{8}$/);
    });
    
    it('should use slug strategy', () => {
      const plugin = rehypeAppendIds({ strategy: 'slug', prefix: 'slug-' });
      const tree = {
        type: 'root',
        children: [
          {
            type: 'element',
            tagName: 'h1',
            properties: {},
            children: [{ type: 'text', value: 'Hello World' }]
          }
        ]
      };
      
      const result = plugin(tree);
      const id = result.children[0].properties['data-ast-id'];
      expect(id).toBe('slug-hello-world');
    });
    
    it('should use path strategy', () => {
      const plugin = rehypeAppendIds({ strategy: 'path', prefix: 'path-' });
      const tree = {
        type: 'root',
        children: [
          {
            type: 'element',
            tagName: 'section',
            properties: {},
            children: []
          }
        ]
      };
      
      const result = plugin(tree);
      const id = result.children[0].properties['data-ast-id'];
      expect(id).toMatch(/^path-section/);
    });
  });
  
  describe('Prefix handling', () => {
    it('should apply custom prefix', () => {
      const plugin = rehypeAppendIds({ prefix: 'custom-prefix-' });
      const tree = {
        type: 'root',
        children: [
          {
            type: 'element',
            tagName: 'div',
            properties: {},
            children: []
          }
        ]
      };
      
      const result = plugin(tree);
      const id = result.children[0].properties['data-ast-id'];
      expect(id).toMatch(/^custom-prefix-/);
    });
    
    it('should handle empty prefix', () => {
      const plugin = rehypeAppendIds({ prefix: '' });
      const tree = {
        type: 'root',
        children: [
          {
            type: 'element',
            tagName: 'div',
            properties: {},
            children: []
          }
        ]
      };
      
      const result = plugin(tree);
      const id = result.children[0].properties['data-ast-id'];
      expect(id).not.toMatch(/^el-/); // Should not have default prefix
    });
  });
  
  describe('Tree structure handling', () => {
    it('should handle nested elements', () => {
      const plugin = rehypeAppendIds();
      const tree = {
        type: 'root',
        children: [
          {
            type: 'element',
            tagName: 'div',
            properties: {},
            children: [
              {
                type: 'element',
                tagName: 'span',
                properties: {},
                children: []
              }
            ]
          }
        ]
      };
      
      const result = plugin(tree);
      expect(result.children[0].properties['data-ast-id']).toBeDefined();
      expect(result.children[0].children[0].properties['data-ast-id']).toBeDefined();
      // IDs should be different
      expect(result.children[0].properties['data-ast-id'])
        .not.toBe(result.children[0].children[0].properties['data-ast-id']);
    });
    
    it('should handle sibling elements', () => {
      const plugin = rehypeAppendIds();
      const tree = {
        type: 'root',
        children: [
          {
            type: 'element',
            tagName: 'div',
            properties: {},
            children: []
          },
          {
            type: 'element',
            tagName: 'div',
            properties: {},
            children: []
          }
        ]
      };
      
      const result = plugin(tree);
      const id1 = result.children[0].properties['data-ast-id'];
      const id2 = result.children[1].properties['data-ast-id'];
      expect(id1).toBeDefined();
      expect(id2).toBeDefined();
      expect(id1).not.toBe(id2);
    });
    
    it('should handle mixed content types', () => {
      const plugin = rehypeAppendIds();
      const tree = {
        type: 'root',
        children: [
          { type: 'text', value: 'Text node' },
          {
            type: 'element',
            tagName: 'div',
            properties: {},
            children: []
          },
          { type: 'comment', value: 'Comment' }
        ]
      };
      
      const result = plugin(tree);
      // Only element should have ID
      expect(result.children[0].properties).toBeUndefined(); // text node
      expect(result.children[1].properties['data-ast-id']).toBeDefined();
      expect(result.children[2].properties).toBeUndefined(); // comment
    });
  });
  
  describe('Collision handling', () => {
    it('should ensure unique IDs for similar content', () => {
      const plugin = rehypeAppendIds({ strategy: 'slug' });
      const tree = {
        type: 'root',
        children: [
          {
            type: 'element',
            tagName: 'h2',
            properties: {},
            children: [{ type: 'text', value: 'Same Title' }]
          },
          {
            type: 'element',
            tagName: 'h2',
            properties: {},
            children: [{ type: 'text', value: 'Same Title' }]
          }
        ]
      };
      
      const result = plugin(tree);
      const id1 = result.children[0].properties['data-ast-id'];
      const id2 = result.children[1].properties['data-ast-id'];
      expect(id1).toBe('el-same-title');
      expect(id2).toBe('el-same-title-2');
    });
    
    it('should track existing IDs to avoid collisions', () => {
      const plugin = rehypeAppendIds({ strategy: 'path', prefix: '' });
      const tree = {
        type: 'root',
        children: [
          {
            type: 'element',
            tagName: 'div',
            properties: { 'data-ast-id': 'div' },
            children: []
          },
          {
            type: 'element',
            tagName: 'div',
            properties: {},
            children: []
          }
        ]
      };
      
      const result = plugin(tree);
      // First div keeps existing ID
      expect(result.children[0].properties['data-ast-id']).toBe('div');
      // Second div should get a different ID
      expect(result.children[1].properties['data-ast-id']).not.toBe('div');
    });
  });
  
  describe('Edge cases', () => {
    it('should handle empty tree', () => {
      const plugin = rehypeAppendIds();
      const tree = {
        type: 'root',
        children: []
      };
      
      const result = plugin(tree);
      expect(result.children).toHaveLength(0);
    });
    
    it('should handle elements without properties', () => {
      const plugin = rehypeAppendIds();
      const tree = {
        type: 'root',
        children: [
          {
            type: 'element',
            tagName: 'div',
            // No properties object
            children: []
          }
        ]
      };
      
      const result = plugin(tree);
      expect(result.children[0].properties).toBeDefined();
      expect(result.children[0].properties['data-ast-id']).toBeDefined();
    });
    
    it('should handle deeply nested structures', () => {
      const createNested = (depth) => {
        if (depth === 0) {
          return {
            type: 'element',
            tagName: 'span',
            properties: {},
            children: []
          };
        }
        return {
          type: 'element',
          tagName: 'div',
          properties: {},
          children: [createNested(depth - 1)]
        };
      };
      
      const plugin = rehypeAppendIds();
      const tree = {
        type: 'root',
        children: [createNested(5)]
      };
      
      const result = plugin(tree);
      // Check that deepest element has ID
      let current = result.children[0];
      for (let i = 0; i < 5; i++) {
        expect(current.properties['data-ast-id']).toBeDefined();
        if (current.children && current.children[0]) {
          current = current.children[0];
        }
      }
    });
  });
});