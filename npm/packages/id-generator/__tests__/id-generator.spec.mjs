import { generateId } from '../index.mjs';

describe('ID Generator Integration Tests', () => {
  describe('Real-world scenarios', () => {
    it('should handle complex HTML-like structure', () => {
      const usedIds = new Set();
      const nodes = [
        { tagName: 'div', children: [{ value: 'Header' }] },
        { tagName: 'nav', children: [{ value: 'Navigation' }] },
        { tagName: 'main', children: [
          { tagName: 'article', children: [{ value: 'Article 1' }] },
          { tagName: 'article', children: [{ value: 'Article 2' }] }
        ]},
        { tagName: 'footer', children: [{ value: 'Footer' }] }
      ];
      
      const ids = nodes.map((node, i) => 
        generateId(node, { strategy: 'slug', prefix: 'el-' }, [i], usedIds)
      );
      
      expect(ids[0]).toBe('el-header');
      expect(ids[1]).toBe('el-navigation');
      expect(ids[3]).toBe('el-footer');
      expect(new Set(ids).size).toBe(ids.length); // All unique
    });
    
    it('should handle collision scenarios gracefully', () => {
      const usedIds = new Set();
      const nodes = Array(5).fill({ tagName: 'div', children: [{ value: 'Same Content' }] });
      
      const ids = nodes.map((node, i) => 
        generateId(node, { strategy: 'slug' }, [i], usedIds)
      );
      
      expect(ids[0]).toBe('same-content');
      expect(ids[1]).toBe('same-content-2');
      expect(ids[2]).toBe('same-content-3');
      expect(ids[3]).toBe('same-content-4');
      expect(ids[4]).toBe('same-content-5');
    });
    
    it('should maintain determinism across runs', () => {
      const node = {
        tagName: 'section',
        position: { start: { line: 10, column: 5 }, end: { line: 15, column: 10 } },
        children: [{ value: 'Section Content' }]
      };
      
      const usedIds1 = new Set();
      const usedIds2 = new Set();
      
      const id1 = generateId(node, { strategy: 'hash' }, [2, 3, 4], usedIds1);
      const id2 = generateId(node, { strategy: 'hash' }, [2, 3, 4], usedIds2);
      
      expect(id1).toBe(id2);
    });
    
    it('should handle deeply nested structures', () => {
      const createNestedNode = (depth) => {
        if (depth === 0) {
          return { tagName: 'span', children: [{ value: `Level ${depth}` }] };
        }
        return {
          tagName: 'div',
          children: [
            { value: `Level ${depth}` },
            createNestedNode(depth - 1)
          ]
        };
      };
      
      const usedIds = new Set();
      const deepNode = createNestedNode(10);
      const path = Array(10).fill(0).map((_, i) => i);
      
      const id = generateId(deepNode, { strategy: 'path', prefix: 'deep-' }, path, usedIds);
      expect(id).toBe('deep-div-0-1-2-3-4-5-6-7-8-9');
    });
    
    it('should handle mixed content types', () => {
      const usedIds = new Set();
      const nodes = [
        { type: 'text', value: 'Plain text' },
        { tagName: 'img', attributes: { alt: 'Image' } },
        { name: 'custom-element' },
        { type: 'comment', value: 'Comment text' },
        {}  // Empty node
      ];
      
      const ids = nodes.map((node, i) => 
        generateId(node, { strategy: 'hash', prefix: 'mixed-' }, [i], usedIds)
      );
      
      // All should generate valid IDs
      ids.forEach(id => {
        expect(id).toMatch(/^mixed-[a-f0-9]{8}$/);
      });
      
      // All should be unique
      expect(new Set(ids).size).toBe(ids.length);
    });
    
    it('should handle unicode and special characters', () => {
      const usedIds = new Set();
      const nodes = [
        { children: [{ value: '日本語テキスト' }] },
        { children: [{ value: 'Émojis 😀 🎉 🚀' }] },
        { children: [{ value: 'Ñoño & Çédille' }] },
        { children: [{ value: '←→↑↓ Arrows' }] }
      ];
      
      const ids = nodes.map((node, i) => 
        generateId(node, { strategy: 'slug' }, [i], usedIds)
      );
      
      // Should sanitize to valid IDs
      ids.forEach(id => {
        expect(id).toMatch(/^[a-z0-9-]*$/);
      });
    });
    
    it('should handle format conversion in pipeline', () => {
      const usedIds = new Set();
      const node = { tagName: 'div' };
      const path = [1, 2, 3];
      
      // Generate with colon format (default)
      const colonId = generateId(node, { strategy: 'path' }, path, usedIds);
      expect(colonId).toContain('-'); // path separator
      
      // Generate with hyphen format
      const hyphenId = generateId(
        node, 
        { strategy: 'path', format: 'hyphen' }, 
        path, 
        new Set()
      );
      expect(hyphenId).not.toContain(':');
    });
    
    it('should handle performance with large sets', () => {
      const usedIds = new Set();
      const startTime = Date.now();
      
      // Generate 1000 IDs
      for (let i = 0; i < 1000; i++) {
        const node = { tagName: 'div', index: i };
        generateId(node, { strategy: 'hash' }, [i], usedIds);
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(usedIds.size).toBe(1000);
      expect(duration).toBeLessThan(1000); // Should complete in under 1 second
    });
    
    it('should handle strategy fallbacks', () => {
      const usedIds = new Set();
      
      // Slug with no content should fallback to hash
      const node1 = { tagName: 'div' };
      const id1 = generateId(node1, { strategy: 'slug', prefix: 'fb-' }, [], usedIds);
      expect(id1).toMatch(/^fb-[a-f0-9]{8}$/);
      
      // Path with missing properties still works
      const node2 = {};
      const id2 = generateId(node2, { strategy: 'path' }, [0], usedIds);
      expect(id2).toBe('node-0');
    });
    
    it('should maintain consistency with mixed strategies', () => {
      const usedIds = new Set();
      const node = { tagName: 'button', children: [{ value: 'Click Me' }] };
      
      // Generate IDs with different strategies
      const hashId = generateId(node, { strategy: 'hash' }, [0], new Set());
      const slugId = generateId(node, { strategy: 'slug' }, [0], new Set());
      const pathId = generateId(node, { strategy: 'path' }, [0], new Set());
      
      // Add them all to used set
      usedIds.add(hashId);
      usedIds.add(slugId);
      usedIds.add(pathId);
      
      // Try to generate with same content - should handle collisions
      const newSlugId = generateId(node, { strategy: 'slug' }, [0], usedIds);
      expect(newSlugId).toBe('click-me-2');
    });
  });
  
  describe('Error resilience', () => {
    it('should handle null and undefined gracefully', () => {
      const usedIds = new Set();
      
      const id1 = generateId(null, {}, [], usedIds);
      expect(id1).toMatch(/^[a-f0-9]{8}$/);
      
      const id2 = generateId(undefined, {}, [], usedIds);
      expect(id2).toMatch(/^[a-f0-9]{8}$/);
    });
    
    it('should handle circular references', () => {
      const usedIds = new Set();
      const node = { tagName: 'div' };
      node.self = node; // Circular reference
      
      // Should not throw
      expect(() => {
        generateId(node, { strategy: 'hash' }, [], usedIds);
      }).not.toThrow();
    });
    
    it('should handle missing options', () => {
      const node = { tagName: 'div' };
      
      const id1 = generateId(node);
      expect(id1).toMatch(/^[a-f0-9]{8}$/);
      
      const id2 = generateId(node, null);
      expect(id2).toMatch(/^[a-f0-9]{8}$/);
    });
  });
});