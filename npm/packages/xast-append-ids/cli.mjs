#!/usr/bin/env node

import { Command } from 'commander';
import { unified } from 'unified';
import { fromXml } from 'xast-util-from-xml';
import { toXml } from 'xast-util-to-xml';
import fs from 'fs/promises';
import path from 'path';
import { glob } from 'glob';
import xastAppendIds from './index.mjs';

const program = new Command();

program
  .name('xast-append-ids')
  .description('CLI for xast-append-ids - Append deterministic IDs to XML elements')
  .version('0.0.4');

// Process command
program
  .command('process <path>')
  .description('Process XML files to append IDs')
  .option('--selector <selector>', 'CSS selector for target elements', '*:not([id])')
  .option('--attr <name>', 'Attribute name for ID', 'data-ast-id')
  .option('--strategy <type>', 'ID generation strategy (hash|slug|path)', 'hash')
  .option('--prefix <prefix>', 'ID prefix', 'el-')
  .option('--overwrite', 'Overwrite existing IDs', false)
  .option('--namespace <ns>', 'XML namespace for ID attribute')
  .option('-o, --output <dir>', 'Output directory (default: in-place modification)')
  .option('-v, --verbose', 'Verbose output', false)
  .option('--preserve-dtd', 'Preserve DTD declarations', false)
  .action(async (filePath, options) => {
    try {
      // Plugin options
      const pluginOptions = {
        selector: options.selector,
        attr: options.attr,
        strategy: options.strategy,
        prefix: options.prefix,
        overwrite: options.overwrite,
        namespace: options.namespace
      };
      
      // Resolve path and find files
      const resolvedPath = path.resolve(filePath);
      let files = [];
      
      // Check if it's a directory or file pattern
      const stats = await fs.stat(resolvedPath).catch(() => null);
      
      if (stats && stats.isDirectory()) {
        // Process all .xml files in directory
        const pattern = path.join(resolvedPath, '**/*.{xml,svg,xhtml}');
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
          const xml = await fs.readFile(file, 'utf8');
          
          // Parse XML to XAST
          const tree = fromXml(xml);
          
          // Create processor
          const processor = unified()
            .use(function() {
              return xastAppendIds(pluginOptions);
            });
          
          // Process tree
          const processedTree = await processor.run(tree);
          
          // Convert back to XML
          const result = toXml(processedTree, { 
            closeEmptyElements: true,
            tightClose: false
          });
          
          // Determine output path
          let outputPath = file;
          if (options.output) {
            const outputDir = path.resolve(options.output);
            await fs.mkdir(outputDir, { recursive: true });
            outputPath = path.join(outputDir, path.basename(file));
          }
          
          // Preserve original XML declaration if present
          let finalOutput = result;
          if (xml.startsWith('<?xml')) {
            const declEnd = xml.indexOf('?>');
            if (declEnd !== -1) {
              const declaration = xml.substring(0, declEnd + 2);
              if (!result.startsWith('<?xml')) {
                finalOutput = declaration + '\n' + result;
              }
            }
          }
          
          // Write transformed XML
          await fs.writeFile(outputPath, finalOutput);
          
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

// Validate command
program
  .command('validate <path>')
  .description('Validate XML files and check for ID conflicts')
  .option('--attr <name>', 'Attribute name to check', 'data-ast-id')
  .option('--namespace <ns>', 'XML namespace for ID attribute')
  .action(async (filePath, options) => {
    try {
      // Resolve path and find files
      const resolvedPath = path.resolve(filePath);
      let files = [];
      
      const stats = await fs.stat(resolvedPath).catch(() => null);
      
      if (stats && stats.isDirectory()) {
        const pattern = path.join(resolvedPath, '**/*.{xml,svg,xhtml}');
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
      const parseErrors = [];
      
      // Process each file
      for (const file of files) {
        try {
          const xml = await fs.readFile(file, 'utf8');
          
          // Parse XML
          const tree = fromXml(xml);
          
          // Count elements
          const countElements = (node) => {
            if (node.type === 'element') {
              totalElements++;
              
              // Check for ID attribute
              const attrName = options.namespace ? 
                `${options.namespace}:${options.attr}` : 
                options.attr;
              
              if (node.attributes && node.attributes[attrName]) {
                elementsWithId++;
                const id = node.attributes[attrName];
                if (!idFrequency.has(id)) {
                  idFrequency.set(id, []);
                }
                idFrequency.get(id).push(file);
              }
              
              // Also check standard id and xml:id
              if (node.attributes) {
                if (node.attributes.id) {
                  const id = node.attributes.id;
                  if (!idFrequency.has(id)) {
                    idFrequency.set(id, []);
                  }
                  idFrequency.get(id).push(file);
                }
                if (node.attributes['xml:id']) {
                  const id = node.attributes['xml:id'];
                  if (!idFrequency.has(id)) {
                    idFrequency.set(id, []);
                  }
                  idFrequency.get(id).push(file);
                }
              }
            }
            
            if (node.children) {
              node.children.forEach(countElements);
            }
          };
          
          countElements(tree);
        } catch (error) {
          parseErrors.push({ file, error: error.message });
        }
      }
      
      // Display validation results
      console.log('\n📋 XML Validation Results:');
      console.log('─'.repeat(40));
      console.log(`Total files analyzed: ${files.length}`);
      
      if (parseErrors.length > 0) {
        console.log(`\n❌ Parse errors in ${parseErrors.length} file(s):`);
        parseErrors.forEach(({ file, error }) => {
          console.log(`  ${file}: ${error}`);
        });
      } else {
        console.log('✅ All files parsed successfully');
      }
      
      console.log(`\n📊 ID Statistics:`);
      console.log(`Total elements: ${totalElements}`);
      console.log(`Elements with ${options.attr}: ${elementsWithId}`);
      console.log(`Coverage: ${totalElements > 0 ? ((elementsWithId / totalElements) * 100).toFixed(2) : 0}%`);
      
      // Check for duplicate IDs
      const duplicates = Array.from(idFrequency.entries())
        .filter(([id, files]) => files.length > 1)
        .sort((a, b) => b[1].length - a[1].length);
      
      if (duplicates.length > 0) {
        console.log('\n⚠️  Duplicate IDs found:');
        duplicates.slice(0, 10).forEach(([id, files]) => {
          console.log(`  ${id}: ${files.length} occurrences`);
          const uniqueFiles = [...new Set(files)];
          uniqueFiles.slice(0, 3).forEach(file => {
            console.log(`    - ${path.relative(process.cwd(), file)}`);
          });
          if (uniqueFiles.length > 3) {
            console.log(`    ... and ${uniqueFiles.length - 3} more files`);
          }
        });
        if (duplicates.length > 10) {
          console.log(`  ... and ${duplicates.length - 10} more duplicate IDs`);
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