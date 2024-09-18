import pino, { LoggerOptions as PinoOptions } from 'pino';
import { pinoHttpTransport, LoggerOptions, waitForLogsToFinish } from './pino-transport';

// Define the structure of the options object

const pinoOptions: PinoOptions = {
  level: 'info',
  customLevels: {
    log: 30, // same as info
    notify: 45, // can be used for notifying without using error
  },
};

export class Logger {
  public logger: pino.Logger;

  constructor(options: LoggerOptions = {}) {
    this.logger = pino(pinoOptions, pinoHttpTransport(options)).child(options.staticLogValues || {});

    // Proxy methods directly from pino logger
    return new Proxy(this, {
      get(target, prop) {
        if (prop in target.logger) {
          return (target.logger as any)[prop];
        }
        return (target as any)[prop];
      }
    });
  }

  reload(options: LoggerOptions = {}) {
    this.logger = pino(pinoOptions, pinoHttpTransport(options)).child(options.staticLogValues || {});
  }

  async waitToFinish(maxWaitMs: number) {
    return waitForLogsToFinish(maxWaitMs);
  }
}
