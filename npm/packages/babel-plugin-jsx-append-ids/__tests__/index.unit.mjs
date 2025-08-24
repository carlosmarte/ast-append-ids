import { jest } from '@jest/globals';
import babelPluginJsxAppendIds from '../index.mjs';
import * as babel from '@babel/core';

describe('babelPluginJsxAppendIds unit tests', () => {
  const transform = (code, options = {}) => {
    return babel.transform(code, {
      plugins: [[babelPluginJsxAppendIds, options]],
      parserOpts: {
        plugins: ['jsx']
      }
    });
  };

  describe('configuration', () => {
    it('should export a function', () => {
      expect(typeof babelPluginJsxAppendIds).toBe('function');
    });

    it('should return a babel plugin object', () => {
      const plugin = babelPluginJsxAppendIds(babel);
      expect(plugin).toHaveProperty('name');
      expect(plugin).toHaveProperty('visitor');
      expect(plugin.name).toBe('babel-plugin-jsx-append-ids');
    });

    it('should accept configuration options', () => {
      const code = '<div>Hello</div>';
      const result = transform(code, {
        attr: 'custom-id',
        strategy: 'slug',
        prefix: 'test-'
      });
      expect(result.code).toContain('custom-id');
    });
  });

  describe('ID generation strategies', () => {
    it('should generate hash-based IDs by default', () => {
      const code = '<div>Hello World</div>';
      const result = transform(code);
      expect(result.code).toMatch(/data-ast-id="el-[a-f0-9]{8}"/);
    });

    it('should generate slug-based IDs', () => {
      const code = '<div>Hello World</div>';
      const result = transform(code, { strategy: 'slug' });
      expect(result.code).toContain('data-ast-id="el-hello-world"');
    });

    it('should generate path-based IDs', () => {
      const code = '<div><span>First</span><span>Second</span></div>';
      const result = transform(code, { strategy: 'path' });
      expect(result.code).toMatch(/data-ast-id="el-div/);
      expect(result.code).toMatch(/data-ast-id="el-span/);
    });
  });

  describe('element targeting', () => {
    it('should only process host elements', () => {
      const code = `
        <>
          <div>Host element</div>
          <CustomComponent>Component</CustomComponent>
        </>
      `;
      const result = transform(code);
      expect(result.code).toContain('<div data-ast-id=');
      expect(result.code).not.toContain('<CustomComponent data-ast-id=');
    });

    it('should respect include list', () => {
      const code = `
        <>
          <div>Include</div>
          <span>Exclude</span>
        </>
      `;
      const result = transform(code, { include: ['div'] });
      expect(result.code).toContain('<div data-ast-id=');
      expect(result.code).not.toContain('<span data-ast-id=');
    });

    it('should respect exclude list', () => {
      const code = `
        <>
          <div>Include</div>
          <span>Exclude</span>
        </>
      `;
      const result = transform(code, { exclude: ['span'] });
      expect(result.code).toContain('<div data-ast-id=');
      expect(result.code).not.toContain('<span data-ast-id=');
    });
  });

  describe('attribute handling', () => {
    it('should use custom attribute name', () => {
      const code = '<div>Test</div>';
      const result = transform(code, { attr: 'custom-id' });
      expect(result.code).toContain('custom-id=');
      expect(result.code).not.toContain('data-ast-id=');
    });

    it('should not overwrite existing IDs by default', () => {
      const code = '<div data-ast-id="existing">Test</div>';
      const result = transform(code);
      expect(result.code).toContain('data-ast-id="existing"');
    });

    it('should overwrite existing IDs when overwrite is true', () => {
      const code = '<div data-ast-id="existing">Test</div>';
      const result = transform(code, { overwrite: true });
      expect(result.code).not.toContain('data-ast-id="existing"');
      expect(result.code).toMatch(/data-ast-id="el-[a-f0-9]{8}"/);
    });

    it('should preserve other attributes', () => {
      const code = '<div className="test" onClick={handler}>Test</div>';
      const result = transform(code);
      expect(result.code).toContain('className="test"');
      expect(result.code).toContain('onClick={handler}');
      expect(result.code).toContain('data-ast-id=');
    });
  });

  describe('JSX expressions', () => {
    it('should handle JSX expressions in attributes', () => {
      const code = '<div className={styles.container}>Test</div>';
      const result = transform(code);
      expect(result.code).toContain('className={styles.container}');
      expect(result.code).toContain('data-ast-id=');
    });

    it('should handle spread attributes', () => {
      const code = '<div {...props}>Test</div>';
      const result = transform(code);
      expect(result.code).toContain('{...props}');
      expect(result.code).toContain('data-ast-id=');
    });

    it('should handle JSX text with expressions', () => {
      const code = '<div>Hello {name}</div>';
      const result = transform(code, { strategy: 'slug' });
      expect(result.code).toContain('data-ast-id="el-hello"');
    });
  });

  describe('nested elements', () => {
    it('should handle deeply nested JSX', () => {
      const code = `
        <div>
          <section>
            <article>
              <p>Deep content</p>
            </article>
          </section>
        </div>
      `;
      const result = transform(code);
      expect((result.code.match(/data-ast-id=/g) || []).length).toBe(4);
    });

    it('should handle fragments', () => {
      const code = `
        <>
          <div>First</div>
          <div>Second</div>
        </>
      `;
      const result = transform(code);
      expect((result.code.match(/data-ast-id=/g) || []).length).toBe(2);
    });
  });

  describe('uniqueness', () => {
    it('should ensure unique IDs for similar elements', () => {
      const code = `
        <>
          <div>Same</div>
          <div>Same</div>
          <div>Same</div>
        </>
      `;
      const result = transform(code, { strategy: 'slug' });
      
      // Extract all ID values
      const idMatches = result.code.match(/data-ast-id="([^"]+)"/g);
      const ids = idMatches.map(match => match.replace(/data-ast-id="([^"]+)"/, '$1'));
      
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });
  });

  describe('self-closing elements', () => {
    it('should handle self-closing elements', () => {
      const code = '<input type="text" />';
      const result = transform(code);
      expect(result.code).toContain('data-ast-id=');
      expect(result.code).toContain('<input');
      expect(result.code).toContain('/>');
    });

    it('should handle void elements', () => {
      const code = `
        <>
          <img src="test.jpg" />
          <br />
          <hr />
        </>
      `;
      const result = transform(code);
      expect((result.code.match(/data-ast-id=/g) || []).length).toBe(3);
    });
  });
});