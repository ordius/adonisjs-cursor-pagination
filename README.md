# @ordius/adonisjs-cursor-pagination

![npm](https://img.shields.io/npm/v/@ordius/adonisjs-cursor-pagination)
![license](https://img.shields.io/npm/l/@ordius/adonisjs-cursor-pagination)
![downloads](https://img.shields.io/npm/dm/@ordius/adonisjs-cursor-pagination)

Cursor-based pagination for AdonisJS v6 powered by Lucid ORM.

Provides stable, performant pagination for large datasets with full support for Models and Database query builders.

## Features

- 🚀 High-performance cursor pagination
- 🔁 Forward & backward navigation
- 🧱 Works with Model & Database query builders
- 🔗 Built-in URL generation
- 🧮 Optional total count fetching
- 🧵 Fully typed (TypeScript)

## Why cursor pagination?

Offset pagination has performance issues on large datasets. Cursor pagination provides stable and efficient pagination without skipping or duplicating records.

```typescript
// Offset (slow on large tables)
User.query().paginate(1, 10)

// Cursor (fast)
User.query().cursorPaginate({ perPage: 10 })
```

## When to use offset pagination instead?

If you need:

- Random page access (e.g. go to page 42)
- SEO-friendly numbered pagination

Offset pagination might be more suitable.

## Requirements

- AdonisJS v6
- Lucid v21+
- Node.js >= 20.11.0

## Installation

```bash
npm install @ordius/adonisjs-cursor-pagination
```

## Setup

Configure the package using the ace command:

```bash
node ace configure @ordius/adonisjs-cursor-pagination
```

This will automatically register the provider in your `adonisrc.ts`:

```typescript
// adonisrc.ts
export default defineConfig({
  providers: [
    // ... other providers
    () => import('@ordius/adonisjs-cursor-pagination/provider'),
  ],
})
```

## Usage

### Basic Cursor Pagination

```typescript
import User from '#models/user'

// First page (recommended object-based API)
const firstPage = await User.query().orderBy('id', 'asc').cursorPaginate({ perPage: 10 })

// Get next page using cursor
const nextCursor = firstPage.getNextCursor()
const secondPage = await User.query()
  .orderBy('id', 'asc')
  .cursorPaginate({ perPage: 10, cursor: nextCursor })

// Navigate backwards
const prevCursor = secondPage.getPreviousCursor()
const backToFirst = await User.query()
  .orderBy('id', 'asc')
  .cursorPaginate({ perPage: 10, cursor: prevCursor })
```

### API Response

The paginator returns a structured response suitable for API endpoints:

```typescript
const posts = await Post.query().orderBy('created_at', 'desc').cursorPaginate({ perPage: 10 })

// Get JSON response with meta information
const response = posts.toJSON()
// or serialize model data
const serialized = posts.serialize()
```

Response structure:

```json
{
  "meta": {
    "total": 100,
    "perPage": 10,
    "nextCursor": "eyJkYXRhIjpbMTBdLCJwb2ludF90b19uZXh0Ijp0cnVlfQ==",
    "previousCursor": null,
    "nextPageUrl": "/?cursor=eyJkYXRhIjpbMTBdLCJwb2ludF90b19uZXh0Ijp0cnVlfQ==",
    "previousPageUrl": null
  },
  "data": []
}
```

### Custom Order Columns

You can specify custom columns to order by:

```typescript
const posts = await Post.query().cursorPaginate({
  perPage: 10,
  orderBy: {
    views: 'desc',
    id: 'asc',
  },
})
```

### Without Total Count

For better performance on large datasets, skip fetching the total count:

```typescript
const posts = await Post.query().orderBy('id', 'asc').cursorPaginate({
  perPage: 10,
  withTotal: false,
})

// posts.total will be NaN
// posts.hasTotal will be false
```

### Database Query Builder

Works with raw database queries too:

```typescript
import db from '@adonisjs/lucid/services/db'

const results = await db.from('posts').orderBy('id', 'asc').cursorPaginate({ perPage: 10 })
```

### Setting Base URL and Query Strings

```typescript
const posts = await Post.query().orderBy('id', 'asc').cursorPaginate({ perPage: 10 })

posts.baseUrl('/api/posts').queryString({ sort: 'id', order: 'asc' })

// URLs will now include base URL and query params
// e.g., /api/posts?sort=id&order=asc&cursor=...
```

### Accessing Results

```typescript
const posts = await Post.query().orderBy('id', 'asc').cursorPaginate({ perPage: 10 })

// Get all items
posts.items() // or posts.all()

// Check pagination state
posts.isEmpty // true if no results
posts.hasMorePages // true if there's a next page
posts.hasPages // true if there are any results
posts.total // total count (if withTotal is true)
posts.perPage // items per page
```

### Array-like Behavior

The paginator extends Array, so you can iterate and use array methods:

```typescript
const posts = await Post.query().orderBy('id', 'asc').cursorPaginate({ perPage: 10 })

// Iterate
for (const post of posts) {
  console.log(post.title)
}

// Array length
console.log(posts.length)
```

## API Reference

### cursorPaginate(options) — Object-based (recommended)

```typescript
cursorPaginate({
  perPage?: number,          // default: 10
  cursor?: string | null,    // default: null (first page)
  orderBy?: Record<string, 'asc' | 'desc'>,
  withTotal?: boolean        // default: true
})
```

| Parameter   | Type             | Default                 | Description                                        |
| ----------- | ---------------- | ----------------------- | -------------------------------------------------- |
| `perPage`   | `number`         | `10`                    | Number of items per page                           |
| `cursor`    | `string \| null` | `null`                  | Cursor string for pagination (null for first page) |
| `orderBy`   | `object`         | `{ primaryKey: 'asc' }` | Columns to order by with direction                 |
| `withTotal` | `boolean`        | `true`                  | Include total count in response                    |

### cursorPaginate(perPage, cursor?, options?) — Positional (legacy)

```typescript
cursorPaginate(
  perPage: number,
  cursor?: string | null,
  options?: {
    orderBy?: Record<string, 'asc' | 'desc'>
    withTotal?: boolean
  }
)
```

Both signatures are supported for backward compatibility.

### Paginator Methods

| Method                   | Returns          | Description                       |
| ------------------------ | ---------------- | --------------------------------- |
| `items()`                | `Result[]`       | Get all items                     |
| `all()`                  | `Result[]`       | Alias for items()                 |
| `getNextCursor()`        | `string \| null` | Get cursor for next page          |
| `getPreviousCursor()`    | `string \| null` | Get cursor for previous page      |
| `getNextPageUrl()`       | `string \| null` | Get URL for next page             |
| `getPreviousPageUrl()`   | `string \| null` | Get URL for previous page         |
| `getMeta()`              | `object`         | Get pagination metadata           |
| `toJSON()`               | `object`         | Get JSON representation           |
| `serialize(cherryPick?)` | `object`         | Serialize model results           |
| `baseUrl(url)`           | `this`           | Set base URL for pagination links |
| `queryString(params)`    | `this`           | Set query string parameters       |

### Paginator Properties

| Property       | Type             | Description                      |
| -------------- | ---------------- | -------------------------------- |
| `isEmpty`      | `boolean`        | True if no results               |
| `total`        | `number`         | Total count (NaN if not fetched) |
| `hasTotal`     | `boolean`        | True if total is available       |
| `hasPages`     | `boolean`        | True if there are results        |
| `hasMorePages` | `boolean`        | True if there's a next page      |
| `perPage`      | `number`         | Items per page                   |
| `currentPage`  | `string \| null` | Current cursor                   |

## Testing

Run tests with PostgreSQL:

```bash
# Set the test database URL in .env
PG_TEST_DATABASE_URL="postgresql://user:pass@localhost:5432/test_db"

# Run tests
npm run quick:test
```

## License

MIT

---

Maintained by [Mixxtor](https://github.com/mixxtor).
