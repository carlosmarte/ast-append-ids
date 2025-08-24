#!/usr/bin/env node

// Test script for all CLIs
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

// Test files content
const testJSX = `
import React from 'react';

function TestComponent() {
  return (
    <div className="container">
      <h1>Hello World</h1>
      <button onClick={() => console.log('clicked')}>
        Click me
      </button>
      <span>Some text</span>
    </div>
  );
}
`;

const testHTML = `
<!DOCTYPE html>
<html>
<head>
  <title>Test Page</title>
</head>
<body>
  <div class="container">
    <h1>Hello World</h1>
    <button>Click me</button>
    <span>Some text</span>
  </div>
</body>
</html>
`;

const testXML = `<?xml version="1.0" encoding="UTF-8"?>
<root>
  <section>
    <title>Hello World</title>
    <button>Click me</button>
    <content>Some text</content>
  </section>
</root>`;

async function runTest(command, description) {
  console.log(`\n📝 Testing: ${description}`);
  console.log(`   Command: ${command}`);
  try {
    const { stdout, stderr } = await execAsync(command);
    if (stderr) {
      console.log(`   ⚠️  Stderr: ${stderr}`);
    }
    console.log(`   ✅ Success`);
    return stdout;
  } catch (error) {
    console.log(`   ❌ Failed: ${error.message}`);
    return null;
  }
}

async function main() {
  console.log('🧪 Testing AST Append IDs CLIs\n');
  console.log('=' .repeat(50));
  
  // Create test directory
  const testDir = path.join(process.cwd(), 'test-output');
  await fs.mkdir(testDir, { recursive: true });
  
  // Create test files
  const jsxFile = path.join(testDir, 'test.jsx');
  const htmlFile = path.join(testDir, 'test.html');
  const xmlFile = path.join(testDir, 'test.xml');
  
  await fs.writeFile(jsxFile, testJSX);
  await fs.writeFile(htmlFile, testHTML);
  await fs.writeFile(xmlFile, testXML);
  
  console.log('📁 Created test files in:', testDir);
  
  // Test id-generator CLI
  console.log('\n1️⃣ Testing id-generator CLI');
  console.log('-'.repeat(40));
  
  await runTest(
    'npx @thinkeloquent/id-generator hash --type div --prefix el-',
    'Generate hash ID'
  );
  
  await runTest(
    'npx @thinkeloquent/id-generator slug "Hello World" --prefix section-',
    'Generate slug ID'
  );
  
  await runTest(
    'npx @thinkeloquent/id-generator path --type button --indices 0,2,1',
    'Generate path ID'
  );
  
  await runTest(
    'npx @thinkeloquent/id-generator convert "el:abc:123" --to hyphen',
    'Convert ID format'
  );
  
  // Test babel-plugin-jsx-append-ids CLI
  console.log('\n2️⃣ Testing babel-plugin-jsx-append-ids CLI');
  console.log('-'.repeat(40));
  
  await runTest(
    `npx @thinkeloquent/babel-plugin-jsx-append-ids append ${jsxFile} --verbose`,
    'Process JSX file'
  );
  
  // Check if JSX was modified
  const jsxContent = await fs.readFile(jsxFile, 'utf8');
  if (jsxContent.includes('data-ast-id')) {
    console.log('   ✅ JSX file has IDs added');
  } else {
    console.log('   ⚠️  JSX file might not have been processed');
  }
  
  // Test rehype-append-ids CLI
  console.log('\n3️⃣ Testing rehype-append-ids CLI');
  console.log('-'.repeat(40));
  
  await runTest(
    `npx @thinkeloquent/rehype-append-ids process ${htmlFile} --verbose`,
    'Process HTML file'
  );
  
  await runTest(
    `npx @thinkeloquent/rehype-append-ids stats ${htmlFile}`,
    'Show HTML statistics'
  );
  
  // Check if HTML was modified
  const htmlContent = await fs.readFile(htmlFile, 'utf8');
  if (htmlContent.includes('data-ast-id')) {
    console.log('   ✅ HTML file has IDs added');
  } else {
    console.log('   ⚠️  HTML file might not have been processed');
  }
  
  // Test xast-append-ids CLI
  console.log('\n4️⃣ Testing xast-append-ids CLI');
  console.log('-'.repeat(40));
  
  await runTest(
    `npx @thinkeloquent/xast-append-ids process ${xmlFile} --verbose`,
    'Process XML file'
  );
  
  await runTest(
    `npx @thinkeloquent/xast-append-ids validate ${xmlFile}`,
    'Validate XML file'
  );
  
  // Check if XML was modified
  const xmlContent = await fs.readFile(xmlFile, 'utf8');
  if (xmlContent.includes('data-ast-id')) {
    console.log('   ✅ XML file has IDs added');
  } else {
    console.log('   ⚠️  XML file might not have been processed');
  }
  
  // Test help commands
  console.log('\n5️⃣ Testing Help Commands');
  console.log('-'.repeat(40));
  
  await runTest(
    'npx @thinkeloquent/id-generator --help',
    'id-generator help'
  );
  
  await runTest(
    'npx @thinkeloquent/babel-plugin-jsx-append-ids --help',
    'babel-plugin-jsx-append-ids help'
  );
  
  await runTest(
    'npx @thinkeloquent/rehype-append-ids --help',
    'rehype-append-ids help'
  );
  
  await runTest(
    'npx @thinkeloquent/xast-append-ids --help',
    'xast-append-ids help'
  );
  
  console.log('\n' + '='.repeat(50));
  console.log('✅ All CLI tests completed!');
  console.log('\nℹ️  Modified test files are in:', testDir);
  console.log('\n📖 Usage via NPX:');
  console.log('   npx @thinkeloquent/id-generator [command]');
  console.log('   npx @thinkeloquent/babel-plugin-jsx-append-ids [command]');
  console.log('   npx @thinkeloquent/rehype-append-ids [command]');
  console.log('   npx @thinkeloquent/xast-append-ids [command]');
}

main().catch(console.error);