/*
|--------------------------------------------------------------------------
| Package entrypoint
|--------------------------------------------------------------------------
|
| Export values from the package entrypoint as you see fit.
|
*/

export { default as LucidCursorPaginationProvider } from './providers/lucid_cursor_pagination_provider.js'
export { stubsRoot } from './stubs/main.js'
export { configure } from './configure.js'
export * from './src/cursor_paginator/index.js'

// Side-effect import to ensure type augmentations are included
import './src/cursor_paginator/types_augmentation.js'
