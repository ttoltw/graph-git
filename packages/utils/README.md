# @g/utils

Utility functions for TypeScript/JavaScript applications.

## Installation

```bash
npm install @g/utils
```

## Usage

### Sort Utilities

#### `genMultiSort<T>(...sortFns: SortFn<T>[])`

Generates a multi-level sort function that applies multiple sort criteria in sequence.

**Type Definition:**

```typescript
type SortFn<T> = (a: T, b: T) => number;

function genMultiSort<T>(...sortFns: SortFn<T>[]): SortFn<T>;
```

**Example:**

```typescript
import { genMultiSort } from "@g/utils";

interface User {
  name: string;
  age: number;
  score: number;
}

const users: User[] = [
  { name: "Alice", age: 25, score: 100 },
  { name: "Bob", age: 25, score: 90 },
  { name: "Alice", age: 30, score: 95 },
];

// Define individual sort functions
const sortByName = (a: User, b: User) => a.name.localeCompare(b.name);
const sortByAge = (a: User, b: User) => a.age - b.age;
const sortByScore = (a: User, b: User) => b.score - a.score; // descending

// Combine sort functions
const multiSort = genMultiSort(sortByName, sortByAge, sortByScore);

// Sort the array
users.sort(multiSort);

// Result: sorted by name first, then age, then score (descending)
```

## API Reference

### Sort Functions

#### `genMultiSort<T>(...sortFns: SortFn<T>[])`

Creates a combined sort function that applies multiple sort criteria in the order provided.

**Parameters:**

- `sortFns`: Array of sort functions to apply in sequence

**Returns:**

- A combined sort function that applies all criteria in order

**Behavior:**

- Applies each sort function in sequence
- If a sort function returns a non-zero value, that result is returned
- If all sort functions return 0, the final result is 0
- If no sort functions are provided, returns a function that always returns 0

## Development

### Running Tests

```bash
npm test
```

### Running Tests in Watch Mode

```bash
npm run test:watch
```

### Building

```bash
npm run build
```

## License

ISC
