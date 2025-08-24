import { jest } from '@jest/globals';
import xastAppendIds from '../index.mjs';
import { fromXml } from 'xast-util-from-xml';
import { toXml } from 'xast-util-to-xml';

describe('xastAppendIds unit tests', () => {
  describe('configuration', () => {
    it('should export a function', () => {
      expect(typeof xastAppendIds).toBe('function');
    });

    it('should return a transformer function', () => {
      const plugin = xastAppendIds();
      expect(typeof plugin).toBe('function');
    });

    it('should accept options', () => {
      const options = {
        selector: 'element',
        attr: 'custom-id',
        strategy: 'slug',
        prefix: 'test-',
        overwrite: true
      };
      const plugin = xastAppendIds(options);
      expect(typeof plugin).toBe('function');
    });
  });

  describe('ID generation strategies', () => {
    it('should generate hash-based IDs by default', () => {
      const xml = '<root><item>Test</item></root>';
      const tree = fromXml(xml);
      const plugin = xastAppendIds();
      const result = plugin(tree);
      
      const rootEl = result.children[0]; // <root> element
      const itemEl = rootEl.children[0]; // <item> element
      expect(itemEl.attributes).toBeDefined();
      expect(itemEl.attributes['data-ast-id']).toBeDefined();
      expect(itemEl.attributes['data-ast-id']).toMatch(/^el-[a-f0-9]{8}$/);
    });

    it('should generate slug-based IDs', () => {
      const xml = '<root><item>Hello World</item></root>';
      const tree = fromXml(xml);
      const plugin = xastAppendIds({ strategy: 'slug', selector: 'item' });
      const result = plugin(tree);
      
      const rootEl = result.children[0];
      const itemEl = rootEl.children[0];
      expect(itemEl.attributes['data-ast-id']).toMatch(/^el-hello-world$/);
    });

    it('should generate path-based IDs', () => {
      const xml = '<root><item>Test</item><item>Test2</item></root>';
      const tree = fromXml(xml);
      const plugin = xastAppendIds({ strategy: 'path' });
      const result = plugin(tree);
      
      const rootEl = result.children[0];
      expect(rootEl.children[0].attributes['data-ast-id']).toMatch(/^el-item/);
      expect(rootEl.children[1].attributes['data-ast-id']).toMatch(/^el-item/);
      // IDs should be different
      const id1 = rootEl.children[0].attributes['data-ast-id'];
      const id2 = rootEl.children[1].attributes['data-ast-id'];
      expect(id1).not.toBe(id2);
    });
  });

  describe('attribute handling', () => {
    it('should use custom attribute name', () => {
      const xml = '<root><item>Test</item></root>';
      const tree = fromXml(xml);
      const plugin = xastAppendIds({ attr: 'custom-id' });
      const result = plugin(tree);
      
      const rootEl = result.children[0];
      const itemEl = rootEl.children[0];
      expect(itemEl.attributes['custom-id']).toBeDefined();
    });

    it('should not overwrite existing IDs by default', () => {
      const xml = '<root><item data-ast-id="existing">Test</item></root>';
      const tree = fromXml(xml);
      const plugin = xastAppendIds();
      const result = plugin(tree);
      
      const rootEl = result.children[0];
      const itemEl = rootEl.children[0];
      expect(itemEl.attributes['data-ast-id']).toBe('existing');
    });

    it('should overwrite existing IDs when overwrite is true', () => {
      const xml = '<root><item data-ast-id="existing">Test</item></root>';
      const tree = fromXml(xml);
      const plugin = xastAppendIds({ overwrite: true });
      const result = plugin(tree);
      
      const rootEl = result.children[0];
      const itemEl = rootEl.children[0];
      expect(itemEl.attributes['data-ast-id']).toBeDefined();
      expect(itemEl.attributes['data-ast-id']).not.toBe('existing');
    });
  });

  describe('namespace support', () => {
    it('should support namespaced attributes', () => {
      const xml = '<root xmlns:custom="http://example.com"><item>Test</item></root>';
      const tree = fromXml(xml);
      const plugin = xastAppendIds({ 
        attr: 'custom:id',
        namespace: 'custom'
      });
      const result = plugin(tree);
      
      const rootEl = result.children[0];
      const itemEl = rootEl.children[0];
      expect(itemEl.attributes['custom:id']).toBeDefined();
    });
  });

  describe('selector support', () => {
    it('should only process elements matching selector', () => {
      const xml = '<root><item class="target">Test</item><item>Skip</item></root>';
      const tree = fromXml(xml);
      const plugin = xastAppendIds({ selector: '[class="target"]' });
      const result = plugin(tree);
      
      const rootEl = result.children[0];
      const firstItem = rootEl.children[0];
      const secondItem = rootEl.children[1];
      
      expect(firstItem.attributes['data-ast-id']).toBeDefined();
      expect(secondItem?.attributes?.['data-ast-id']).toBeUndefined();
    });
  });

  describe('uniqueness', () => {
    it('should ensure unique IDs', () => {
      const xml = '<root><item>Same</item><item>Same</item><item>Same</item></root>';
      const tree = fromXml(xml);
      const plugin = xastAppendIds({ strategy: 'slug' });
      const result = plugin(tree);
      
      const rootEl = result.children[0];
      const ids = rootEl.children.map(child => 
        child.attributes['data-ast-id']
      ).filter(Boolean);
      
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });
  });
});