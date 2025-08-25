#!/bin/bash

# Build script for WASM and native targets

set -e

echo "Building WASM target..."
wasm-pack build --target web --out-dir pkg-web --release
wasm-pack build --target nodejs --out-dir pkg-node --release
wasm-pack build --target bundler --out-dir pkg-bundler --release

echo "Building native CLI..."
cargo build --release --bin ast-append-ids

echo "Running tests..."
cargo test

echo "Running WASM tests..."
wasm-pack test --headless --firefox

echo "Copying WASM packages to npm directory..."
NPM_PACKAGE_DIR="../../npm/packages/ast-append-ids"

if [ -d "$NPM_PACKAGE_DIR" ]; then
  echo "  - Copying pkg-web to npm package..."
  rm -rf "$NPM_PACKAGE_DIR/pkg-web"
  cp -r ./pkg-web "$NPM_PACKAGE_DIR/"
  
  echo "  - Copying pkg-node to npm package..."
  rm -rf "$NPM_PACKAGE_DIR/pkg-node"
  cp -r ./pkg-node "$NPM_PACKAGE_DIR/"
  
  echo "  - Copying pkg-bundler to npm package..."
  rm -rf "$NPM_PACKAGE_DIR/pkg-bundler"
  cp -r ./pkg-bundler "$NPM_PACKAGE_DIR/"
  
  echo "WASM packages copied to npm directory successfully!"
else
  echo "Warning: npm package directory not found at $NPM_PACKAGE_DIR"
  echo "Skipping copy to npm directory."
fi

echo "Build complete!"
echo "Outputs:"
echo "  - WASM for web: ./pkg-web/"
echo "  - WASM for Node.js: ./pkg-node/"
echo "  - WASM for bundlers: ./pkg-bundler/"
echo "  - Native CLI: ./target/release/ast-append-ids"
if [ -d "$NPM_PACKAGE_DIR" ]; then
  echo "  - npm package WASM: $NPM_PACKAGE_DIR/pkg-*/"
fi