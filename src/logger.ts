import pino, { Logger, LoggerOptions } from 'pino';
import { getLoggerOptions } from './get-logger-options';
import { pinoHttpTransport } from './pino-transport';

const pinoOptions: LoggerOptions = {
  level: 'info',
  customLevels: {
    log: 30, // same as info
    notify: 45, // can be used for notifying without using error
  },
};

export let logger: Logger;
reloadLogger(); // initializes the logger

/**
 * Reloads the logger to load environment variables when running locally.
 */
export function reloadLogger(): void {
  const options = getLoggerOptions();
  logger = pino(pinoOptions, pinoHttpTransport(options)).child(options?.staticLogValues || {});
}
