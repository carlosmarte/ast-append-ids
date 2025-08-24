#!/usr/bin/env node

import { Command } from 'commander';
import {
  generateId,
  generateHashId,
  generateSlugId,
  generatePathId,
  convertIdFormat,
  extractTextContent
} from './index.mjs';

const program = new Command();

program
  .name('id-generator')
  .description('CLI for id-generator - Generate deterministic IDs for AST nodes')
  .version('0.0.4');

// Generate command
program
  .command('generate')
  .description('Generate an ID using various strategies')
  .option('--strategy <type>', 'ID generation strategy (hash|slug|path)', 'hash')
  .option('--prefix <prefix>', 'ID prefix', '')
  .option('--format <format>', 'ID format (colon|hyphen)', 'colon')
  .option('--text <text>', 'Text content for slug generation')
  .option('--type <type>', 'Node type')
  .option('--path <indices>', 'Comma-separated path indices')
  .option('--position <line:column>', 'Node position (line:column)')
  .action((options) => {
    try {
      // Parse path if provided
      const path = options.path ? 
        options.path.split(',').map(n => parseInt(n, 10)) : 
        [];
      
      // Create node object
      const node = {
        type: options.type || 'element',
        value: options.text || null,
        position: null
      };
      
      // Parse position if provided
      if (options.position) {
        const [line, column] = options.position.split(':').map(n => parseInt(n, 10));
        node.position = {
          start: { line, column }
        };
      }
      
      // Generate ID
      const id = generateId(node, {
        strategy: options.strategy,
        prefix: options.prefix,
        format: options.format
      }, path);
      
      console.log(id);
    } catch (error) {
      console.error('❌ Error generating ID:', error.message);
      process.exit(1);
    }
  });

// Hash command
program
  .command('hash')
  .description('Generate a hash-based ID')
  .option('--prefix <prefix>', 'ID prefix', '')
  .option('--type <type>', 'Node type', 'element')
  .option('--path <indices>', 'Comma-separated path indices')
  .option('--position <line:column>', 'Node position (line:column)')
  .action((options) => {
    try {
      const path = options.path ? 
        options.path.split(',').map(n => parseInt(n, 10)) : 
        [];
      
      const node = { type: options.type };
      
      if (options.position) {
        const [line, column] = options.position.split(':').map(n => parseInt(n, 10));
        node.position = {
          start: { line, column }
        };
      }
      
      const id = generateHashId(node, path, options.prefix);
      console.log(id);
    } catch (error) {
      console.error('❌ Error generating hash ID:', error.message);
      process.exit(1);
    }
  });

// Slug command
program
  .command('slug <text>')
  .description('Generate a slug-based ID from text')
  .option('--prefix <prefix>', 'ID prefix', '')
  .action((text, options) => {
    try {
      const node = { value: text };
      const id = generateSlugId(node, options.prefix);
      console.log(id);
    } catch (error) {
      console.error('❌ Error generating slug ID:', error.message);
      process.exit(1);
    }
  });

// Path command
program
  .command('path')
  .description('Generate a path-based ID')
  .option('--prefix <prefix>', 'ID prefix', '')
  .option('--type <type>', 'Node type', 'element')
  .option('--indices <indices>', 'Comma-separated path indices', '')
  .action((options) => {
    try {
      const path = options.indices ? 
        options.indices.split(',').map(n => parseInt(n, 10)) : 
        [];
      
      const node = { 
        type: options.type,
        tagName: options.type 
      };
      
      const id = generatePathId(node, path, options.prefix);
      console.log(id);
    } catch (error) {
      console.error('❌ Error generating path ID:', error.message);
      process.exit(1);
    }
  });

// Convert command
program
  .command('convert <id>')
  .description('Convert ID format between colon and hyphen')
  .option('--to <format>', 'Target format (colon|hyphen)', 'colon')
  .action((id, options) => {
    try {
      const converted = convertIdFormat(id, options.to);
      console.log(converted);
    } catch (error) {
      console.error('❌ Error converting ID:', error.message);
      process.exit(1);
    }
  });

// Extract command
program
  .command('extract')
  .description('Extract text content from a node structure (reads JSON from stdin)')
  .action(async () => {
    try {
      // Read JSON from stdin
      let input = '';
      process.stdin.setEncoding('utf8');
      
      for await (const chunk of process.stdin) {
        input += chunk;
      }
      
      if (!input.trim()) {
        console.error('❌ No input provided. Pipe JSON to this command.');
        process.exit(1);
      }
      
      const node = JSON.parse(input);
      const text = extractTextContent(node);
      console.log(text);
    } catch (error) {
      console.error('❌ Error extracting text:', error.message);
      process.exit(1);
    }
  });

// Batch command
program
  .command('batch')
  .description('Generate multiple IDs from JSON input (reads from stdin)')
  .option('--strategy <type>', 'ID generation strategy (hash|slug|path)', 'hash')
  .option('--prefix <prefix>', 'ID prefix', '')
  .option('--format <format>', 'ID format (colon|hyphen)', 'colon')
  .action(async (options) => {
    try {
      // Read JSON from stdin
      let input = '';
      process.stdin.setEncoding('utf8');
      
      for await (const chunk of process.stdin) {
        input += chunk;
      }
      
      if (!input.trim()) {
        console.error('❌ No input provided. Pipe JSON array to this command.');
        console.error('Example: echo \'[{"type":"div"},{"type":"span"}]\' | id-generator batch');
        process.exit(1);
      }
      
      const nodes = JSON.parse(input);
      if (!Array.isArray(nodes)) {
        console.error('❌ Input must be a JSON array of nodes');
        process.exit(1);
      }
      
      const usedIds = new Set();
      const results = nodes.map((node, index) => {
        const id = generateId(
          node,
          {
            strategy: options.strategy,
            prefix: options.prefix,
            format: options.format
          },
          [index],
          usedIds
        );
        return { node: node.type || 'unknown', id };
      });
      
      // Output as JSON
      console.log(JSON.stringify(results, null, 2));
    } catch (error) {
      console.error('❌ Error generating batch IDs:', error.message);
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

// Examples command
program
  .command('examples')
  .description('Show usage examples')
  .action(() => {
    console.log(`
📚 ID Generator CLI Examples
============================

Generate a hash ID:
  $ id-generator hash --type div --prefix el-
  
Generate a slug from text:
  $ id-generator slug "Hello World" --prefix section-
  
Generate a path-based ID:
  $ id-generator path --type button --indices 0,2,1
  
Convert ID format:
  $ id-generator convert "el:abc:123" --to hyphen
  
Generate ID with all options:
  $ id-generator generate --strategy slug --text "My Title" --prefix h1-
  
Extract text from JSON node:
  $ echo '{"type":"p","children":[{"value":"Hello"}]}' | id-generator extract
  
Generate batch IDs:
  $ echo '[{"type":"div"},{"type":"span"}]' | id-generator batch --prefix widget-
`);
  });

program.parse(process.argv);

// Show help if no command provided
if (process.argv.length === 2) {
  program.help();
}