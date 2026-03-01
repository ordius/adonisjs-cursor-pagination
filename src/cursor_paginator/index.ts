/*
 * @mixxtor/adonisjs-lucid-cursor
 *
 * (c) Mixxtor Radcliffe <mixxtor@gmail.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

export { CursorPaginator, ModelCursorPaginator } from './paginator.js'
export { cursorPaginateMacroFn, registerCursorPaginationMacro } from './macro.js'
export { CursorCamelCaseNamingStrategy } from './naming_strategies/camel_case.js'
export { CursorSnakeCaseNamingStrategy } from './naming_strategies/snake_case.js'
export * from './types.js'

// Type augmentations (side-effect import to ensure declarations are included)
import './types_augmentation.js'
