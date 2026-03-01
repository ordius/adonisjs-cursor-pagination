/*
 * @mixxtor/adonisjs-lucid-cursor
 *
 * (c) Mixxtor Radcliffe <mixxtor@gmail.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import type {
  CherryPick,
  LucidModel,
  LucidRow,
  ModelAttributes,
  ModelObject,
} from '@adonisjs/lucid/types/model'

/**
 * The keys for the cursor paginator meta data
 */
export type CursorPaginatorMetaKeys = {
  total: string
  perPage: string
  currentPage: string

  lastPage?: string
  firstPage?: string
  firstPageUrl?: string
  lastPageUrl?: string

  nextCursor: string
  previousCursor: string

  nextPageUrl: string
  previousPageUrl: string
}

/**
 * Naming strategy interface for cursor pagination
 */
export interface CursorPaginatorNamingStrategy {
  paginationMetaKeys(): CursorPaginatorMetaKeys
}

/**
 * Cursor pagination meta data structure
 */
export interface CursorPaginatorMeta {
  [key: string]: number | string | null | undefined
}

/**
 * Contract for the cursor paginator
 */
export interface CursorPaginatorContract<Result> extends Array<Result> {
  all(): Result[]
  items(): Result[]
  readonly perPage: number
  readonly currentPage: string | undefined | null
  readonly hasPages: boolean
  readonly hasMorePages: boolean
  readonly isEmpty: boolean
  readonly total: number
  readonly hasTotal: boolean
  namingStrategy: CursorPaginatorNamingStrategy
  baseUrl(url: string): this
  queryString(values: Record<string, string>): this
  getUrl(cursor: string): string
  getMeta(): CursorPaginatorMeta
  getNextCursor(): string | undefined | null
  getPreviousCursor(): string | undefined | null
  getNextPageUrl(): string | null
  getPreviousPageUrl(): string | null
  toJSON(): {
    meta: CursorPaginatorMeta
    data: Result[]
  }
}

/**
 * Contract for the model cursor paginator with serialization support
 */
export interface ModelCursorPaginatorContract<Result extends LucidRow> extends Omit<
  CursorPaginatorContract<Result>,
  'toJSON'
> {
  serialize(cherryPick?: CherryPick): {
    meta: CursorPaginatorMeta
    data: ModelObject[]
  }
  toJSON(): {
    meta: CursorPaginatorMeta
    data: ModelObject[]
  }
}

/**
 * Sortable columns configuration with type-safe column names
 */
export type TSortableColumns<M extends LucidRow = LucidRow> = {
  [key in keyof ModelAttributes<M>]?: 'asc' | 'desc'
}

/**
 * Cursor data structure
 * Note: `data` stores the actual column values for cursor comparison, not column names
 */
export type TCursorData<M extends LucidRow = LucidRow> = {
  data: ModelAttributes<M>[keyof ModelAttributes<M>][]
  point_to_next: boolean
}

/**
 * Options for cursor pagination
 */
export type TCursorPaginateOptions<
  Result extends InstanceType<LucidModel> = InstanceType<LucidModel>,
> = {
  /**
   * The orderable column to order by.
   *
   * NOTE: the original orderBy (builder) will be overridden by this option.
   * @default `model.primaryKey`.
   */
  orderByColumns?: TSortableColumns<Result>

  /**
   * Indicates if you want to fetch the total number of records.
   * @default true
   */
  fetchTotal?: boolean
}
