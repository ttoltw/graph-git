import { genMultiSort, SortFn } from "../sort";

describe("genMultiSort", () => {
  interface TestItem {
    name: string;
    age: number;
    score: number;
  }

  const testData: TestItem[] = [
    { name: "Alice", age: 25, score: 100 },
    { name: "Bob", age: 25, score: 90 },
    { name: "Alice", age: 30, score: 95 },
    { name: "Charlie", age: 20, score: 85 },
    { name: "Bob", age: 30, score: 80 },
  ];

  it("should sort by single criteria", () => {
    const sortByName: SortFn<TestItem> = (a, b) => a.name.localeCompare(b.name);
    const multiSort = genMultiSort(sortByName);

    const sorted = [...testData].sort(multiSort);

    expect(sorted.map((item) => item.name)).toEqual(["Alice", "Alice", "Bob", "Bob", "Charlie"]);
  });

  it("should sort by multiple criteria in order", () => {
    const sortByName: SortFn<TestItem> = (a, b) => a.name.localeCompare(b.name);
    const sortByAge: SortFn<TestItem> = (a, b) => a.age - b.age;
    const sortByScore: SortFn<TestItem> = (a, b) => b.score - a.score; // descending

    const multiSort = genMultiSort(sortByName, sortByAge, sortByScore);
    const sorted = [...testData].sort(multiSort);

    // Should be sorted by name first, then age, then score (descending)
    expect(sorted).toEqual([
      { name: "Alice", age: 25, score: 100 },
      { name: "Alice", age: 30, score: 95 },
      { name: "Bob", age: 25, score: 90 },
      { name: "Bob", age: 30, score: 80 },
      { name: "Charlie", age: 20, score: 85 },
    ]);
  });

  it("should handle empty sort functions array", () => {
    const multiSort = genMultiSort<TestItem>();
    const sorted = [...testData].sort(multiSort);

    // Should return original order when no sort functions provided
    expect(sorted).toEqual(testData);
  });

  it("should handle single sort function", () => {
    const sortByAge: SortFn<TestItem> = (a, b) => a.age - b.age;
    const multiSort = genMultiSort(sortByAge);

    const sorted = [...testData].sort(multiSort);

    expect(sorted.map((item) => item.age)).toEqual([20, 25, 25, 30, 30]);
  });

  it("should work with different data types", () => {
    const numbers = [3, 1, 4, 1, 5, 9, 2, 6];
    const sortAsc: SortFn<number> = (a, b) => a - b;
    const sortDesc: SortFn<number> = (a, b) => b - a;

    const multiSort = genMultiSort(sortAsc);
    const sorted = [...numbers].sort(multiSort);

    expect(sorted).toEqual([1, 1, 2, 3, 4, 5, 6, 9]);
  });
});
