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

echo "Build complete!"
echo "Outputs:"
echo "  - WASM for web: ./pkg-web/"
echo "  - WASM for Node.js: ./pkg-node/"
echo "  - WASM for bundlers: ./pkg-bundler/"
echo "  - Native CLI: ./target/release/ast-append-ids"