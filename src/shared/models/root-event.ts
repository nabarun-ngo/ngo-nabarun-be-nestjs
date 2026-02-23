import { Logger } from "@nestjs/common";

export abstract class RootEvent {
  private readonly logger: Logger = new Logger(this.constructor.name);
  #logs: string[] = [];

  log(log: string) {
    this.#logs.push(`[LOG][${new Date().toISOString()}] ${log}`);
    this.logger.log(log);
  }

  error(log: string, error: Error) {
    this.#logs.push(`[ERROR][${new Date().toISOString()}] ${log} ${error.stack}`);
    this.logger.error(log, error.stack);
  }

  warn(log: string) {
    this.#logs.push(`[WARN][${new Date().toISOString()}] ${log}`);
    this.logger.warn(log);
  }

  get logs(): string[] {
    return this.#logs;
  }
}