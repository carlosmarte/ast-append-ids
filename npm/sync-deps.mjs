#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'fs';
import { glob } from 'glob';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Get all package.json files
const packageFiles = glob.sync('packages/*/package.json', { cwd: __dirname });

// Read all packages to build a version map
const packages = {};
for (const file of packageFiles) {
  const fullPath = join(__dirname, file);
  const pkg = JSON.parse(readFileSync(fullPath, 'utf8'));
  packages[pkg.name] = pkg.version;
}

console.log('Found packages:');
Object.entries(packages).forEach(([name, version]) => {
  console.log(`  ${name}@${version}`);
});

// Update dependencies in all packages
let updated = false;
for (const file of packageFiles) {
  const fullPath = join(__dirname, file);
  const pkg = JSON.parse(readFileSync(fullPath, 'utf8'));
  let pkgUpdated = false;

  // Check dependencies
  if (pkg.dependencies) {
    for (const [depName, currentVersion] of Object.entries(pkg.dependencies)) {
      if (packages[depName]) {
        const newVersion = `^${packages[depName]}`;
        if (currentVersion !== newVersion) {
          console.log(`${pkg.name}: ${depName} ${currentVersion} → ${newVersion}`);
          pkg.dependencies[depName] = newVersion;
          pkgUpdated = true;
        }
      }
    }
  }

  // Check devDependencies
  if (pkg.devDependencies) {
    for (const [depName, currentVersion] of Object.entries(pkg.devDependencies)) {
      if (packages[depName]) {
        const newVersion = `^${packages[depName]}`;
        if (currentVersion !== newVersion) {
          console.log(`${pkg.name}: ${depName} ${currentVersion} → ${newVersion} (dev)`);
          pkg.devDependencies[depName] = newVersion;
          pkgUpdated = true;
        }
      }
    }
  }

  if (pkgUpdated) {
    writeFileSync(fullPath, JSON.stringify(pkg, null, 2) + '\n');
    updated = true;
  }
}

if (!updated) {
  console.log('All internal dependencies are already up to date');
} else {
  console.log('✓ Dependencies synchronized');
}