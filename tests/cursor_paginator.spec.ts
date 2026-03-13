/*
 * @mixxtor/adonisjs-cursor-pagination
 *
 * (c) Mixxtor Radcliffe <mixxtor@gmail.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { test } from '@japa/runner'
import { type Database } from '@adonisjs/lucid/database'
import {
  createDatabase,
  createTables,
  dropTables,
  seedDatabase,
  cleanupDatabase,
  getTestModels,
} from './helpers/setup.js'
import { CursorPaginator, ModelCursorPaginator } from '../src/cursor_paginator/paginator.js'

let db: Database

test.group('Cursor Paginator', (group) => {
  group.setup(async () => {
    db = await createDatabase()
    await createTables(db)
    await seedDatabase(db, 25) // Seed with 25 posts
  })

  group.teardown(async () => {
    await dropTables(db)
    await cleanupDatabase(db)
  })

  test('should paginate model query results using cursor', async ({ assert }) => {
    const { TestPost } = getTestModels()

    // First page
    const firstPage = await TestPost.query().orderBy('id', 'asc').cursorPaginate(5)

    assert.instanceOf(firstPage, ModelCursorPaginator)
    assert.equal(firstPage.items().length, 5)
    assert.equal(firstPage.perPage, 5)
    assert.isTrue(firstPage.hasMorePages)
    assert.isNotNull(firstPage.getNextCursor())
    assert.isNull(firstPage.getPreviousCursor())
    assert.equal(firstPage.total, 25)
  })

  test('should navigate to next page using cursor', async ({ assert }) => {
    const { TestPost } = getTestModels()

    // First page
    const firstPage = await TestPost.query().orderBy('id', 'asc').cursorPaginate(5)
    const nextCursor = firstPage.getNextCursor()

    assert.isNotNull(nextCursor)

    // Second page using cursor
    const secondPage = await TestPost.query().orderBy('id', 'asc').cursorPaginate(5, nextCursor)

    assert.equal(secondPage.items().length, 5)
    assert.isTrue(secondPage.hasMorePages)
    assert.isNotNull(secondPage.getNextCursor())
    assert.isNotNull(secondPage.getPreviousCursor())

    // Items should be different - second page starts after first page
    const firstPageIds = firstPage.items().map((p) => p.id)
    const secondPageIds = secondPage.items().map((p) => p.id)

    // Ensure no overlap
    for (const id of secondPageIds) {
      assert.notInclude(firstPageIds, id)
    }

    // IDs should be greater than first page
    const maxFirstPageId = Math.max(...firstPageIds)
    const minSecondPageId = Math.min(...secondPageIds)
    assert.isAbove(minSecondPageId, maxFirstPageId)
  })

  test('should navigate backwards using previous cursor', async ({ assert }) => {
    const { TestPost } = getTestModels()

    // Get first and second pages
    const firstPage = await TestPost.query().orderBy('id', 'asc').cursorPaginate(5)
    const secondPage = await TestPost.query()
      .orderBy('id', 'asc')
      .cursorPaginate(5, firstPage.getNextCursor())

    const prevCursor = secondPage.getPreviousCursor()
    assert.isNotNull(prevCursor)

    // Navigate back to first page
    const backToFirst = await TestPost.query().orderBy('id', 'asc').cursorPaginate(5, prevCursor)

    // Should return the same items as first page
    const firstPageIds = firstPage.items().map((p) => p.id)
    const backToFirstIds = backToFirst.items().map((p) => p.id)

    assert.deepEqual(firstPageIds, backToFirstIds)
  })

  test('should work with descending order', async ({ assert }) => {
    const { TestPost } = getTestModels()

    const page = await TestPost.query().orderBy('id', 'desc').cursorPaginate(5)

    assert.equal(page.items().length, 5)

    // IDs should be in descending order
    const ids = page.items().map((p) => p.id)
    for (let i = 1; i < ids.length; i++) {
      assert.isAbove(ids[i - 1], ids[i])
    }
  })

  test('should work with multiple order by columns', async ({ assert }) => {
    const { TestPost } = getTestModels()

    const page = await TestPost.query()
      .orderBy('views', 'asc')
      .orderBy('id', 'asc')
      .cursorPaginate(5)

    assert.equal(page.items().length, 5)
    assert.isNotNull(page.getNextCursor())
  })

  test('should return correct JSON structure', async ({ assert }) => {
    const { TestPost } = getTestModels()

    const page = await TestPost.query().orderBy('id', 'asc').cursorPaginate(5)
    const json = page.toJSON()

    assert.property(json, 'meta')
    assert.property(json, 'data')
    assert.property(json.meta, 'total')
    assert.property(json.meta, 'perPage')
    assert.property(json.meta, 'nextCursor')
    assert.property(json.meta, 'previousCursor')
    assert.property(json.meta, 'nextPageUrl')
    assert.property(json.meta, 'previousPageUrl')
    assert.isArray(json.data)
    assert.equal(json.data.length, 5)
  })

  test('should serialize model results', async ({ assert }) => {
    const { TestPost } = getTestModels()

    const page = await TestPost.query().orderBy('id', 'asc').cursorPaginate(5)
    const serialized = page.serialize!()

    assert.property(serialized, 'meta')
    assert.property(serialized, 'data')
    assert.isArray(serialized.data)
    assert.equal(serialized.data.length, 5)

    // Each item should be a plain object (serialized)
    for (const item of serialized.data) {
      assert.property(item, 'id')
      assert.property(item, 'title')
    }
  })

  test('should set base URL for pagination links', async ({ assert }) => {
    const { TestPost } = getTestModels()

    const page = await TestPost.query().orderBy('id', 'asc').cursorPaginate(5)

    page.baseUrl('/api/posts')

    const nextUrl = page.getNextPageUrl()
    assert.isNotNull(nextUrl)
    assert.isTrue(nextUrl!.startsWith('/api/posts?'))
  })

  test('should append query string to pagination links', async ({ assert }) => {
    const { TestPost } = getTestModels()

    const page = await TestPost.query().orderBy('id', 'asc').cursorPaginate(5)

    page.baseUrl('/api/posts').queryString({ sort: 'id', order: 'asc' })

    const nextUrl = page.getNextPageUrl()
    assert.isNotNull(nextUrl)
    assert.include(nextUrl!, 'sort=id')
    assert.include(nextUrl!, 'order=asc')
  })

  test('should handle last page correctly', async ({ assert }) => {
    const { TestPost } = getTestModels()

    // Navigate to get close to the end
    let page = await TestPost.query().orderBy('id', 'asc').cursorPaginate(10)

    // Second batch
    page = await TestPost.query().orderBy('id', 'asc').cursorPaginate(10, page.getNextCursor())

    // Third batch (should be last with 5 items)
    page = await TestPost.query().orderBy('id', 'asc').cursorPaginate(10, page.getNextCursor())

    assert.equal(page.items().length, 5)
    assert.isFalse(page.hasMorePages)
    assert.isNull(page.getNextCursor())
    assert.isNotNull(page.getPreviousCursor())
  })

  test('should handle empty results', async ({ assert }) => {
    const { TestPost } = getTestModels()

    const page = await TestPost.query().where('id', '<', 0).cursorPaginate(5)

    assert.isTrue(page.isEmpty)
    assert.equal(page.items().length, 0)
    assert.isNull(page.getNextCursor())
    assert.isNull(page.getPreviousCursor())
    assert.isFalse(page.hasMorePages)
  })

  test('should work with database query builder', async ({ assert }) => {
    const page = await db.from('test_posts').orderBy('id', 'asc').cursorPaginate(5)

    assert.instanceOf(page, CursorPaginator)
    assert.equal(page.items().length, 5)
    assert.isTrue(page.hasMorePages)
  })

  test('should work without fetching total', async ({ assert }) => {
    const { TestPost } = getTestModels()

    const page = await TestPost.query()
      .orderBy('id', 'asc')
      .cursorPaginate(5, null, { withTotal: false })

    assert.equal(page.items().length, 5)
    assert.isNaN(page.total)
    assert.isFalse(page.hasTotal)
  })

  test('should use custom order by columns from options', async ({ assert }) => {
    const { TestPost } = getTestModels()

    const page = await TestPost.query().cursorPaginate(5, null, {
      orderBy: { views: 'desc', id: 'asc' },
    })

    assert.equal(page.items().length, 5)
    assert.isNotNull(page.getNextCursor())
  })

  test('items() and all() should return the same results', async ({ assert }) => {
    const { TestPost } = getTestModels()

    const page = await TestPost.query().orderBy('id', 'asc').cursorPaginate(5)

    assert.deepEqual(page.items(), page.all())
  })

  test('should implement array-like behavior', async ({ assert }) => {
    const { TestPost } = getTestModels()

    const page = await TestPost.query().orderBy('id', 'asc').cursorPaginate(5)

    // Should have array length
    assert.equal(page.length, 5)

    // Should be iterable (spread into array to verify)
    const iteratedItems = [...page]
    assert.equal(iteratedItems.length, 5)
  })
})

test.group('Cursor Paginator - Edge Cases', (group) => {
  group.setup(async () => {
    db = await createDatabase()
    await createTables(db)
  })

  group.teardown(async () => {
    await dropTables(db)
    await cleanupDatabase(db)
  })

  test('should handle exactly perPage number of items', async ({ assert }) => {
    await db.from('test_posts').delete()
    await seedDatabase(db, 5)

    const { TestPost } = getTestModels()

    const page = await TestPost.query().orderBy('id', 'asc').cursorPaginate(5)

    assert.equal(page.items().length, 5)
    assert.isFalse(page.hasMorePages)
    assert.isNull(page.getNextCursor())
  })

  test('should handle perPage + 1 items', async ({ assert }) => {
    await db.from('test_posts').delete()
    await seedDatabase(db, 6)

    const { TestPost } = getTestModels()

    const page = await TestPost.query().orderBy('id', 'asc').cursorPaginate(5)

    assert.equal(page.items().length, 5)
    assert.isTrue(page.hasMorePages)
    assert.isNotNull(page.getNextCursor())
  })

  test('should handle single item', async ({ assert }) => {
    await db.from('test_posts').delete()
    await seedDatabase(db, 1)

    const { TestPost } = getTestModels()

    const page = await TestPost.query().orderBy('id', 'asc').cursorPaginate(5)

    assert.equal(page.items().length, 1)
    assert.isFalse(page.hasMorePages)
    assert.isNull(page.getNextCursor())
  })
})

test.group('Cursor Paginator - Object-based API', (group) => {
  group.setup(async () => {
    db = await createDatabase()
    await createTables(db)
    await seedDatabase(db, 25)
  })

  group.teardown(async () => {
    await dropTables(db)
    await cleanupDatabase(db)
  })

  test('should paginate using object-based parameters', async ({ assert }) => {
    const { TestPost } = getTestModels()

    const page = await TestPost.query().cursorPaginate({ perPage: 5 })

    assert.instanceOf(page, ModelCursorPaginator)
    assert.equal(page.items().length, 5)
    assert.equal(page.perPage, 5)
    assert.isTrue(page.hasMorePages)
    assert.equal(page.total, 25)
  })

  test('should navigate pages using object-based cursor', async ({ assert }) => {
    const { TestPost } = getTestModels()

    const firstPage = await TestPost.query().cursorPaginate({
      perPage: 5,
      orderBy: { id: 'asc' },
    })

    const nextCursor = firstPage.getNextCursor()
    assert.isNotNull(nextCursor)

    const secondPage = await TestPost.query().cursorPaginate({
      perPage: 5,
      cursor: nextCursor,
      orderBy: { id: 'asc' },
    })

    assert.equal(secondPage.items().length, 5)
    assert.isNotNull(secondPage.getPreviousCursor())

    // Items should be different
    const firstIds = firstPage.items().map((p) => p.id)
    const secondIds = secondPage.items().map((p) => p.id)
    for (const id of secondIds) {
      assert.notInclude(firstIds, id)
    }
  })

  test('should skip total count using object-based withTotal', async ({ assert }) => {
    const { TestPost } = getTestModels()

    const page = await TestPost.query().cursorPaginate({
      perPage: 5,
      withTotal: false,
      orderBy: { id: 'asc' },
    })

    assert.equal(page.items().length, 5)
    assert.isNaN(page.total)
    assert.isFalse(page.hasTotal)
  })

  test('should work with database query builder using object-based API', async ({ assert }) => {
    const page = await db.from('test_posts').cursorPaginate({
      perPage: 5,
      orderBy: { id: 'asc' },
    })

    assert.instanceOf(page, CursorPaginator)
    assert.equal(page.items().length, 5)
    assert.isTrue(page.hasMorePages)
  })

  test('should use default perPage when not provided', async ({ assert }) => {
    const { TestPost } = getTestModels()

    const page = await TestPost.query().cursorPaginate({})

    // Default perPage is 10
    assert.equal(page.perPage, 10)
    assert.equal(page.items().length, 10)
  })
})
