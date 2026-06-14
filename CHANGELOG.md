# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed

- Gap-filling grid growth used a stale row count, causing items routed through
  the grid-growth path to be stacked on top of one another (overlapping cards)
  and preventing the newly grown space from being reused. The available-space
  search and placement now read the live grid height.

### Changed

- Removed unreachable defensive branches (post-scale-down fit check, dead
  array-ratio handling, and impossible divide-by-zero guards) and hardened
  `markRegion` to clamp writes to the grid bounds.
- Test coverage increased to 100% (statements, branches, functions, lines);
  CI now enforces the 100% thresholds.

### Security

- Updated dev/build dependencies to patched releases, resolving all reported
  advisories (`vitest`, `@vitest/coverage-v8`, `happy-dom`, `tsdown`, and the
  example app's `vite`/`@vitejs/plugin-react`). `npm audit` reports 0
  vulnerabilities in both the library and the example app. The published
  package continues to ship with zero runtime dependencies.

## [2.0.0] - 2025-12-11

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
