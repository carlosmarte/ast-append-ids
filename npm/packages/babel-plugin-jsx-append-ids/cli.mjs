#!/usr/bin/env node

import { Command } from 'commander';
import * as babel from '@babel/core';
import fs from 'fs/promises';
import path from 'path';
import { glob } from 'glob';
import babelPluginJsxAppendIds from './index.mjs';

const program = new Command();

program
  .name('babel-jsx-append-ids')
  .description('CLI for babel-plugin-jsx-append-ids - Append deterministic IDs to JSX elements')
  .version('0.0.4');

// Init command
program
  .command('init')
  .description('Initialize babel config with jsx-append-ids plugin')
  .option('-c, --config <file>', 'Babel config file to update', '.babelrc.json')
  .action(async (options) => {
    try {
      const configPath = path.resolve(options.config);
      let config = {};
      
      // Try to read existing config
      try {
        const configContent = await fs.readFile(configPath, 'utf8');
        config = JSON.parse(configContent);
      } catch (err) {
        console.log(`Creating new babel config at ${configPath}`);
      }
      
      // Ensure plugins array exists
      if (!config.plugins) {
        config.plugins = [];
      }
      
      // Check if plugin already exists
      const pluginExists = config.plugins.some(plugin => {
        if (typeof plugin === 'string') {
          return plugin === '@thinkeloquent/babel-plugin-jsx-append-ids';
        }
        if (Array.isArray(plugin)) {
          return plugin[0] === '@thinkeloquent/babel-plugin-jsx-append-ids';
        }
        return false;
      });
      
      if (!pluginExists) {
        // Add plugin with default options
        config.plugins.push([
          '@thinkeloquent/babel-plugin-jsx-append-ids',
          {
            attr: 'data-ast-id',
            strategy: 'hash',
            prefix: 'el-',
            overwrite: false
          }
        ]);
        
        // Write config
        await fs.writeFile(configPath, JSON.stringify(config, null, 2));
        console.log(`✅ Added babel-plugin-jsx-append-ids to ${configPath}`);
      } else {
        console.log(`ℹ️ Plugin already exists in ${configPath}`);
      }
    } catch (error) {
      console.error('❌ Error initializing babel config:', error.message);
      process.exit(1);
    }
  });

// Append command
program
  .command('append <path>')
  .description('Process JSX files to append IDs')
  .option('--attr <name>', 'Attribute name for ID', 'data-ast-id')
  .option('--strategy <type>', 'ID generation strategy (hash|slug|path)', 'hash')
  .option('--prefix <prefix>', 'ID prefix', 'el-')
  .option('--overwrite', 'Overwrite existing IDs', false)
  .option('--include <tags>', 'Comma-separated list of tags to include')
  .option('--exclude <tags>', 'Comma-separated list of tags to exclude')
  .option('-o, --output <dir>', 'Output directory (default: in-place modification)')
  .option('-v, --verbose', 'Verbose output', false)
  .action(async (filePath, options) => {
    try {
      // Parse include/exclude lists
      const include = options.include ? options.include.split(',').map(s => s.trim()) : [];
      const exclude = options.exclude ? options.exclude.split(',').map(s => s.trim()) : [];
      
      // Plugin options
      const pluginOptions = {
        attr: options.attr,
        strategy: options.strategy,
        prefix: options.prefix,
        overwrite: options.overwrite,
        include,
        exclude
      };
      
      // Resolve path and find files
      const resolvedPath = path.resolve(filePath);
      let files = [];
      
      // Check if it's a directory or file pattern
      const stats = await fs.stat(resolvedPath).catch(() => null);
      
      if (stats && stats.isDirectory()) {
        // Process all .jsx and .js files in directory
        const pattern = path.join(resolvedPath, '**/*.{js,jsx,tsx}');
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
          const code = await fs.readFile(file, 'utf8');
          
          // Transform with babel
          const result = await babel.transformAsync(code, {
            filename: file,
            plugins: [
              [babelPluginJsxAppendIds, pluginOptions]
            ],
            parserOpts: {
              plugins: [
                'jsx',
                'typescript'
              ]
            },
            // Preserve formatting as much as possible
            compact: false,
            retainLines: true
          });
          
          if (result && result.code) {
            // Determine output path
            let outputPath = file;
            if (options.output) {
              const outputDir = path.resolve(options.output);
              await fs.mkdir(outputDir, { recursive: true });
              outputPath = path.join(outputDir, path.basename(file));
            }
            
            // Write transformed code
            await fs.writeFile(outputPath, result.code);
            
            if (options.verbose) {
              console.log(`✅ Processed: ${outputPath}`);
            }
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