# Changelog

All notable changes to this project will be documented in this file.



## [1.0.3](https://github.com/ordius/adonisjs-cursor-pagination/compare/v1.0.2...v1.0.3) (2026-03-13)

### 🐛 Bug Fixes

* **ci:** add PostgreSQL service configuration for testing environment ([0616f91](https://github.com/ordius/adonisjs-cursor-pagination/commit/0616f91bfc05ebd9e6b80818a27de186bcb0d97e))
* handle null item in [#gen](https://github.com/ordius/adonisjs-cursor-pagination/issues/gen)Cursor method ([35e9150](https://github.com/ordius/adonisjs-cursor-pagination/commit/35e91507efce02b84cbbf0f959645659acde1e28)), closes [#genCursor](https://github.com/ordius/adonisjs-cursor-pagination/issues/genCursor)

### ♻️ Code Refactoring

* remove 'qs' dependency and update URL query string handling ([45dfe52](https://github.com/ordius/adonisjs-cursor-pagination/commit/45dfe52a3c44e472a605f79622bb7fe8d4c0949b))
* use type imports for improved type safety ([959a273](https://github.com/ordius/adonisjs-cursor-pagination/commit/959a273854eb4011f4ba7dd2d63c612eb731d718))

### 🧪 Tests

* add edge case tests for cursor pagination with single items and multiple order by columns ([defb186](https://github.com/ordius/adonisjs-cursor-pagination/commit/defb186a565d8aee16e21713810e45c0704a7738))

### 👷 CI/CD

* add PostgreSQL service configuration to release workflow ([d5b0717](https://github.com/ordius/adonisjs-cursor-pagination/commit/d5b0717e2096057206032e0d1d01af1a0074fc3f))

### 🔧 Maintenance

* add GitHub workflows for checks, linting, testing, and release management ([a23ddcc](https://github.com/ordius/adonisjs-cursor-pagination/commit/a23ddcc38e9478513d90e344b2a3e1373aefb203))
* **types:** enhance SortableColumnsInternal type for better type safety ([f69ce93](https://github.com/ordius/adonisjs-cursor-pagination/commit/f69ce931a08ed4ec66e0f66840d26130a72149c8))
* update dependencies ([b1e590f](https://github.com/ordius/adonisjs-cursor-pagination/commit/b1e590ffcf8a676d262a281b56420548471ca8ef))
* update package name and references from 'mixxtor' to 'ordius' ([54eead2](https://github.com/ordius/adonisjs-cursor-pagination/commit/54eead2740593b70f20741bbd3a00cdb551845cc))

## [1.0.2](https://github.com/mixxtor/adonisjs-cursor-pagination/compare/v1.0.1...v1.0.2) (2026-03-01)

### 🔧 Maintenance

* update PostgreSQL test database URL and Node.js version requirement in README & update package.json to temporary support adonisjs v7 ([96371a5](https://github.com/mixxtor/adonisjs-cursor-pagination/commit/96371a506a76e289ec84d48ae7546483dafb7a00))

## [1.0.1](https://github.com/mixxtor/adonisjs-lucid-cursor/compare/v1.0.0...v1.0.1) (2026-03-01)

### 🐛 Bug Fixes

* ensure type augmentations are included by importing types_augmentation.js ([04afa49](https://github.com/mixxtor/adonisjs-lucid-cursor/commit/04afa495d65abc65955fb82958d1551dfa3e9f4d))

## [1.0.0](https://github.com/mixxtor/adonisjs-lucid-cursor/compare/v1.0.0-beta.1...v1.0.0) (2026-03-01)

### ♻️ Code Refactoring

* rename package to @mixxtor/adonisjs-cursor-pagination and update documentation ([f17312f](https://github.com/mixxtor/adonisjs-lucid-cursor/commit/f17312fd5b7a1d1b479c2d1776ba30e9f699c7bc))

## 1.0.0-beta.1 (2026-03-01)
