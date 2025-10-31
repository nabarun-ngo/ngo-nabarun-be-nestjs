import 'reflect-metadata';

export function defineMetadata<T>(key: string, value: T, target: object): void {
  Reflect.defineMetadata(key, value, target);
}

export function getMetadata<T>(key: string, target: object): T | undefined {
  return Reflect.getMetadata(key, target) as T | undefined;
}
