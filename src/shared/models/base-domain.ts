export abstract class BaseDomain<T> {
  #id: T;
  #createdAt: Date;
  #updatedAt: Date;

  constructor(id: T, createdAt?: Date, updatedAt?: Date) {
    this.#id = id;
    this.#createdAt = createdAt || new Date();
    this.#updatedAt = updatedAt || new Date();
  }

  get id(): T {
    return this.#id;
  }

  get createdAt(): Date {
    return this.#createdAt;
  }

  get updatedAt(): Date {
    return this.#updatedAt;
  }

  protected touch(): void {
    this.#updatedAt = new Date();
  }

  public equals(entity?: BaseDomain<T>): boolean {
    if (!entity) return false;
    if (this === entity) return true;
    return this.id === entity.id;
  }

   public toJson(): Record<string, any> {
    const result: Record<string, any> = {};
    let proto = Object.getPrototypeOf(this);

    while (proto && proto !== Object.prototype) {
      const descriptors = Object.getOwnPropertyDescriptors(proto);

      for (const [key, descriptor] of Object.entries(descriptors)) {
        if (descriptor.get && key !== "constructor") {
          result[key] = this.convert((this as any)[key]);
        }
      }

      proto = Object.getPrototypeOf(proto);
    }

    return Object.freeze(result);
  }

  private convert(value: any): any {
    if (value === null || value === undefined) return value;

    // Primitive types
    if (typeof value !== "object") return value;

    // Date
    if (value instanceof Date) return value.toISOString();

    // Arrays
    if (Array.isArray(value)) {
      return value.map(v => this.convert(v));
    }

    // Nested BaseModel object
    if (value instanceof BaseDomain) {
      return value.toJson();
    }

    // Generic plain object
    if (Object.getPrototypeOf(value) === Object.prototype) {
      const obj: any = {};
      for (const [k, v] of Object.entries(value)) {
        obj[k] = this.convert(v);
      }
      return obj;
    }

    // Fallback → return as-is
    return value;
  }
}