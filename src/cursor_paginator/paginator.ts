/*
 * @ordius/adonisjs-cursor-pagination
 *
 * (c) Mixxtor Radcliffe <mixxtor@gmail.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import type {
  CherryPick,
  LucidRow,
  ModelAttributes,
  ModelObject,
} from '@adonisjs/lucid/types/model'
import type {
  CursorPaginatorContract,
  CursorPaginatorMeta,
  CursorPaginatorNamingStrategy,
  ModelCursorPaginatorContract,
  TCursorData,
} from './types.js'
import { CursorCamelCaseNamingStrategy } from './naming_strategies/camel_case.js'

/**
 * Internal sortable columns type for runtime operations
 */
type SortableColumnsInternal<Result extends LucidRow = LucidRow> = Record<
  NonNullable<keyof ModelAttributes<Result>>,
  'asc' | 'desc' | undefined
>

/**
 * Cursor paginator works with the data set provided by the cursor-based
 * pagination.
 */
export class CursorPaginator<Result extends LucidRow = LucidRow>
  extends Array
  implements CursorPaginatorContract<Result>
{
  private qs: Record<string, any> = {}
  private url: string = '/'
  private rows: Result[]

  /**
   * Naming strategy for the pagination meta keys
   */
  static namingStrategy: CursorPaginatorNamingStrategy = new CursorCamelCaseNamingStrategy()

  /**
   * Can be defined at per instance level as well
   */
  namingStrategy: CursorPaginatorNamingStrategy = CursorPaginator.namingStrategy

  /**
   * Find if results set is empty or not
   */
  readonly isEmpty: boolean

  /**
   * Casting `total` to a number. Later, we can think of situations
   * to cast it to a bigint
   */
  readonly total: number

  /**
   * Find if there are total records or not. This is not same as `isEmpty`.
   *
   * The `isEmpty` reports about the current set of results. However `hasTotal`
   * reports about the total number of records, regardless of the current.
   */
  readonly hasTotal: boolean

  /**
   * Find if there are enough results to be paginated or not
   */
  public hasPages: boolean

  /**
   * The current page
   */
  public currentPage: string | undefined | null

  /**
   * The next cursor
   */
  #nextCursor: string | undefined | null

  /**
   * The previous cursor
   */
  #previousCursor: string | undefined | null

  /**
   * Constructs a new instance of the class.
   *
   * @param {number} perPage - The number of items per page.
   * @param {string | undefined | null} currentCursor - The cursor for pagination.
   * @param {object} orderByColumns - The object containing the sortable columns.
   * @param {boolean} totalNumber - The fetched total number of items.
   * @param {boolean} hasMorePages - Whether there are more pages.
   */
  constructor(
    public perPage: number,
    private currentCursor: TCursorData | undefined | null,
    private orderByColumns: SortableColumnsInternal<Result>,
    private totalNumber: number | undefined,

    /**
     * Find if there are more pages to come
     */
    public hasMorePages: boolean,
    ...rows: (Result & ModelAttributes<Result>)[]
  ) {
    super(...(rows as any))
    this.rows = rows ?? []
    this.isEmpty = this.rows.length === 0
    this.total = Number(this.totalNumber)
    this.hasTotal = this.total > 0
    this.currentPage = currentCursor
      ? Buffer.from(JSON.stringify(currentCursor)).toString('base64')
      : null
    this.#setCursor(this.orderByColumns, currentCursor)
    this.hasPages = !!this.total
  }

  /**
   * Set the next and previous cursor
   * @param orderByColumns
   * @param currentCursor
   * @returns void
   */
  #setCursor(
    orderByColumns: SortableColumnsInternal<Result>,
    currentCursor: TCursorData | null | undefined
  ) {
    if (!this.hasMorePages) {
      if (!currentCursor) {
        // not reach <limit> item for the first call
        this.#nextCursor = null
        this.#previousCursor = null
      } else if (currentCursor && currentCursor.point_to_next) {
        // not reach the <limit> when get with a next cursor
        this.#nextCursor = null
        this.#previousCursor = this.#genCursor(orderByColumns, this.rows[0], false)
      } else if (currentCursor && !currentCursor.point_to_next) {
        // not reach the <limit> when get with a prev cursor
        // this.rows.reverse() // (should) already reversed before init this class
        this.#nextCursor = this.#genCursor(orderByColumns, this.rows[this.rows.length - 1], true)
        this.#previousCursor = null
      }
    } else {
      this.#nextCursor = this.#genCursor(orderByColumns, this.rows[this.rows.length - 1], true)
      this.#previousCursor = currentCursor
        ? this.#genCursor(orderByColumns, this.rows[0], false)
        : null
    }
  }

  #genCursor(
    columns: SortableColumnsInternal<Result>,
    item: Result,
    pointToNext: boolean = false
  ): string | null {
    if (!item) {
      return null
    }

    const cursor: TCursorData = {
      data: Object.keys(columns).map((column) => {
        // Try direct property access (works for model attributes via getter)
        let value = item[column as keyof Result]

        // Fallback: check $attributes (Lucid model internal store)
        if (value === undefined && item.$attributes) {
          value = item.$attributes[column]
        }

        // Fallback: check $extras (pivot columns, computed columns)
        if (value === undefined && item.$extras) {
          value = item.$extras[column]
        }
        return value
      }),
      point_to_next: pointToNext,
    }
    return Buffer.from(JSON.stringify(cursor)).toString('base64')
  }

  /**
   * A reference to the result rows
   */
  all() {
    return this.rows
  }

  /**
   * A reference to the result rows
   */
  items() {
    return this.rows
  }

  /**
   * Returns JSON meta data
   */
  getMeta(): CursorPaginatorMeta {
    const metaKeys = this.namingStrategy.paginationMetaKeys()

    return {
      [metaKeys.total]: this.total,
      [metaKeys.perPage]: this.perPage,
      [metaKeys.nextCursor]: this.#nextCursor,
      [metaKeys.previousCursor]: this.#previousCursor,
      [metaKeys.nextPageUrl]: this.getNextPageUrl(),
      [metaKeys.previousPageUrl]: this.getPreviousPageUrl(),
    }
  }

  transform(
    callbackfn: (value: (typeof this.rows)[number], index?: number, array?: typeof this.rows) => any
  ) {
    this.rows = this.rows.map(callbackfn)
    return this
  }

  /**
   * Returns JSON representation of the paginated data
   */
  toJSON() {
    return {
      meta: this.getMeta(),
      data: this.items(),
    }
  }

  /**
   * Define query string to be appended to the pagination links
   */
  queryString(values: Record<string, any>): this {
    this.qs = values
    return this
  }

  /**
   * Define base url for making the pagination links
   */
  baseUrl(url: string): this {
    this.url = url
    return this
  }

  /**
   * Returns url for a given page. Doesn't validates the integrity of the page
   */
  getUrl(cursor: string): string {
    const qs = new URLSearchParams(
      Object.assign({}, this.qs, { cursor: cursor ?? this.currentCursor?.data })
    ).toString()
    return `${this.url}?${qs}`
  }

  /**
   * Returns the next cursor value based on the last row of the current set
   * of rows
   */
  getNextCursor() {
    return this.#nextCursor
  }

  /**
   * Returns the previous cursor value based on the first row of the current
   * set of rows
   */
  getPreviousCursor() {
    return this.#previousCursor
  }

  /**
   * Returns url for the next page
   */
  getNextPageUrl(): string | null {
    const cursor = this.getNextCursor()
    if (cursor) {
      return this.getUrl(cursor)
    }

    return null
  }

  /**
   * Returns URL for the previous page
   */
  getPreviousPageUrl(): string | null {
    const cursor = this.getPreviousCursor()
    if (cursor) {
      return this.getUrl(cursor)
    }

    return null
  }
}

/**
 * Model cursor paginator with serialization support
 */
export class ModelCursorPaginator<Result extends LucidRow>
  extends CursorPaginator<Result>
  implements ModelCursorPaginatorContract<Result>
{
  /**
   * Serialize models
   */
  serialize(cherryPick?: CherryPick): { meta: CursorPaginatorMeta; data: ModelObject[] } {
    return {
      meta: this.getMeta(),
      data: this.items().map((row) => row.serialize(cherryPick)),
    }
  }
}
