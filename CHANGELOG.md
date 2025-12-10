# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - Unreleased

Complete rewrite with simplified, pixel-based API.

### Breaking Changes (from 1.0.0)

- Renamed `calculateCardLayout` → `calculateLayout`
- Result structure: `cards`/`width`/`height`/`utilization`/`orderFidelity` (replaces `placed`/`grid`/`unplaced`/`spaces`)
- `PlacedCard` uses `item` reference and `x`/`y` in pixels (replaces `id`, `col`/`row`)
- Removed `importance` field from items
- All sizes now in pixels (input and output)
- Items no longer require `id` field

### Added

- `includeGrid` option for CSS Grid positioning data
- Ratio shortcuts: `portrait`, `landscape`, `banner`, `tower`
- `minSize`/`maxSize` constraints in pixels
- `loose` option for ratio flexibility
- Helper utilities: `createResizeObserver`, `createScrollOptimizer`
- Interactive React example with settings panel and performance metrics
- GitHub Actions CI/CD workflow
- CHANGELOG.md

### Changed

- Migrated build system to tsdown
- Requires Node 20+
- Test coverage improved to 93%+

### Fixed

- Removed dead code (`looseness` option and `maxDisplacement` that were never functional)
- Fixed lint warning for `any` type in helpers.ts

## [1.0.0] - Internal

Internal private version. Initial implementation of masonry-quilt with basic box-packing algorithm.
