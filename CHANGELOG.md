# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.4] - 2026-01-11

### Added
- Comprehensive documentation with limitations and best practices
- Unit tests for decorated methods
- Edge case tests
- External service integration tests
- GitHub Actions release workflow

### Fixed
- Function serialization for class methods in worker threads
- `require` availability inside worker context
- Proper error propagation from workers

### Changed
- Improved project structure with proper TypeScript configuration
- Enhanced type definitions with JSDoc comments
- Moved `typescript` to devDependencies

## [1.0.3] - Previous Release

### Added
- Initial implementation of `@RunInNewThread` decorator
- Timeout support for worker execution
- Basic error handling
