#!/usr/bin/env node

import { program } from 'commander';
import fs from 'fs/promises';
import path from 'path';
import glob from 'glob';
import {
  babelPluginJsxAppendIds,
  rehypeAppendIds,
  xastAppendIds,
  WasmAstProcessor,
  create_default_options,
  version
} from './index.mjs';

async function processFile(filePath, options, processor) {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    let result;
    
    switch (options.type) {
      case 'jsx':
        result = await babelPluginJsxAppendIds(content, options);
        break;
      case 'html':
        result = await rehypeAppendIds(content, options);
        break;
      case 'xml':
        result = await xastAppendIds(content, options);
        break;
      case 'auto':
      default:
        if (!processor) {
          processor = new WasmAstProcessor();
        }
        result = await processor.processAuto(content, options);
        break;
    }
    
    if (options.output) {
      const outputPath = options.output === true 
        ? filePath 
        : path.resolve(options.output);
      await fs.writeFile(outputPath, result, 'utf-8');
      console.log(`✓ Processed: ${filePath} → ${outputPath}`);
    } else {
      console.log(result);
    }
    
    return { success: true, file: filePath };
  } catch (error) {
    console.error(`✗ Error processing ${filePath}:`, error.message);
    return { success: false, file: filePath, error: error.message };
  }
}

program
  .name('ast-append-ids')
  .description('Unified AST ID appender for JSX, XML, and HTML')
  .version(await version())
  .option('-v, --version', 'Show version');

program
  .command('process')
  .description('Process files and append IDs to AST elements')
  .argument('<input>', 'Input file or glob pattern')
  .option('-o, --output <path>', 'Output file path (use "." to overwrite input)')
  .option('-t, --type <type>', 'Content type (jsx, html, xml, auto)', 'auto')
  .option('--id-attribute <name>', 'Attribute name for IDs', 'id')
  .option('--id-prefix <prefix>', 'Prefix for generated IDs')
  .option('--id-separator <separator>', 'Separator for ID parts', '_')
  .option('--preserve-existing', 'Preserve existing IDs', false)
  .option('--skip-ids', 'Skip ID generation', false)
  .option('--dry-run', 'Show what would be processed without making changes')
  .action(async (input, options) => {
    try {
      const files = await glob(input, { nodir: true });
      
      if (files.length === 0) {
        console.error('No files found matching pattern:', input);
        process.exit(1);
      }
      
      if (options.dryRun) {
        console.log('Dry run - files that would be processed:');
        files.forEach(file => console.log(`  - ${file}`));
        return;
      }
      
      const processorOptions = {
        idAttribute: options.idAttribute,
        idPrefix: options.idPrefix,
        idSeparator: options.idSeparator,
        preserveExisting: options.preserveExisting,
        skipIds: options.skipIds
      };
      
      let processor;
      if (options.type === 'auto' || !options.type) {
        processor = new WasmAstProcessor();
      }
      
      const results = await Promise.all(
        files.map(file => processFile(file, { 
          ...processorOptions, 
          type: options.type,
          output: options.output 
        }, processor))
      );
      
      if (processor) {
        processor.free();
      }
      
      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;
      
      console.log(`\nProcessed ${successful} file(s) successfully`);
      if (failed > 0) {
        console.error(`Failed to process ${failed} file(s)`);
        process.exit(1);
      }
    } catch (error) {
      console.error('Error:', error.message);
      process.exit(1);
    }
  });

program
  .command('defaults')
  .description('Show default processing options')
  .action(async () => {
    const defaults = await create_default_options();
    console.log('Default options:', JSON.stringify(defaults, null, 2));
  });

program
  .command('info')
  .description('Show package information')
  .action(async () => {
    const ver = await version();
    console.log('ast-append-ids WASM module');
    console.log('Version:', ver);
    console.log('Supported formats: JSX, HTML, XML');
    console.log('Environment:', process.env.NODE_ENV || 'production');
  });

program.parse(process.argv);