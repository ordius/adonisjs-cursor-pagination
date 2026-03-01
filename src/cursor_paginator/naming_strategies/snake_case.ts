/*
 * @mixxtor/adonisjs-lucid-cursor
 *
 * (c) Mixxtor Radcliffe <mixxtor@gmail.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import type { CursorPaginatorMetaKeys } from '../types.js'

export class CursorSnakeCaseNamingStrategy {
  /**
   * Keys for the pagination meta
   */
  paginationMetaKeys(): CursorPaginatorMetaKeys {
    return {
      total: 'total',
      perPage: 'per_page',
      currentPage: 'current_page',

      lastPage: 'last_page', // not used in the cursor paginator
      firstPage: 'first_page', // not used in the cursor paginator
      firstPageUrl: 'first_page_url', // not used in the cursor paginator
      lastPageUrl: 'last_page_url', // not used in the cursor paginator

      nextCursor: 'next_cursor', // new in the cursor paginator
      previousCursor: 'previous_cursor', // new in the cursor paginator

      nextPageUrl: 'next_page_url',
      previousPageUrl: 'previous_page_url',
    }
  }
}
