/*
 * @ordius/adonisjs-cursor-pagination
 *
 * (c) Mixxtor Radcliffe <mixxtor@gmail.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { Database } from '@adonisjs/lucid/database'
import { BaseModel } from '@adonisjs/lucid/orm'
import { Emitter } from '@adonisjs/core/events'
import pino from 'pino'
import { TestPost, TestTag, TestUser } from './models.js'
import { registerCursorPaginationMacro } from '../../src/cursor_paginator/macro.js'

/**
 * Database configuration for tests
 */
export function getDatabaseConfig() {
  const connectionUrl = process.env.PG_TEST_DATABASE_URL
  if (!connectionUrl) {
    throw new Error('PG_TEST_DATABASE_URL environment variable is not set')
  }

  return {
    connection: 'pg',
    connections: {
      pg: {
        client: 'pg' as const,
        connection: connectionUrl,
        migrations: {
          naturalSort: true,
        },
        debug: false,
      },
    },
  }
}

/**
 * Creates and configures the database instance for tests
 */
export async function createDatabase(): Promise<Database> {
  const config = getDatabaseConfig()

  // Create a simple pino logger for tests
  const logger = pino({ level: 'silent' })

  // Create an emitter
  const emitter = new Emitter<any>(undefined as any)

  const db = new Database(
    {
      connection: config.connection,
      connections: config.connections,
    },
    logger as any,
    emitter
  )

  // Attach database to BaseModel
  BaseModel.useAdapter(db.modelAdapter())

  // Register the cursor pagination macro
  registerCursorPaginationMacro()

  return db
}

/**
 * Creates the test tables
 */
export async function createTables(db: Database) {
  const knex = db.connection().getWriteClient()

  // Create test_posts table
  const hasPostsTable = await knex.schema.hasTable('test_posts')
  if (!hasPostsTable) {
    await knex.schema.createTable('test_posts', (table) => {
      table.increments('id').primary()
      table.string('title').notNullable()
      table.text('content').nullable()
      table.integer('views').defaultTo(0)
      table.timestamps(true, true) // created_at and updated_at with default now
    })
  }

  // Create test_users table
  const hasUsersTable = await knex.schema.hasTable('test_users')
  if (!hasUsersTable) {
    await knex.schema.createTable('test_users', (table) => {
      table.increments('id').primary()
      table.string('name').notNullable()
      table.string('email').unique().notNullable()
      table.timestamps(true, true)
    })
  }

  // Create test_tags table
  const hasTagsTable = await knex.schema.hasTable('test_tags')
  if (!hasTagsTable) {
    await knex.schema.createTable('test_tags', (table) => {
      table.increments('id').primary()
      table.string('name').notNullable()
      table.timestamps(true, true)
    })
  }

  // Create test_post_tags pivot table (ManyToMany)
  const hasPivotTable = await knex.schema.hasTable('test_post_tags')
  if (!hasPivotTable) {
    await knex.schema.createTable('test_post_tags', (table) => {
      table
        .integer('tag_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('test_tags')
        .onDelete('CASCADE')
      table
        .integer('post_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('test_posts')
        .onDelete('CASCADE')
      table.string('note').nullable()
      table.timestamps(true, true)
      table.primary(['tag_id', 'post_id'])
    })
  }
}

/**
 * Drops the test tables
 */
export async function dropTables(db: Database) {
  const knex = db.connection().getWriteClient()
  await knex.schema.dropTableIfExists('test_post_tags')
  await knex.schema.dropTableIfExists('test_tags')
  await knex.schema.dropTableIfExists('test_posts')
  await knex.schema.dropTableIfExists('test_users')
}

/**
 * Seeds the test database with sample data
 */
export async function seedDatabase(db: Database, count: number = 25) {
  // Clear existing data
  await db.from('test_posts').delete()

  // Insert test posts
  const posts = Array.from({ length: count }, (_, i) => ({
    title: `Post ${i + 1}`,
    content: `Content for post ${i + 1}`,
    views: Math.floor(Math.random() * 1000),
    created_at: new Date(Date.now() - (count - i) * 60000), // Spread across time
    updated_at: new Date(Date.now() - (count - i) * 60000),
  }))

  await db.table('test_posts').multiInsert(posts)
}

/**
 * Returns the test models bound to the database
 */
export function getTestModels() {
  return { TestPost, TestTag, TestUser }
}

/**
 * Seeds ManyToMany data: creates tags and associates them with posts via pivot table
 */
export async function seedManyToManyData(db: Database) {
  await db.from('test_post_tags').delete()
  await db.from('test_tags').delete()
  await db.from('test_posts').delete()

  // Create 25 posts with staggered timestamps
  const posts = Array.from({ length: 25 }, (_, i) => ({
    title: `Post ${i + 1}`,
    content: `Content for post ${i + 1}`,
    views: Math.floor(Math.random() * 1000),
    created_at: new Date(Date.now() - (25 - i) * 60000),
    updated_at: new Date(Date.now() - (25 - i) * 60000),
  }))
  await db.table('test_posts').multiInsert(posts)

  // Create 3 tags
  const tags = [
    { name: 'javascript', created_at: new Date(), updated_at: new Date() },
    { name: 'typescript', created_at: new Date(), updated_at: new Date() },
    { name: 'python', created_at: new Date(), updated_at: new Date() },
  ]
  await db.table('test_tags').multiInsert(tags)

  // Get actual IDs
  const insertedPosts = await db.from('test_posts').select('id').orderBy('id', 'asc')
  const insertedTags = await db.from('test_tags').select('id').orderBy('id', 'asc')

  // Associate tag 1 ("javascript") with 15 posts
  const pivotRows = insertedPosts.slice(0, 15).map((post, i) => ({
    tag_id: insertedTags[0].id,
    post_id: post.id,
    note: `note-${i}`,
    created_at: new Date(Date.now() - (15 - i) * 60000),
    updated_at: new Date(Date.now() - (15 - i) * 60000),
  }))

  // Associate tag 2 ("typescript") with 8 posts (overlapping with tag 1)
  const pivotRows2 = insertedPosts.slice(5, 13).map((post, i) => ({
    tag_id: insertedTags[1].id,
    post_id: post.id,
    note: `ts-note-${i}`,
    created_at: new Date(Date.now() - (8 - i) * 60000),
    updated_at: new Date(Date.now() - (8 - i) * 60000),
  }))

  await db.table('test_post_tags').multiInsert([...pivotRows, ...pivotRows2])
}

/**
 * Cleanup function to close the database connection
 */
export async function cleanupDatabase(db: Database) {
  await db.manager.closeAll()
}
