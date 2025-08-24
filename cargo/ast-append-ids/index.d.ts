// TypeScript definitions for ast-append-ids-wasm

export interface IdOptions {
  /** Attribute name for ID (default: 'data-ast-id') */
  attr?: string;
  /** ID generation strategy (default: 'hash') */
  strategy?: 'hash' | 'slug' | 'path';
  /** ID prefix (default: 'el-') */
  prefix?: string;
  /** Overwrite existing IDs (default: false) */
  overwrite?: boolean;
  /** CSS selector for target elements (HTML/XML only) */
  selector?: string | null;
  /** Tags to include (JSX only) */
  include?: string[];
  /** Tags to exclude (JSX only) */
  exclude?: string[];
}

export declare class AstAppendIds {
  constructor();
  
  /**
   * Process JSX/React content
   */
  processJsx(content: string, options?: IdOptions): Promise<string>;
  
  /**
   * Process XML content
   */
  processXml(content: string, options?: IdOptions): Promise<string>;
  
  /**
   * Process HTML content
   */
  processHtml(content: string, options?: IdOptions): Promise<string>;
  
  /**
   * Auto-detect content type and process
   */
  processAuto(content: string, options?: IdOptions): Promise<string>;
}

/**
 * Babel plugin for JSX ID appending
 */
export declare function babelPluginJsxAppendIds(babel: any): any;

/**
 * Rehype plugin for HTML ID appending
 */
export declare function rehypeAppendIds(options?: IdOptions): any;

/**
 * XAST plugin for XML ID appending
 */
export declare function xastAppendIds(options?: IdOptions): any;

/**
 * Direct WASM function exports
 */
export declare function processJsx(content: string, options?: IdOptions): Promise<string>;
export declare function processXml(content: string, options?: IdOptions): Promise<string>;
export declare function processHtml(content: string, options?: IdOptions): Promise<string>;

/**
 * Get library version
 */
export declare function version(): Promise<string>;

/**
 * Create default options object
 */
export declare function createDefaultOptions(): Promise<IdOptions>;

export default AstAppendIds;