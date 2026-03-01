/*
 * @mixxtor/adonisjs-lucid-cursor
 *
 * (c) Mixxtor Radcliffe <mixxtor@gmail.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { DatabaseQueryBuilder } from '@adonisjs/lucid/database'
import { ModelQueryBuilder, SnakeCaseNamingStrategy } from '@adonisjs/lucid/orm'
import { CursorPaginator, ModelCursorPaginator } from './paginator.js'
import type { TCursorData, TCursorPaginateOptions } from './types.js'
import type { LucidRow } from '@adonisjs/lucid/types/model'
import { CursorSnakeCaseNamingStrategy } from './naming_strategies/snake_case.js'
import { CursorCamelCaseNamingStrategy } from './naming_strategies/camel_case.js'

/**
 * Cursor paginates the data based on the provided parameters.
 *
 * @param {number} perPage - The number of items per page.
 * @param {string | null} cursor - The cursor for pagination.
 * @param {object} options - The options for cursor pagination.
 * @param {object} options.orderByColumns - The object containing the sortable columns. Default is `model.primaryKey` with `asc` direction.
 * @param {boolean} options.fetchTotal - Whether to fetch the total number of records. Default is `true`.
 */
export async function cursorPaginateMacroFn(
  this: DatabaseQueryBuilder | ModelQueryBuilder,
  perPage: number = 10,
  cursor?: string | null,
  options?: TCursorPaginateOptions<LucidRow>
) {
  /**
   * Cast to number
   */
  perPage = typeof perPage === 'string' ? Number.parseInt(perPage) : Number(perPage)

  let total: number = Number.NaN
  let { orderByColumns = {}, fetchTotal = true } = options ?? {}

  // Use a mutable record type for dynamic column access
  let mutableOrderByColumns: Record<string, 'asc' | 'desc' | undefined> = { ...orderByColumns }

  const isModelQuery = this instanceof ModelQueryBuilder
  const primaryKey = isModelQuery ? this.model.primaryKey : 'id'

  // Access internal Knex properties (not part of public API)
  const knexQueryInternal = this.knexQuery as unknown as {
    _method?: string
    _statements?: Array<{
      grouping: string
      value: string
      type?: string
      direction?: 'asc' | 'desc'
    }>
  }

  const isFetchCall = isModelQuery
    ? this['wrapResultsToModelInstances'] && knexQueryInternal._method === 'select'
    : false

  const countQuery = isModelQuery
    ? this.clone().clearOrder().clearLimit().clearOffset().clearSelect().count('* as total').pojo()
    : this.client
        .query()
        .from(this.clone().clearOrder().clearLimit().clearOffset().as('subQuery'))
        .count('* as total')

  /**
   * Fire hooks in the same order as Lucid's built-in `paginate()`:
   *   1. before:paginate  (receives [countQuery, mainQuery])
   *   2. before:fetch     (receives mainQuery)
   *
   * NOTE: The main query is later executed via `execQuery()` (not `exec()`)
   * to avoid double-firing before:fetch / after:fetch, since `exec()` on
   * ModelQueryBuilder internally fires those hooks again.
   */
  if (isModelQuery && isFetchCall) {
    await this.model.$hooks.runner('before:paginate').run([countQuery, this])
    await this.model.$hooks.runner('before:fetch').run(this)
  }

  if (fetchTotal) {
    const aggregates = await countQuery.exec()
    total = isModelQuery
      ? this.hasGroupBy
        ? aggregates.length
        : (aggregates[0]?.['total'] ?? 0)
      : aggregates[0]?.total
  }

  /**
   * Apply relation constraints early (if this is a relation query builder)
   * so that the foreignKey WHERE clause is added before cursor conditions.
   * Without this, `applyConstraints()` would be called later during `exec()`,
   * where `wrapExisting()` groups all prior WHERE clauses (including cursor
   * conditions) and the cursor conditions get lost in the nested callback resolution.
   */
  if (
    typeof (this as unknown as { applyConstraints?: () => void }).applyConstraints === 'function'
  ) {
    ;(this as unknown as { applyConstraints: () => void }).applyConstraints()
  }

  /**
   * Extract the ORDER BY statements from the query
   * NOTE: Currently only supports Knex (tested with PostgreSQL)
   */
  const queryStatements = knexQueryInternal._statements
  queryStatements?.forEach((statement) => {
    if (statement.grouping === 'order' && statement.type === 'orderByBasic') {
      mutableOrderByColumns[statement.value] = statement.direction
    }
  })

  // Default to primary key
  mutableOrderByColumns = !Object.keys(mutableOrderByColumns)?.length
    ? { [primaryKey]: 'asc' }
    : mutableOrderByColumns

  // convert column order's direction to lowercase from 'orderByColumns'
  for (const [column, direction] of Object.entries(mutableOrderByColumns)) {
    mutableOrderByColumns[column] = direction?.toString().toLowerCase() as 'asc' | 'desc'
  }

  // Clear existing ORDER BY clauses to avoid conflicts
  this.clearOrder()

  const clonedOrderByColumns: typeof mutableOrderByColumns = { ...mutableOrderByColumns }
  const cursorData = (
    cursor ? JSON.parse(Buffer.from(cursor, 'base64').toString('utf-8')) : null
  ) as TCursorData
  const cloneCursorData = { ...cursorData }

  if (cursor) {
    /**
     * Extract cursor values eagerly (outside deferred callbacks) so that
     * the WHERE conditions are idempotent across multiple `applyWhere()` calls.
     * AdonisJS Lucid's `applyWhere()` can be invoked more than once (e.g., during
     * `execQuery()`, `toSQL()`, or `toKnex()`). If values were shifted inside
     * deferred callbacks, subsequent calls would find an empty array and produce
     * no cursor WHERE conditions.
     */
    const cursorValues = [...cursorData.data]
    const columnEntries = Object.entries(mutableOrderByColumns) as [string, 'asc' | 'desc'][]

    const apply = function (query: DatabaseQueryBuilder | ModelQueryBuilder, entryIndex: number) {
      if (entryIndex >= columnEntries.length || entryIndex >= cursorValues.length) return

      const [column, direction] = columnEntries[entryIndex]
      const value = cursorValues[entryIndex]

      query.where((subQuery: DatabaseQueryBuilder | ModelQueryBuilder) => {
        if (cursorData!.point_to_next) {
          subQuery.where(column, direction === 'asc' ? '>' : '<', value)
        } else {
          subQuery.where(column, direction === 'asc' ? '<' : '>', value)
        }

        if (entryIndex + 1 < columnEntries.length && entryIndex + 1 < cursorValues.length) {
          subQuery.orWhere(column, value)
          apply(subQuery, entryIndex + 1)
        }
      })
    }

    apply(this, 0)
  }

  for (let [column, direction] of Object.entries(mutableOrderByColumns)) {
    if (cursor && !cloneCursorData.point_to_next) {
      direction = direction === 'asc' ? 'desc' : 'asc'
    }
    this.orderBy(column, direction as 'asc' | 'desc')
  }
  perPage && this.limit(perPage + 1)

  /**
   * Use `execQuery()` for model queries to avoid double-firing hooks.
   * `ModelQueryBuilder.exec()` internally fires before:fetch / after:fetch,
   * but we already fired them manually above (matching Lucid's paginate() pattern).
   * `execQuery()` is the low-level method that just runs the SQL and wraps results.
   *
   * For `DatabaseQueryBuilder`, `exec()` is safe (no hooks involved).
   */
  const items = isModelQuery ? await (this as any).execQuery() : await this.exec()
  const cursorDataOrNull = items.length ? cursorData : null
  // const sortableColumns = items.length ? orderByColumns : clonedOrderByColumns // unknown why `orderByColumns` is empty
  const sortableColumns = clonedOrderByColumns

  // Check if there are more pages before removing the last item
  const hasMorePages = items.length > perPage
  hasMorePages && items.pop()

  // Reverse items if not pointing to next page (go backwards)
  if (cursorDataOrNull && !cursorDataOrNull.point_to_next) {
    items.reverse()
  }

  /**
   * Choose paginator
   */
  const paginator = (this as any)['wrapResultsToModelInstances']
    ? new ModelCursorPaginator(
        perPage,
        cursorDataOrNull,
        sortableColumns,
        total,
        hasMorePages,
        ...(items ?? [])
      )
    : new CursorPaginator(
        perPage,
        cursorDataOrNull,
        sortableColumns,
        total,
        hasMorePages,
        ...(items ?? [])
      )

  if (isModelQuery) {
    paginator.namingStrategy =
      this.model.namingStrategy instanceof SnakeCaseNamingStrategy
        ? new CursorSnakeCaseNamingStrategy()
        : new CursorCamelCaseNamingStrategy()
  }

  if (isModelQuery && isFetchCall) {
    await this.model.$hooks.runner('after:paginate').run(paginator)
    await this.model.$hooks.runner('after:fetch').run(items)
  }

  return paginator
}

/**
 * Register the cursor pagination macro on query builders
 */
export function registerCursorPaginationMacro() {
  DatabaseQueryBuilder.macro('cursorPaginate', cursorPaginateMacroFn as any)
  ModelQueryBuilder.macro('cursorPaginate', cursorPaginateMacroFn as any)
}
