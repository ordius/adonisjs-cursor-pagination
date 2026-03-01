# @mixxtor/adonisjs-lucid-cursor

Cursor-based pagination for AdonisJS Lucid ORM. This package provides efficient cursor pagination for both Model and Database query builders, enabling smooth infinite scroll and pagination experiences.

## Installation

```bash
npm install @mixxtor/adonisjs-lucid-cursor
```

## Setup

Configure the package using the ace command:

```bash
node ace configure @mixxtor/adonisjs-lucid-cursor
```

This will automatically register the provider in your `adonisrc.ts`:

```typescript
// adonisrc.ts
export default defineConfig({
  providers: [
    // ... other providers
    () => import('@mixxtor/adonisjs-lucid-cursor/provider'),
  ],
})
```

## Usage

### Basic Cursor Pagination

```typescript
import User from '#models/user'

// First page (no cursor)
const firstPage = await User.query()
  .orderBy('id', 'asc')
  .cursorPaginate(10)

// Get next page using cursor
const nextCursor = firstPage.getNextCursor()
const secondPage = await User.query()
  .orderBy('id', 'asc')
  .cursorPaginate(10, nextCursor)

// Navigate backwards
const prevCursor = secondPage.getPreviousCursor()
const backToFirst = await User.query()
  .orderBy('id', 'asc')
  .cursorPaginate(10, prevCursor)
```

### API Response

The paginator returns a structured response suitable for API endpoints:

```typescript
const posts = await Post.query()
  .orderBy('created_at', 'desc')
  .cursorPaginate(10)

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
const posts = await Post.query()
  .cursorPaginate(10, null, {
    orderByColumns: {
      views: 'desc',
      id: 'asc'
    }
  })
```

### Without Total Count

For better performance on large datasets, skip fetching the total count:

```typescript
const posts = await Post.query()
  .orderBy('id', 'asc')
  .cursorPaginate(10, null, { fetchTotal: false })

// posts.total will be NaN
// posts.hasTotal will be false
```

### Database Query Builder

Works with raw database queries too:

```typescript
import db from '@adonisjs/lucid/services/db'

const results = await db
  .from('posts')
  .orderBy('id', 'asc')
  .cursorPaginate(10)
```

### Setting Base URL and Query Strings

```typescript
const posts = await Post.query()
  .orderBy('id', 'asc')
  .cursorPaginate(10)

posts
  .baseUrl('/api/posts')
  .queryString({ sort: 'id', order: 'asc' })

// URLs will now include base URL and query params
// e.g., /api/posts?sort=id&order=asc&cursor=...
```

### Accessing Results

```typescript
const posts = await Post.query()
  .orderBy('id', 'asc')
  .cursorPaginate(10)

// Get all items
posts.items() // or posts.all()

// Check pagination state
posts.isEmpty         // true if no results
posts.hasMorePages    // true if there's a next page
posts.hasPages        // true if there are any results
posts.total           // total count (if fetchTotal is true)
posts.perPage         // items per page
```

### Array-like Behavior

The paginator extends Array, so you can iterate and use array methods:

```typescript
const posts = await Post.query()
  .orderBy('id', 'asc')
  .cursorPaginate(10)

// Iterate
for (const post of posts) {
  console.log(post.title)
}

// Array length
console.log(posts.length)
```

## API Reference

### cursorPaginate(perPage, cursor?, options?)

| Parameter | Type | Description |
|-----------|------|-------------|
| `perPage` | `number` | Number of items per page |
| `cursor` | `string \| null` | Cursor string for pagination (null for first page) |
| `options.orderByColumns` | `object` | Custom columns to order by with direction |
| `options.fetchTotal` | `boolean` | Whether to fetch total count (default: true) |

### Paginator Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `items()` | `Result[]` | Get all items |
| `all()` | `Result[]` | Alias for items() |
| `getNextCursor()` | `string \| null` | Get cursor for next page |
| `getPreviousCursor()` | `string \| null` | Get cursor for previous page |
| `getNextPageUrl()` | `string \| null` | Get URL for next page |
| `getPreviousPageUrl()` | `string \| null` | Get URL for previous page |
| `getMeta()` | `object` | Get pagination metadata |
| `toJSON()` | `object` | Get JSON representation |
| `serialize(cherryPick?)` | `object` | Serialize model results |
| `baseUrl(url)` | `this` | Set base URL for pagination links |
| `queryString(params)` | `this` | Set query string parameters |

### Paginator Properties

| Property | Type | Description |
|----------|------|-------------|
| `isEmpty` | `boolean` | True if no results |
| `total` | `number` | Total count (NaN if not fetched) |
| `hasTotal` | `boolean` | True if total is available |
| `hasPages` | `boolean` | True if there are results |
| `hasMorePages` | `boolean` | True if there's a next page |
| `perPage` | `number` | Items per page |
| `currentPage` | `string \| null` | Current cursor |

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
