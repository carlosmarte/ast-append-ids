export interface ProcessorOptions {
  idAttribute?: string;
  idPrefix?: string;
  idSeparator?: string;
  skipIds?: boolean;
  preserveExisting?: boolean;
  [key: string]: any;
}

export function create_default_options(): ProcessorOptions;

export function version(): Promise<string>;

export function babelPluginJsxAppendIds(content: string, options?: ProcessorOptions): Promise<string>;

export function rehypeAppendIds(content: string, options?: ProcessorOptions): Promise<string>;

export function xastAppendIds(content: string, options?: ProcessorOptions): Promise<string>;

export declare class WasmAstProcessor {
  constructor();
  
  processJsx(content: string, options?: ProcessorOptions): Promise<string>;
  
  processXml(content: string, options?: ProcessorOptions): Promise<string>;
  
  processHtml(content: string, options?: ProcessorOptions): Promise<string>;
  
  processAuto(content: string, options?: ProcessorOptions): Promise<string>;
  
  free(): void;
}

declare const astAppendIds: {
  create_default_options: typeof create_default_options;
  version: typeof version;
  babelPluginJsxAppendIds: typeof babelPluginJsxAppendIds;
  rehypeAppendIds: typeof rehypeAppendIds;
  xastAppendIds: typeof xastAppendIds;
  WasmAstProcessor: typeof WasmAstProcessor;
};

export default astAppendIds;