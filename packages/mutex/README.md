# @g/mutex

A simple TypeScript/JavaScript mutex implementation.

## Installation

```bash
npm install @g/mutex
```

## Usage

```typescript
import { Mutex } from '@g/mutex';

const mutex = new Mutex();

async function criticalSection() {
  const release = await mutex.acquire();
  
  try {
    // Critical section code
    console.log('Executing critical section operation');
  } finally {
    // Ensure the lock is released
    release();
  }
}
```

## API

### `Mutex`

Mutex class.

#### `acquire(): Promise<() => void>`

Acquire the lock. If the lock is already held, wait until it becomes available.

**Returns:** A Promise that resolves to a release function.

**Release function:** Call this function to release the lock.

## Features

- Supports multiple concurrent waiters
- Processes wait queue in FIFO order
- Automatic lock release handling
- TypeScript support
- Lightweight implementation

## Testing

```bash
npm test
```

## License

ISC 