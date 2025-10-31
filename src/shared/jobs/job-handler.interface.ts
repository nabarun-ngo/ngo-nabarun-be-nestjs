export interface IJobHandler<T = any> {
  handle(data: T): Promise<void>;
}
