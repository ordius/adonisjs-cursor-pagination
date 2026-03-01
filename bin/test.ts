/*
 * @mixxtor/adonisjs-lucid-cursor
 *
 * (c) Mixxtor Radcliffe <mixxtor@gmail.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import 'dotenv/config'
import { assert } from '@japa/assert'
import { configure, processCLIArgs, run } from '@japa/runner'

processCLIArgs(process.argv.slice(2))

configure({
  files: ['tests/**/*.spec.ts'],
  plugins: [assert()],
})

run()
