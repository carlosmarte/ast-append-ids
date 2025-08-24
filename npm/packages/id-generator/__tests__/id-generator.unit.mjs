import {
  generateId,
  generateHashId,
  generateSlugId,
  generatePathId,
  ensureUniqueId,
  convertIdFormat,
  extractTextContent
} from '../index.mjs';

describe('ID Generator Unit Tests', () => {
  describe('generateHashId', () => {
    it('should generate deterministic hash for same input', () => {
      const node = { type: 'div', position: { start: 1, end: 10 } };
      const path = [0, 1, 2];
      const prefix = 'test-';
      
      const id1 = generateHashId(node, path, prefix);
      const id2 = generateHashId(node, path, prefix);
      
      expect(id1).toBe(id2);
      expect(id1).toMatch(/^test-[a-f0-9]{8}$/);
    });
    
    it('should generate different hashes for different paths', () => {
      const node = { type: 'div' };
      const path1 = [0, 1];
      const path2 = [0, 2];
      
      const id1 = generateHashId(node, path1);
      const id2 = generateHashId(node, path2);
      
      expect(id1).not.toBe(id2);
    });
    
    it('should handle nodes with tagName instead of type', () => {
      const node = { tagName: 'span' };
      const path = [1];
      
      const id = generateHashId(node, path, 'el-');
      expect(id).toMatch(/^el-[a-f0-9]{8}$/);
    });
    
    it('should handle empty prefix', () => {
      const node = { type: 'div' };
      const path = [];
      
      const id = generateHashId(node, path);
      expect(id).toMatch(/^[a-f0-9]{8}$/);
    });
  });
  
  describe('generateSlugId', () => {
    it('should generate slug from text content', () => {
      const node = { 
        children: [{ value: 'Hello World' }]
      };
      
      const id = generateSlugId(node, 'slug-');
      expect(id).toBe('slug-hello-world');
    });
    
    it('should sanitize special characters', () => {
      const node = { 
        children: [{ value: 'Hello! @World# $Test%' }]
      };
      
      const id = generateSlugId(node);
      expect(id).toBe('hello-world-test');
    });
    
    it('should handle multiple spaces', () => {
      const node = { 
        children: [{ value: 'Hello    World' }]
      };
      
      const id = generateSlugId(node);
      expect(id).toBe('hello-world');
    });
    
    it('should truncate long text to 50 characters', () => {
      const longText = 'a'.repeat(60);
      const node = { 
        children: [{ value: longText }]
      };
      
      const id = generateSlugId(node);
      expect(id.length).toBeLessThanOrEqual(50);
    });
    
    it('should fallback to hash when no text content', () => {
      const node = { type: 'div' };
      
      const id = generateSlugId(node, 'empty-');
      expect(id).toMatch(/^empty-[a-f0-9]{8}$/);
    });
    
    it('should handle nested children', () => {
      const node = {
        children: [
          { value: 'Hello' },
          { children: [{ value: ' ' }] },
          { value: 'World' }
        ]
      };
      
      const id = generateSlugId(node);
      expect(id).toBe('hello-world');
    });
  });
  
  describe('generatePathId', () => {
    it('should generate path-based ID', () => {
      const node = { tagName: 'div' };
      const path = [0, 2, 1];
      
      const id = generatePathId(node, path, 'path-');
      expect(id).toBe('path-div-0-2-1');
    });
    
    it('should handle empty path', () => {
      const node = { tagName: 'span' };
      const path = [];
      
      const id = generatePathId(node, path, 'root-');
      expect(id).toBe('root-span');
    });
    
    it('should use type when tagName not available', () => {
      const node = { type: 'element' };
      const path = [1];
      
      const id = generatePathId(node, path);
      expect(id).toBe('element-1');
    });
    
    it('should use name when available', () => {
      const node = { name: 'custom' };
      const path = [2, 3];
      
      const id = generatePathId(node, path);
      expect(id).toBe('custom-2-3');
    });
    
    it('should fallback to "node" when no identifying property', () => {
      const node = {};
      const path = [0];
      
      const id = generatePathId(node, path);
      expect(id).toBe('node-0');
    });
  });
  
  describe('ensureUniqueId', () => {
    it('should return original ID when unique', () => {
      const usedIds = new Set();
      const id = 'unique-id';
      
      const result = ensureUniqueId(id, usedIds);
      expect(result).toBe(id);
      expect(usedIds.has(id)).toBe(true);
    });
    
    it('should append counter when ID exists', () => {
      const usedIds = new Set(['test-id']);
      
      const result = ensureUniqueId('test-id', usedIds);
      expect(result).toBe('test-id-2');
      expect(usedIds.has('test-id-2')).toBe(true);
    });
    
    it('should increment counter for multiple collisions', () => {
      const usedIds = new Set(['test-id', 'test-id-2', 'test-id-3']);
      
      const result = ensureUniqueId('test-id', usedIds);
      expect(result).toBe('test-id-4');
    });
    
    it('should handle complex ID patterns', () => {
      const usedIds = new Set(['div-0-1-2']);
      
      const result = ensureUniqueId('div-0-1-2', usedIds);
      expect(result).toBe('div-0-1-2-2');
    });
  });
  
  describe('convertIdFormat', () => {
    it('should convert colon to hyphen format', () => {
      const id = '1:2:3:4';
      const result = convertIdFormat(id, 'hyphen');
      expect(result).toBe('1-2-3-4');
    });
    
    it('should convert hyphen to colon format', () => {
      const id = '1-2-3-4';
      const result = convertIdFormat(id, 'colon');
      expect(result).toBe('1:2:3:4');
    });
    
    it('should handle mixed format', () => {
      const id = 'prefix-1:2:3';
      const result = convertIdFormat(id, 'hyphen');
      expect(result).toBe('prefix-1-2-3');
    });
    
    it('should return unchanged for same format', () => {
      const id = '1:2:3';
      const result = convertIdFormat(id, 'colon');
      expect(result).toBe('1:2:3');
    });
    
    it('should handle empty string', () => {
      const result = convertIdFormat('', 'hyphen');
      expect(result).toBe('');
    });
  });
  
  describe('extractTextContent', () => {
    it('should extract direct string value', () => {
      const result = extractTextContent('Hello');
      expect(result).toBe('Hello');
    });
    
    it('should extract value property', () => {
      const node = { value: 'Text content' };
      const result = extractTextContent(node);
      expect(result).toBe('Text content');
    });
    
    it('should extract from children', () => {
      const node = {
        children: [
          { value: 'Hello' },
          { value: ' ' },
          { value: 'World' }
        ]
      };
      const result = extractTextContent(node);
      expect(result).toBe('Hello World');
    });
    
    it('should handle nested children', () => {
      const node = {
        children: [
          { value: 'Start' },
          {
            children: [
              { value: ' Middle' },
              { children: [{ value: ' Deep' }] }
            ]
          },
          { value: ' End' }
        ]
      };
      const result = extractTextContent(node);
      expect(result).toBe('Start Middle Deep End');
    });
    
    it('should return empty string for no content', () => {
      const node = {};
      const result = extractTextContent(node);
      expect(result).toBe('');
    });
    
    it('should filter out falsy values', () => {
      const node = {
        children: [
          { value: 'Text' },
          { value: null },
          { value: undefined },
          { value: '' },
          { value: 'More' }
        ]
      };
      const result = extractTextContent(node);
      expect(result).toBe('Text More');
    });
  });
  
  describe('generateId (main function)', () => {
    it('should use hash strategy by default', () => {
      const node = { type: 'div' };
      const usedIds = new Set();
      
      const id = generateId(node, {}, [0], usedIds);
      expect(id).toMatch(/^[a-f0-9]{8}$/);
    });
    
    it('should use slug strategy when specified', () => {
      const node = { children: [{ value: 'Test Content' }] };
      const usedIds = new Set();
      
      const id = generateId(node, { strategy: 'slug' }, [], usedIds);
      expect(id).toBe('test-content');
    });
    
    it('should use path strategy when specified', () => {
      const node = { tagName: 'span' };
      const usedIds = new Set();
      
      const id = generateId(node, { strategy: 'path' }, [1, 2], usedIds);
      expect(id).toBe('span-1-2');
    });
    
    it('should apply prefix', () => {
      const node = { type: 'div' };
      const usedIds = new Set();
      
      const id = generateId(node, { prefix: 'custom-' }, [], usedIds);
      expect(id).toMatch(/^custom-[a-f0-9]{8}$/);
    });
    
    it('should ensure uniqueness', () => {
      const node = { tagName: 'div' };
      const usedIds = new Set(['div']);
      
      const id = generateId(node, { strategy: 'path' }, [], usedIds);
      expect(id).toBe('div-2');
      expect(usedIds.has('div-2')).toBe(true);
    });
    
    it('should apply format conversion', () => {
      const node = { type: 'div' };
      const usedIds = new Set();
      
      const id = generateId(node, { format: 'hyphen' }, [1, 2, 3], usedIds);
      expect(id).not.toContain(':');
    });
    
    it('should handle all options together', () => {
      const node = { children: [{ value: 'Test:Content' }] };
      const usedIds = new Set(['pre-test-content']);
      
      const id = generateId(
        node, 
        { 
          strategy: 'slug',
          prefix: 'pre-',
          format: 'hyphen'
        },
        [],
        usedIds
      );
      
      expect(id).toBe('pre-testcontent');
    });
  });
});