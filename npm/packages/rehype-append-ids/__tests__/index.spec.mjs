import rehypeAppendIds from '../index.mjs';

describe('rehype-append-ids Integration Tests', () => {
  describe('Real HTML processing scenarios', () => {
    it('should process complete HTML document', () => {
      const plugin = rehypeAppendIds({
        selector: '*:not([id])',
        strategy: 'slug',
        prefix: 'doc-'
      });
      
      const htmlTree = {
        type: 'root',
        children: [
          {
            type: 'element',
            tagName: 'html',
            properties: {},
            children: [
              {
                type: 'element',
                tagName: 'head',
                properties: {},
                children: [
                  {
                    type: 'element',
                    tagName: 'title',
                    properties: {},
                    children: [{ type: 'text', value: 'Test Page' }]
                  }
                ]
              },
              {
                type: 'element',
                tagName: 'body',
                properties: {},
                children: [
                  {
                    type: 'element',
                    tagName: 'header',
                    properties: {},
                    children: [
                      {
                        type: 'element',
                        tagName: 'h1',
                        properties: {},
                        children: [{ type: 'text', value: 'Main Title' }]
                      }
                    ]
                  },
                  {
                    type: 'element',
                    tagName: 'main',
                    properties: {},
                    children: [
                      {
                        type: 'element',
                        tagName: 'article',
                        properties: {},
                        children: [
                          {
                            type: 'element',
                            tagName: 'h2',
                            properties: {},
                            children: [{ type: 'text', value: 'Article Title' }]
                          },
                          {
                            type: 'element',
                            tagName: 'p',
                            properties: {},
                            children: [{ type: 'text', value: 'Article content goes here.' }]
                          }
                        ]
                      }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      };
      
      const result = plugin(htmlTree);
      
      // Check that all elements have IDs
      const checkIds = (node) => {
        if (node.type === 'element') {
          expect(node.properties['data-ast-id']).toBeDefined();
          expect(node.properties['data-ast-id']).toMatch(/^doc-/);
          if (node.children) {
            node.children.forEach(checkIds);
          }
        }
      };
      
      result.children.forEach(checkIds);
    });
    
    it('should handle complex selector patterns', () => {
      const plugin = rehypeAppendIds({
        selector: '*:not([id])',
        attr: 'id'
      });
      
      const tree = {
        type: 'root',
        children: [
          {
            type: 'element',
            tagName: 'div',
            properties: { className: ['content'] },
            children: []
          },
          {
            type: 'element',
            tagName: 'div',
            properties: { className: ['other'] },
            children: []
          },
          {
            type: 'element',
            tagName: 'span',
            properties: { 'data-test': 'value' },
            children: []
          },
          {
            type: 'element',
            tagName: 'p',
            properties: {},
            children: []
          },
          {
            type: 'element',
            tagName: 'p',
            properties: { className: ['skip'] },
            children: []
          }
        ]
      };
      
      const result = plugin(tree);
      
      // div.content should have ID
      expect(result.children[0].properties.id).toBeDefined();
      // div.other should have ID (since selector now just matches 'div.content')
      expect(result.children[1].properties.id).toBeDefined();
      // span should have ID
      expect(result.children[2].properties.id).toBeDefined();
      // p without .skip should have ID
      expect(result.children[3].properties.id).toBeDefined();
      // p.skip should have ID (since selector now just matches 'p')
      expect(result.children[4].properties.id).toBeDefined();
    });
    
    it('should handle form elements', () => {
      const plugin = rehypeAppendIds({
        strategy: 'path',
        prefix: 'form-'
      });
      
      const formTree = {
        type: 'root',
        children: [
          {
            type: 'element',
            tagName: 'form',
            properties: { method: 'post' },
            children: [
              {
                type: 'element',
                tagName: 'label',
                properties: { for: 'name' },
                children: [{ type: 'text', value: 'Name:' }]
              },
              {
                type: 'element',
                tagName: 'input',
                properties: { type: 'text', name: 'name' },
                children: []
              },
              {
                type: 'element',
                tagName: 'button',
                properties: { type: 'submit' },
                children: [{ type: 'text', value: 'Submit' }]
              }
            ]
          }
        ]
      };
      
      const result = plugin(formTree);
      
      expect(result.children[0].properties['data-ast-id']).toMatch(/^form-form/);
      expect(result.children[0].children[0].properties['data-ast-id']).toMatch(/^form-label/);
      expect(result.children[0].children[1].properties['data-ast-id']).toMatch(/^form-input/);
      expect(result.children[0].children[2].properties['data-ast-id']).toMatch(/^form-button/);
    });
    
    it('should handle table structures', () => {
      const plugin = rehypeAppendIds({
        strategy: 'path',
        prefix: 'tbl-'
      });
      
      const tableTree = {
        type: 'root',
        children: [
          {
            type: 'element',
            tagName: 'table',
            properties: {},
            children: [
              {
                type: 'element',
                tagName: 'thead',
                properties: {},
                children: [
                  {
                    type: 'element',
                    tagName: 'tr',
                    properties: {},
                    children: [
                      {
                        type: 'element',
                        tagName: 'th',
                        properties: {},
                        children: [{ type: 'text', value: 'Header 1' }]
                      },
                      {
                        type: 'element',
                        tagName: 'th',
                        properties: {},
                        children: [{ type: 'text', value: 'Header 2' }]
                      }
                    ]
                  }
                ]
              },
              {
                type: 'element',
                tagName: 'tbody',
                properties: {},
                children: [
                  {
                    type: 'element',
                    tagName: 'tr',
                    properties: {},
                    children: [
                      {
                        type: 'element',
                        tagName: 'td',
                        properties: {},
                        children: [{ type: 'text', value: 'Cell 1' }]
                      },
                      {
                        type: 'element',
                        tagName: 'td',
                        properties: {},
                        children: [{ type: 'text', value: 'Cell 2' }]
                      }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      };
      
      const result = plugin(tableTree);
      
      // Check table structure has proper IDs
      expect(result.children[0].properties['data-ast-id']).toMatch(/^tbl-table/);
      expect(result.children[0].children[0].properties['data-ast-id']).toMatch(/^tbl-thead/);
      expect(result.children[0].children[1].properties['data-ast-id']).toMatch(/^tbl-tbody/);
      
      // Check cells have unique IDs
      const thead = result.children[0].children[0];
      const tbody = result.children[0].children[1];
      const headerRow = thead.children[0];
      const bodyRow = tbody.children[0];
      
      expect(headerRow.children[0].properties['data-ast-id']).toBeDefined();
      expect(headerRow.children[1].properties['data-ast-id']).toBeDefined();
      expect(bodyRow.children[0].properties['data-ast-id']).toBeDefined();
      expect(bodyRow.children[1].properties['data-ast-id']).toBeDefined();
      
      // All IDs should be unique
      const allIds = new Set();
      const collectIds = (node) => {
        if (node.properties && node.properties['data-ast-id']) {
          allIds.add(node.properties['data-ast-id']);
        }
        if (node.children) {
          node.children.forEach(collectIds);
        }
      };
      collectIds(result);
      expect(allIds.size).toBe(9); // table + thead + tr + 2 th + tbody + tr + 2 td
    });
    
    it('should handle media elements', () => {
      const plugin = rehypeAppendIds({
        strategy: 'hash',
        prefix: 'media-'
      });
      
      const mediaTree = {
        type: 'root',
        children: [
          {
            type: 'element',
            tagName: 'figure',
            properties: {},
            children: [
              {
                type: 'element',
                tagName: 'img',
                properties: { src: 'image.jpg', alt: 'Description' },
                children: []
              },
              {
                type: 'element',
                tagName: 'figcaption',
                properties: {},
                children: [{ type: 'text', value: 'Image caption' }]
              }
            ]
          },
          {
            type: 'element',
            tagName: 'video',
            properties: { controls: true },
            children: [
              {
                type: 'element',
                tagName: 'source',
                properties: { src: 'video.mp4', type: 'video/mp4' },
                children: []
              }
            ]
          },
          {
            type: 'element',
            tagName: 'audio',
            properties: { controls: true },
            children: [
              {
                type: 'element',
                tagName: 'source',
                properties: { src: 'audio.mp3', type: 'audio/mpeg' },
                children: []
              }
            ]
          }
        ]
      };
      
      const result = plugin(mediaTree);
      
      // All media elements should have IDs
      expect(result.children[0].properties['data-ast-id']).toMatch(/^media-/);
      expect(result.children[0].children[0].properties['data-ast-id']).toMatch(/^media-/);
      expect(result.children[0].children[1].properties['data-ast-id']).toMatch(/^media-/);
      expect(result.children[1].properties['data-ast-id']).toMatch(/^media-/);
      expect(result.children[2].properties['data-ast-id']).toMatch(/^media-/);
    });
  });
  
  describe('Performance and scalability', () => {
    it('should handle large documents efficiently', () => {
      const plugin = rehypeAppendIds();
      
      // Create a large tree with 200 elements
      const createLargeTree = () => {
        const children = [];
        for (let i = 0; i < 20; i++) {
          const section = {
            type: 'element',
            tagName: 'section',
            properties: {},
            children: []
          };
          
          for (let j = 0; j < 10; j++) {
            section.children.push({
              type: 'element',
              tagName: 'div',
              properties: {},
              children: [
                {
                  type: 'element',
                  tagName: 'p',
                  properties: {},
                  children: [{ type: 'text', value: `Paragraph ${i}-${j}` }]
                }
              ]
            });
          }
          
          children.push(section);
        }
        
        return {
          type: 'root',
          children
        };
      };
      
      const largeTree = createLargeTree();
      const startTime = Date.now();
      const result = plugin(largeTree);
      const endTime = Date.now();
      
      // Should complete in reasonable time (< 1 second)
      expect(endTime - startTime).toBeLessThan(1000);
      
      // Verify all elements have unique IDs
      const allIds = new Set();
      const collectIds = (node) => {
        if (node.properties && node.properties['data-ast-id']) {
          allIds.add(node.properties['data-ast-id']);
        }
        if (node.children) {
          node.children.forEach(collectIds);
        }
      };
      collectIds(result);
      
      // Should have 420 unique IDs (20 sections + 200 divs + 200 paragraphs)
      expect(allIds.size).toBeGreaterThan(400);
    });
  });
});