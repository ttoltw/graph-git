import { Mutex } from "../Mutex";

describe("Mutex", () => {
  let mutex: Mutex;

  beforeEach(() => {
    mutex = new Mutex();
  });

  describe("acquire", () => {
    it("should immediately return release function when no other lock is held", async () => {
      const release = await mutex.acquire();
      expect(typeof release).toBe("function");
    });

    it("should allow new acquire after release", async () => {
      const release1 = await mutex.acquire();
      release1();

      const release2 = await mutex.acquire();
      expect(typeof release2).toBe("function");
      release2();
    });

    it("should handle multiple waiting acquires in order", async () => {
      const results: number[] = [];

      // First acquire gets the lock immediately
      const release1 = await mutex.acquire();

      // Second acquire needs to wait
      const promise2 = mutex.acquire().then((release) => {
        results.push(2);
        release();
      });

      // Third acquire also needs to wait
      const promise3 = mutex.acquire().then((release) => {
        results.push(3);
        release();
      });

      // Release the first lock
      results.push(1);
      release1();

      // Wait for all operations to complete
      await Promise.all([promise2, promise3]);

      expect(results).toEqual([1, 2, 3]);
    });

    it("should immediately wake up the next waiting acquire after release", async () => {
      const results: string[] = [];

      // First acquire
      const release1 = await mutex.acquire();

      // Second acquire (will wait)
      const promise2 = mutex.acquire().then((release) => {
        results.push("second acquired");
        release();
      });

      // Third acquire (will wait)
      const promise3 = mutex.acquire().then((release) => {
        results.push("third acquired");
        release();
      });

      // Release the first lock
      results.push("first released");
      release1();

      // Wait for all operations to complete
      await Promise.all([promise2, promise3]);

      expect(results).toEqual(["first released", "second acquired", "third acquired"]);
    });

    it("should correctly handle nested acquire and release", async () => {
      const results: string[] = [];

      const release1 = await mutex.acquire();
      results.push("acquired 1");

      // Second acquire will wait because first hasn't been released
      const promise2 = mutex.acquire().then((release) => {
        results.push("acquired 2");
        release();
        results.push("released 2");
      });

      // Third acquire will also wait
      const promise3 = mutex.acquire().then((release) => {
        results.push("acquired 3");
        release();
        results.push("released 3");
      });

      // Release the first lock
      release1();
      results.push("released 1");

      // Wait for all operations to complete
      await Promise.all([promise2, promise3]);

      expect(results).toEqual([
        "acquired 1",
        "released 1",
        "acquired 2",
        "released 2",
        "acquired 3",
        "released 3",
      ]);
    });

    it("should safely release when there are no waiters", async () => {
      const release = await mutex.acquire();
      release();

      // Acquire again should succeed
      const release2 = await mutex.acquire();
      expect(typeof release2).toBe("function");
      release2();
    });

    it("should correctly handle multiple concurrent releases", async () => {
      const results: string[] = [];

      // First acquire
      const release1 = await mutex.acquire();
      results.push("acquired 1");

      // Second acquire (waiting)
      const promise2 = mutex.acquire().then((release) => {
        results.push("acquired 2");
        release();
        results.push("released 2");
      });

      // Third acquire (waiting)
      const promise3 = mutex.acquire().then((release) => {
        results.push("acquired 3");
        release();
        results.push("released 3");
      });

      // Release the first lock
      release1();
      results.push("released 1");

      // Wait for all operations to complete
      await Promise.all([promise2, promise3]);

      expect(results).toEqual([
        "acquired 1",
        "released 1",
        "acquired 2",
        "released 2",
        "acquired 3",
        "released 3",
      ]);
    });
  });

  describe("Edge cases", () => {
    it("should correctly handle empty wait queue", async () => {
      const release = await mutex.acquire();
      release();

      // Acquire again should succeed immediately
      const release2 = await mutex.acquire();
      expect(typeof release2).toBe("function");
      release2();
    });

    it("should correctly handle single waiter", async () => {
      const release1 = await mutex.acquire();

      const promise = mutex.acquire().then((release) => {
        return "acquired";
      });

      release1();

      const result = await promise;
      expect(result).toBe("acquired");
    });

    it("should correctly handle order of multiple waiters", async () => {
      const order: number[] = [];

      const release1 = await mutex.acquire();

      const promises = [];
      for (let i = 0; i < 3; i++) {
        const promise = mutex.acquire().then((release) => {
          order.push(i);
          release();
        });
        promises.push(promise);
      }

      release1();

      await Promise.all(promises);

      expect(order).toEqual([0, 1, 2]);
    });
  });

  describe("timeout feature", () => {
    it("should throw error when timeout", async () => {
      // First get the lock
      const release1 = await mutex.acquire();

      // Try to get the lock within 100ms, but it will timeout
      const startTime = Date.now();
      await expect(mutex.acquire(100)).rejects.toThrow("Mutex acquire timeout");
      const endTime = Date.now();

      // Ensure actual waiting time is close to timeout time
      expect(endTime - startTime).toBeGreaterThanOrEqual(90);
      expect(endTime - startTime).toBeLessThan(200);

      release1();
    });

    it("should succeed getting lock when timeout is set but lock is released before timeout", async () => {
      // First get the lock
      const release1 = await mutex.acquire();

      // Set a longer timeout, but release the lock before timeout
      const promise = mutex.acquire(1000);

      // Immediately release the lock
      release1();

      // Should succeed getting the lock
      const release2 = await promise;
      expect(typeof release2).toBe("function");
      release2();
    });

    it("should correctly handle multiple timeout requests", async () => {
      // First get the lock
      const release1 = await mutex.acquire();

      // Start multiple timeout requests
      const promises = [
        mutex.acquire(50).catch((e) => "timeout1"),
        mutex.acquire(100).catch((e) => "timeout2"),
        mutex.acquire(150).catch((e) => "timeout3"),
      ];

      // Wait for all timeouts
      const results = await Promise.all(promises);

      expect(results).toEqual(["timeout1", "timeout2", "timeout3"]);

      release1();
    });

    it("should correctly clean up queue after timeout", async () => {
      // First get the lock
      const release1 = await mutex.acquire();

      // Start a request that will timeout
      const timeoutPromise = mutex.acquire(50).catch((e) => "timeout");

      // Wait for timeout
      await timeoutPromise;

      // Release the lock
      release1();

      // Now should be able to get the lock immediately, because queue has been cleaned up
      const release2 = await mutex.acquire();
      expect(typeof release2).toBe("function");
      release2();
    });

    it("should not affect other normal acquires when lock is not used, even with timeout parameter", async () => {
      // First get the lock
      const release1 = await mutex.acquire();

      // Start a request that will timeout
      const timeoutPromise = mutex.acquire(50).catch((e) => "timeout");

      // Start a normal acquire (no timeout)
      const normalPromise = mutex.acquire();

      // Wait for timeout
      await timeoutPromise;

      // Release the lock
      release1();

      // Normal acquire should succeed
      const release2 = await normalPromise;
      expect(typeof release2).toBe("function");
      release2();
    });

    it("should immediately return when lock is not used, even with timeout parameter", async () => {
      const startTime = Date.now();
      const release = await mutex.acquire(1000);
      const endTime = Date.now();

      // Should immediately return, no need to wait
      expect(endTime - startTime).toBeLessThan(10);
      expect(typeof release).toBe("function");

      release();
    });

    it("should correctly handle zero timeout", async () => {
      // First get the lock
      const release1 = await mutex.acquire();

      // Use zero timeout
      await expect(mutex.acquire(0)).rejects.toThrow("Mutex acquire timeout");

      release1();
    });

    it("should correctly handle negative timeout", async () => {
      // First get the lock
      const release1 = await mutex.acquire();

      // Use negative timeout
      await expect(mutex.acquire(-100)).rejects.toThrow("Mutex acquire timeout");

      release1();
    });
  });
});
