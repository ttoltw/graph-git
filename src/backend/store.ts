export class Store<T extends Record<string, unknown> = Record<string, unknown>> {
  protected _data: T = {} as T;
  private defaults: T = {} as T;
  public get data(): T {
    return this._data;
  }
  constructor() {
    this._data = {} as T;
  }

  public get(): T;
  public get(key: string): unknown;
  public get(key?: string) {
    if (!key) {
      return this._data;
    }
    return this._data[key];
  }

  public set(data: object): void;
  public set(key: string, value: unknown): void;
  public set(...args: unknown[]): void {
    const store = this._data as Record<string, unknown>;
    if (args.length === 1) {
      if (typeof args[0] !== "object") {
        throw new Error("Invalid argument");
      }
      const data = args[0] as Record<string, unknown>;
      for (const key in data) {
        store[key] = data[key];
      }
    } else if (args.length === 2) {
      const key = args[0];
      const value = args[1];
      if (typeof key !== "string") {
        throw new Error("Invalid argument");
      }
      store[key] = value;
    } else {
      throw new Error("Invalid arguments");
    }
  }

  public reset(key?: string): void {
    if (key) {
      if (typeof key !== "string") {
        throw new Error("Invalid argument");
      }
      if (this.defaults[key] !== undefined) {
        const store = this._data as Record<string, unknown>;
        store[key] = this.defaults[key];
      } else {
        delete this._data[key];
      }
    } else {
      this._data = { ...this.defaults };
    }
  }
}
