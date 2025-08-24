#!/usr/bin/env node

import { Command } from 'commander';
import { unified } from 'unified';
import rehypeParse from 'rehype-parse';
import rehypeStringify from 'rehype-stringify';
import fs from 'fs/promises';
import path from 'path';
import { glob } from 'glob';
import rehypeAppendIds from './index.mjs';

const program = new Command();

program
  .name('rehype-append-ids')
  .description('CLI for rehype-append-ids - Append deterministic IDs to HTML elements')
  .version('0.0.4');

// Process command
program
  .command('process <path>')
  .description('Process HTML files to append IDs')
  .option('--selector <selector>', 'CSS selector for target elements', '*:not([id])')
  .option('--attr <name>', 'Attribute name for ID', 'data-ast-id')
  .option('--strategy <type>', 'ID generation strategy (hash|slug|path)', 'hash')
  .option('--prefix <prefix>', 'ID prefix', 'el-')
  .option('--overwrite', 'Overwrite existing IDs', false)
  .option('-o, --output <dir>', 'Output directory (default: in-place modification)')
  .option('-v, --verbose', 'Verbose output', false)
  .option('--fragment', 'Parse as HTML fragment (no doctype)', false)
  .action(async (filePath, options) => {
    try {
      // Plugin options
      const pluginOptions = {
        selector: options.selector,
        attr: options.attr,
        strategy: options.strategy,
        prefix: options.prefix,
        overwrite: options.overwrite
      };
      
      // Resolve path and find files
      const resolvedPath = path.resolve(filePath);
      let files = [];
      
      // Check if it's a directory or file pattern
      const stats = await fs.stat(resolvedPath).catch(() => null);
      
      if (stats && stats.isDirectory()) {
        // Process all .html files in directory
        const pattern = path.join(resolvedPath, '**/*.{html,htm}');
        files = await glob(pattern);
      } else if (stats && stats.isFile()) {
        files = [resolvedPath];
      } else {
        // Try as glob pattern
        files = await glob(filePath);
      }
      
      if (files.length === 0) {
        console.error('❌ No files found matching:', filePath);
        process.exit(1);
      }
      
      if (options.verbose) {
        console.log(`Found ${files.length} file(s) to process`);
      }
      
      // Process each file
      for (const file of files) {
        try {
          if (options.verbose) {
            console.log(`Processing: ${file}`);
          }
          
          // Read file
          const html = await fs.readFile(file, 'utf8');
          
          // Create processor
          const processor = unified()
            .use(rehypeParse, { fragment: options.fragment })
            .use(rehypeAppendIds, pluginOptions)
            .use(rehypeStringify);
          
          // Process HTML
          const result = await processor.process(html);
          
          // Determine output path
          let outputPath = file;
          if (options.output) {
            const outputDir = path.resolve(options.output);
            await fs.mkdir(outputDir, { recursive: true });
            outputPath = path.join(outputDir, path.basename(file));
          }
          
          // Write transformed HTML
          await fs.writeFile(outputPath, String(result));
          
          if (options.verbose) {
            console.log(`✅ Processed: ${outputPath}`);
          }
        } catch (error) {
          console.error(`❌ Error processing ${file}:`, error.message);
          if (options.verbose) {
            console.error(error.stack);
          }
        }
      }
      
      console.log(`✅ Successfully processed ${files.length} file(s)`);
    } catch (error) {
      console.error('❌ Error:', error.message);
      if (options.verbose) {
        console.error(error.stack);
      }
      process.exit(1);
    }
  });

// Stats command
program
  .command('stats <path>')
  .description('Show statistics about IDs in HTML files')
  .option('--attr <name>', 'Attribute name to check', 'data-ast-id')
  .action(async (filePath, options) => {
    try {
      // Resolve path and find files
      const resolvedPath = path.resolve(filePath);
      let files = [];
      
      const stats = await fs.stat(resolvedPath).catch(() => null);
      
      if (stats && stats.isDirectory()) {
        const pattern = path.join(resolvedPath, '**/*.{html,htm}');
        files = await glob(pattern);
      } else if (stats && stats.isFile()) {
        files = [resolvedPath];
      } else {
        files = await glob(filePath);
      }
      
      if (files.length === 0) {
        console.error('❌ No files found matching:', filePath);
        process.exit(1);
      }
      
      let totalElements = 0;
      let elementsWithId = 0;
      const idFrequency = new Map();
      
      // Process each file
      for (const file of files) {
        const html = await fs.readFile(file, 'utf8');
        
        // Parse HTML
        const processor = unified().use(rehypeParse, { fragment: false });
        const tree = await processor.parse(html);
        
        // Count elements
        const countElements = (node) => {
          if (node.type === 'element') {
            totalElements++;
            
            if (node.properties && node.properties[options.attr]) {
              elementsWithId++;
              const id = node.properties[options.attr];
              idFrequency.set(id, (idFrequency.get(id) || 0) + 1);
            }
          }
          
          if (node.children) {
            node.children.forEach(countElements);
          }
        };
        
        countElements(tree);
      }
      
      // Display statistics
      console.log('\n📊 ID Statistics:');
      console.log('─'.repeat(40));
      console.log(`Total files analyzed: ${files.length}`);
      console.log(`Total elements: ${totalElements}`);
      console.log(`Elements with ${options.attr}: ${elementsWithId}`);
      console.log(`Coverage: ${totalElements > 0 ? ((elementsWithId / totalElements) * 100).toFixed(2) : 0}%`);
      
      // Check for duplicate IDs
      const duplicates = Array.from(idFrequency.entries())
        .filter(([id, count]) => count > 1)
        .sort((a, b) => b[1] - a[1]);
      
      if (duplicates.length > 0) {
        console.log('\n⚠️  Duplicate IDs found:');
        duplicates.slice(0, 10).forEach(([id, count]) => {
          console.log(`  ${id}: ${count} occurrences`);
        });
        if (duplicates.length > 10) {
          console.log(`  ... and ${duplicates.length - 10} more`);
        }
      } else if (elementsWithId > 0) {
        console.log('\n✅ No duplicate IDs found');
      }
      
    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  });

// Help command
program
  .command('help [command]')
  .description('Display help for command')
  .action((cmd) => {
    if (cmd) {
      const command = program.commands.find(c => c.name() === cmd);
      if (command) {
        command.help();
      } else {
        console.log(`Unknown command: ${cmd}`);
      }
    } else {
      program.help();
    }
  });

program.parse(process.argv);

// Show help if no command provided
if (process.argv.length === 2) {
  program.help();
}