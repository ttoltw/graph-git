/**
 * Type definition for a sort function
 */
export type SortFn<T> = (a: T, b: T) => number;

/**
 * Generates a multi-level sort function that applies multiple sort criteria in sequence
 * 
 * @param sortFns - Array of sort functions to apply in order
 * @returns A combined sort function that applies all criteria
 * 
 * @example
 * ```typescript
 * const users = [
 *   { name: 'Alice', age: 25, score: 100 },
 *   { name: 'Bob', age: 25, score: 90 },
 *   { name: 'Alice', age: 30, score: 95 }
 * ];
 * 
 * const sortByName = (a, b) => a.name.localeCompare(b.name);
 * const sortByAge = (a, b) => a.age - b.age;
 * const sortByScore = (a, b) => b.score - a.score; // descending
 * 
 * const multiSort = genMultiSort(sortByName, sortByAge, sortByScore);
 * users.sort(multiSort);
 * // Result: sorted by name first, then age, then score (descending)
 * ```
 */
export function genMultiSort<T>(...sortFns: SortFn<T>[]): SortFn<T> {
    return (a, b) => {
        for (const sortFn of sortFns) {
            const result = sortFn(a, b);
            if (result !== 0) return result;
        }
        return 0;
    };
} 