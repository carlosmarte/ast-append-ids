import { jest } from '@jest/globals';
import xastAppendIds from '../index.mjs';
import { fromXml } from 'xast-util-from-xml';
import { toXml } from 'xast-util-to-xml';
import { unified } from 'unified';

describe('xastAppendIds integration tests', () => {
  describe('unified pipeline integration', () => {
    it('should work in a unified pipeline', async () => {
      const processor = unified()
        .use(xastAppendIds);
      
      const tree = fromXml('<root><item>Test</item></root>');
      const result = await processor.run(tree);
      expect(result).toBeDefined();
      expect(result.type).toBe('root');
      
      // Check that IDs were added
      const rootEl = result.children[0];
      expect(rootEl.attributes?.['data-ast-id']).toBeDefined();
      
      const item = rootEl.children[0];
      expect(item.attributes?.['data-ast-id']).toBeDefined();
    });
  });

  describe('complex XML structures', () => {
    it('should handle deeply nested elements', () => {
      const xml = `
        <root>
          <level1>
            <level2>
              <level3>
                <item>Deep content</item>
              </level3>
            </level2>
          </level1>
        </root>
      `;
      const tree = fromXml(xml);
      const plugin = xastAppendIds();
      const result = plugin(tree);
      
      // Find the deep item element
      const rootEl = result.children[0];
      const level1 = rootEl.children.find(c => c.name === 'level1');
      const level2 = level1.children.find(c => c.name === 'level2');
      const level3 = level2.children.find(c => c.name === 'level3');
      const item = level3.children.find(c => c.name === 'item');
      
      const idAttr = item.attributes?.['data-ast-id'];
      expect(idAttr).toBeDefined();
      expect(idAttr).toMatch(/^el-/);
    });

    it('should handle mixed content', () => {
      const xml = `
        <root>
          Text before
          <item>Element content</item>
          Text after
          <item>Another element</item>
        </root>
      `;
      const tree = fromXml(xml);
      const plugin = xastAppendIds();
      const result = plugin(tree);
      
      const rootEl = result.children[0];
      const elements = rootEl.children.filter(c => c.type === 'element');
      expect(elements.length).toBe(2);
      
      elements.forEach(element => {
        const idAttr = element.attributes?.['data-ast-id'];
        expect(idAttr).toBeDefined();
      });
    });

    it('should handle elements with existing attributes', () => {
      const xml = `
        <root>
          <item class="existing" data-value="123">Content</item>
          <item id="already-has-id">Other content</item>
        </root>
      `;
      const tree = fromXml(xml);
      const plugin = xastAppendIds();
      const result = plugin(tree);
      
      const rootEl = result.children[0];
      const firstItem = rootEl.children.find(c => c.name === 'item');
      expect(Object.keys(firstItem.attributes).length).toBeGreaterThan(2);
      
      const idAttr = firstItem.attributes['data-ast-id'];
      expect(idAttr).toBeDefined();
      
      // Original attributes should be preserved
      const classAttr = firstItem.attributes['class'];
      expect(classAttr).toBe('existing');
    });
  });

  describe('real-world XML examples', () => {
    it('should handle SVG-like structures', () => {
      const xml = `
        <svg xmlns="http://www.w3.org/2000/svg">
          <g>
            <rect x="10" y="10" width="100" height="100"/>
            <circle cx="50" cy="50" r="40"/>
          </g>
          <text x="10" y="130">SVG Text</text>
        </svg>
      `;
      const tree = fromXml(xml);
      const plugin = xastAppendIds({ prefix: 'svg-' });
      const result = plugin(tree);
      
      // Check that all elements got IDs
      const collectElements = (node, elements = []) => {
        if (node.type === 'element') {
          elements.push(node);
          if (node.children) {
            node.children.forEach(child => collectElements(child, elements));
          }
        }
        return elements;
      };
      
      const allElements = collectElements(result);
      allElements.forEach(element => {
        const idAttr = element.attributes?.['data-ast-id'];
        expect(idAttr).toBeDefined();
        expect(idAttr).toMatch(/^svg-/);
      });
    });

    it('should handle RSS-like structures', () => {
      const xml = `
        <rss version="2.0">
          <channel>
            <title>Feed Title</title>
            <item>
              <title>Item 1</title>
              <description>Description 1</description>
            </item>
            <item>
              <title>Item 2</title>
              <description>Description 2</description>
            </item>
          </channel>
        </rss>
      `;
      const tree = fromXml(xml);
      const plugin = xastAppendIds({ 
        strategy: 'slug',
        selector: 'item'
      });
      const result = plugin(tree);
      
      // Only items should have IDs
      const rootEl = result.children[0];
      const channel = rootEl.children.find(c => c.name === 'channel');
      const items = channel.children.filter(c => c.name === 'item');
      
      items.forEach(item => {
        const idAttr = item.attributes?.['data-ast-id'];
        expect(idAttr).toBeDefined();
      });
      
      // Channel itself should not have ID
      const channelIdAttr = channel.attributes?.['data-ast-id'];
      expect(channelIdAttr).toBeUndefined();
    });
  });

  describe('edge cases', () => {
    it('should handle empty elements', () => {
      const xml = '<root><empty/></root>';
      const tree = fromXml(xml);
      const plugin = xastAppendIds();
      const result = plugin(tree);
      
      const rootEl = result.children[0];
      const empty = rootEl.children.find(c => c.name === 'empty');
      const idAttr = empty.attributes?.['data-ast-id'];
      expect(idAttr).toBeDefined();
    });

    it('should handle elements with only whitespace', () => {
      const xml = '<root><item>   </item></root>';
      const tree = fromXml(xml);
      const plugin = xastAppendIds({ strategy: 'slug' });
      const result = plugin(tree);
      
      const rootEl = result.children[0];
      const item = rootEl.children.find(c => c.name === 'item');
      const idAttr = item.attributes?.['data-ast-id'];
      expect(idAttr).toBeDefined();
      // Should fallback to hash when no text content
      expect(idAttr).toMatch(/^el-/);
    });

    it('should handle very long text content for slug strategy', () => {
      const longText = 'a'.repeat(100);
      const xml = `<root><item>${longText}</item></root>`;
      const tree = fromXml(xml);
      const plugin = xastAppendIds({ strategy: 'slug' });
      const result = plugin(tree);
      
      const rootEl = result.children[0];
      const item = rootEl.children.find(c => c.name === 'item');
      const idAttr = item.attributes?.['data-ast-id'];
      expect(idAttr).toBeDefined();
      // Should be truncated
      expect(idAttr.length).toBeLessThan(60);
    });

    it('should handle special characters in content', () => {
      const xml = '<root><item>Test &amp; Special <![CDATA[characters]]></item></root>';
      const tree = fromXml(xml);
      const plugin = xastAppendIds({ strategy: 'slug' });
      const result = plugin(tree);
      
      const rootEl = result.children[0];
      const item = rootEl.children.find(c => c.name === 'item');
      const idAttr = item.attributes?.['data-ast-id'];
      expect(idAttr).toBeDefined();
      expect(idAttr).toMatch(/^el-test-special/);
    });
  });

  describe('performance', () => {
    it('should handle large documents efficiently', () => {
      // Generate a large XML document
      const items = Array.from({ length: 1000 }, (_, i) => 
        `<item index="${i}">Content ${i}</item>`
      ).join('');
      const xml = `<root>${items}</root>`;
      
      const tree = fromXml(xml);
      const startTime = Date.now();
      const plugin = xastAppendIds();
      const result = plugin(tree);
      const endTime = Date.now();
      
      // Should complete within reasonable time (< 1 second)
      expect(endTime - startTime).toBeLessThan(1000);
      
      // All items should have unique IDs
      const rootEl = result.children[0];
      const elements = rootEl.children.filter(c => c.type === 'element');
      const ids = elements.map(el => 
        el.attributes?.['data-ast-id']
      ).filter(Boolean);
      
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });
  });
});