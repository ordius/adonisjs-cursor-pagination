/*
 * @ordius/adonisjs-cursor-pagination
 *
 * (c) Mixxtor Radcliffe <mixxtor@gmail.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { BaseModel, column, manyToMany } from '@adonisjs/lucid/orm'
import type { ManyToMany } from '@adonisjs/lucid/types/relations'
import { type DateTime } from 'luxon'

/**
 * Test model for cursor pagination tests
 */
export class TestPost extends BaseModel {
  static table = 'test_posts'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare title: string

  @column()
  declare content: string

  @column()
  declare views: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}

/**
 * Test Tag model for ManyToMany relation tests
 */
export class TestTag extends BaseModel {
  static table = 'test_tags'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @manyToMany(() => TestPost, {
    pivotTable: 'test_post_tags',
    localKey: 'id',
    pivotForeignKey: 'tag_id',
    pivotRelatedForeignKey: 'post_id',
    pivotColumns: ['note'],
    pivotTimestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  })
  declare posts: ManyToMany<typeof TestPost>
}

/**
 * Test User model for relation tests
 */
export class TestUser extends BaseModel {
  static table = 'test_users'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column()
  declare email: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
