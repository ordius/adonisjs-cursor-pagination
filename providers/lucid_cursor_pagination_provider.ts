import { ApplicationService } from '@adonisjs/core/types'
import { registerCursorPaginationMacro } from '../src/cursor_paginator/macro.js'

export default class LucidCursorPaginationProvider {
  constructor(protected app: ApplicationService) {}

  register() {}

  async boot() {
    /**
     * Register the cursorPaginate macro on DatabaseQueryBuilder and ModelQueryBuilder
     */
    registerCursorPaginationMacro()
  }

  async start() {}

  async ready() {}

  async shutdown() {}
}
