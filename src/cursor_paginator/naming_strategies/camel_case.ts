/*
 * @mixxtor/adonisjs-lucid-cursor
 *
 * (c) Mixxtor Radcliffe <mixxtor@gmail.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import type { CursorPaginatorMetaKeys } from '../types.js'

export class CursorCamelCaseNamingStrategy {
  /**
   * Keys for the pagination meta
   */
  paginationMetaKeys(): CursorPaginatorMetaKeys {
    return {
      total: 'total',
      perPage: 'perPage',
      currentPage: 'currentPage',

      lastPage: 'lastPage', // not used in the cursor paginator
      firstPage: 'firstPage', // not used in the cursor paginator
      firstPageUrl: 'firstPageUrl', // not used in the cursor paginator
      lastPageUrl: 'lastPageUrl', // not used in the cursor paginator

      nextCursor: 'nextCursor', // new in the cursor paginator
      previousCursor: 'previousCursor', // new in the cursor paginator

      nextPageUrl: 'nextPageUrl',
      previousPageUrl: 'previousPageUrl',
    }
  }
}
