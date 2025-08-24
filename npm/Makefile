.PHONY: help test build lint changeset version publish-dry publish clean install

# Default target
help:
	@echo "Available targets:"
	@echo "  install        - Install dependencies"
	@echo "  test           - Run all tests"
	@echo "  test-watch     - Run tests in watch mode"
	@echo "  test-coverage  - Run tests with coverage"
	@echo "  build          - Build all packages"
	@echo "  lint           - Lint all packages"
	@echo "  clean          - Clean node_modules and build artifacts"
	@echo "  changeset      - Create a new changeset (what changed?)"
	@echo "  version        - Update package versions based on changesets"
	@echo "  publish-dry    - Dry run publish to check what would be published"
	@echo "  publish        - Publish all packages to npm"
	@echo "  sync-deps      - Sync internal dependency versions"
	@echo "  release        - Complete release (test + version + publish)"

# Development commands
install:
	npm install

test:
	npm test

test-watch:
	npm run test:watch

test-coverage:
	npm run test:coverage

build:
	npm run build

lint:
	npm run lint

clean:
	rm -rf node_modules packages/*/node_modules
	npm run clean --workspaces --if-present

# Dependency management
sync-deps:
	./sync-deps.mjs

# Changesets workflow
changeset:
	npx changeset

version:
	npx changeset version

# Publishing commands
publish-dry:
	npm publish --dry-run --workspaces

publish:
	npx changeset publish

# Complete release workflow
release: test lint build version publish
	@echo "✅ Release completed successfully!"