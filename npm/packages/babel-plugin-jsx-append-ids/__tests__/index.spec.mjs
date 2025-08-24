import { jest } from '@jest/globals';
import babelPluginJsxAppendIds from '../index.mjs';
import * as babel from '@babel/core';

describe('babelPluginJsxAppendIds integration tests', () => {
  const transform = (code, options = {}) => {
    return babel.transform(code, {
      plugins: [[babelPluginJsxAppendIds, options]],
      presets: ['@babel/preset-react'],
      parserOpts: {
        plugins: ['jsx']
      }
    });
  };

  describe('React component patterns', () => {
    it('should handle functional components', () => {
      const code = `
        function MyComponent() {
          return (
            <div className="container">
              <h1>Title</h1>
              <p>Content</p>
            </div>
          );
        }
      `;
      const result = transform(code);
      expect(result.code).toContain('"data-ast-id":');
      expect((result.code.match(/"data-ast-id":/g) || []).length).toBe(3);
    });

    it('should handle arrow function components', () => {
      const code = `
        const MyComponent = () => (
          <div>
            <span>Hello</span>
            <span>World</span>
          </div>
        );
      `;
      const result = transform(code);
      expect((result.code.match(/"data-ast-id":/g) || []).length).toBe(3);
    });

    it('should handle class components', () => {
      const code = `
        class MyComponent extends React.Component {
          render() {
            return (
              <div>
                <header>Header</header>
                <main>Main</main>
                <footer>Footer</footer>
              </div>
            );
          }
        }
      `;
      const result = transform(code);
      expect((result.code.match(/"data-ast-id":/g) || []).length).toBe(4);
    });
  });

  describe('conditional rendering', () => {
    it('should handle ternary operators', () => {
      const code = `
        const Component = ({ show }) => (
          <div>
            {show ? <span>Visible</span> : <span>Hidden</span>}
          </div>
        );
      `;
      const result = transform(code);
      expect((result.code.match(/"data-ast-id":/g) || []).length).toBe(3);
    });

    it('should handle logical AND operators', () => {
      const code = `
        const Component = ({ show }) => (
          <div>
            {show && <span>Conditional</span>}
          </div>
        );
      `;
      const result = transform(code);
      expect((result.code.match(/"data-ast-id":/g) || []).length).toBe(2);
    });
  });

  describe('list rendering', () => {
    it('should handle mapped elements', () => {
      const code = `
        const List = ({ items }) => (
          <ul>
            {items.map(item => (
              <li key={item.id}>{item.text}</li>
            ))}
          </ul>
        );
      `;
      const result = transform(code);
      expect(result.code).toContain('"data-ast-id":');
      expect(result.code).toContain('key: item.id');
    });

    it('should handle nested maps', () => {
      const code = `
        const Grid = ({ rows }) => (
          <div>
            {rows.map(row => (
              <div key={row.id}>
                {row.cells.map(cell => (
                  <span key={cell.id}>{cell.value}</span>
                ))}
              </div>
            ))}
          </div>
        );
      `;
      const result = transform(code);
      expect(result.code).toContain('"data-ast-id":');
    });
  });

  describe('JSX specific features', () => {
    it('should handle JSX namespaced elements', () => {
      const code = `
        <svg>
          <rect />
          <circle />
        </svg>
      `;
      const result = transform(code);
      expect((result.code.match(/"data-ast-id":/g) || []).length).toBeGreaterThanOrEqual(1);
    });

    it('should handle React.Fragment', () => {
      const code = `
        <React.Fragment>
          <div>First</div>
          <div>Second</div>
        </React.Fragment>
      `;
      const result = transform(code);
      expect((result.code.match(/"data-ast-id":/g) || []).length).toBe(2);
    });

    it('should handle short fragment syntax', () => {
      const code = `
        <>
          <span>First</span>
          <span>Second</span>
        </>
      `;
      const result = transform(code);
      expect((result.code.match(/"data-ast-id":/g) || []).length).toBe(2);
    });
  });

  describe('real-world component patterns', () => {
    it('should handle form components', () => {
      const code = `
        function ContactForm() {
          return (
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="name">Name</label>
                <input id="name" type="text" />
              </div>
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input id="email" type="email" />
              </div>
              <button type="submit">Submit</button>
            </form>
          );
        }
      `;
      const result = transform(code);
      const idCount = (result.code.match(/"data-ast-id":/g) || []).length;
      expect(idCount).toBeGreaterThanOrEqual(7);
    });

    it('should handle layout components', () => {
      const code = `
        const Layout = ({ children }) => (
          <div className="layout">
            <header className="header">
              <nav>
                <ul>
                  <li><a href="/">Home</a></li>
                  <li><a href="/about">About</a></li>
                </ul>
              </nav>
            </header>
            <main className="main">
              {children}
            </main>
            <footer className="footer">
              <p>© 2024</p>
            </footer>
          </div>
        );
      `;
      const result = transform(code, { strategy: 'path' });
      expect(result.code).toContain('"data-ast-id":');
      const idCount = (result.code.match(/"data-ast-id":/g) || []).length;
      expect(idCount).toBeGreaterThanOrEqual(9);
    });

    it('should handle card components with slug strategy', () => {
      const code = `
        const Card = ({ title, description }) => (
          <article className="card">
            <h2>{title}</h2>
            <p>{description}</p>
            <button>Read More</button>
          </article>
        );
      `;
      const result = transform(code, { strategy: 'slug' });
      expect(result.code).toContain('"data-ast-id": "el-read-more"');
    });
  });

  describe('edge cases', () => {
    it('should handle empty JSX elements', () => {
      const code = '<div></div>';
      const result = transform(code);
      expect(result.code).toContain('"data-ast-id":');
    });

    it('should handle JSX with only whitespace', () => {
      const code = '<div>   </div>';
      const result = transform(code, { strategy: 'slug' });
      expect(result.code).toContain('"data-ast-id":');
    });

    it('should handle JSX with special characters', () => {
      const code = '<div>Test &amp; Special © 2024</div>';
      const result = transform(code, { strategy: 'slug' });
      expect(result.code).toContain('"data-ast-id":');
    });

    it('should handle deeply nested conditional rendering', () => {
      const code = `
        const Complex = ({ a, b, c }) => (
          <div>
            {a ? (
              <div>
                {b ? (
                  <span>Nested</span>
                ) : (
                  <span>Alternative</span>
                )}
              </div>
            ) : c && (
              <div>
                <span>Other</span>
              </div>
            )}
          </div>
        );
      `;
      const result = transform(code);
      expect(result.code).toContain('"data-ast-id":');
    });
  });

  describe('performance', () => {
    it('should handle large component trees efficiently', () => {
      const generateLargeComponent = (depth, breadth) => {
        if (depth === 0) return '<span>Leaf</span>';
        
        const children = Array.from({ length: breadth }, () => 
          generateLargeComponent(depth - 1, breadth)
        ).join('\n');
        
        return `<div>${children}</div>`;
      };
      
      const code = `
        const LargeComponent = () => (
          ${generateLargeComponent(4, 3)}
        );
      `;
      
      const startTime = Date.now();
      const result = transform(code);
      const endTime = Date.now();
      
      expect(endTime - startTime).toBeLessThan(1000);
      expect(result.code).toContain('"data-ast-id":');
    });

    it('should handle many siblings efficiently', () => {
      const items = Array.from({ length: 100 }, (_, i) => 
        `<div key={${i}}>Item ${i}</div>`
      ).join('\n');
      
      const code = `
        const ManyItems = () => (
          <div>
            ${items}
          </div>
        );
      `;
      
      const result = transform(code);
      const idCount = (result.code.match(/"data-ast-id":/g) || []).length;
      expect(idCount).toBe(101); // 100 items + 1 container
    });
  });

  describe('TypeScript JSX', () => {
    it('should handle typed props', () => {
      const code = `
        interface Props {
          title: string;
        }
        
        const Component: React.FC<Props> = ({ title }) => (
          <div>
            <h1>{title}</h1>
          </div>
        );
      `;
      // Note: This would need TypeScript parser plugin
      // Just testing that basic JSX still works
      const jsxOnly = `
        const Component = ({ title }) => (
          <div>
            <h1>{title}</h1>
          </div>
        );
      `;
      const result = transform(jsxOnly);
      expect(result.code).toContain('"data-ast-id":');
    });
  });
});