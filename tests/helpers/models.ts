/*
 * @mixxtor/adonisjs-lucid-cursor
 *
 * (c) Mixxtor Radcliffe <mixxtor@gmail.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { BaseModel, column } from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'

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
