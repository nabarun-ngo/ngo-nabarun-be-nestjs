export class KeyValueConfig {
  KEY: string;
  VALUE: string;
  DESCRIPTION: string;
  ACTIVE: boolean;
  ATTRIBUTES: Record<string, string | number | boolean | string[]>;

 constructor(data: {
    KEY: string;
    VALUE: string;
    DESCRIPTION: string;
    ACTIVE: boolean;
    ATTRIBUTES: Record<string, string | number | boolean | string[]>;
  }) {
    this.KEY = data.KEY;
    this.VALUE = data.VALUE;
    this.DESCRIPTION = data.DESCRIPTION;
    this.ACTIVE = data.ACTIVE;
    this.ATTRIBUTES = { ...data.ATTRIBUTES };
  }

  getAttribute<T = string | number | boolean | string[]>(name: string): T {
    return this.ATTRIBUTES[name] as T;
  }

  static isValid(obj: any): obj is KeyValueConfig {
    return (
      typeof obj.KEY === 'string' &&
      typeof obj.VALUE === 'string' &&
      typeof obj.DESCRIPTION === 'string' &&
      typeof obj.ACTIVE === 'boolean' &&
      typeof obj.ATTRIBUTES === 'object' &&
      obj.ATTRIBUTES !== null
    );
  }

}