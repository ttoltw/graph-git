import { Mutex } from './index';

// Create a global mutex instance
const mutex = new Mutex();

// Simulate a resource that needs synchronization
let sharedResource = 0;

async function updateResource(id: number) {
  const release = await mutex.acquire();
  
  try {
    console.log(`Thread ${id} starting to update resource`);
    
    // Simulate some work
    await new Promise(resolve => setTimeout(resolve, 100));
    
    sharedResource += 1;
    console.log(`Thread ${id} completed update, resource value: ${sharedResource}`);
  } finally {
    release();
  }
}

async function runExample() {
  console.log('Starting Mutex example...');
  
  // Start multiple concurrent tasks
  const tasks = [
    updateResource(1),
    updateResource(2),
    updateResource(3),
    updateResource(4),
    updateResource(5)
  ];
  
  await Promise.all(tasks);
  
  console.log(`All tasks completed, final resource value: ${sharedResource}`);
}

// If this file is executed directly
if (require.main === module) {
  runExample().catch(console.error);
}

export { runExample }; 