import pino, { LoggerOptions as PinoOptions, LogFn } from 'pino';
import { pinoHttpTransport, TimberOptions, waitForLogsToFinish } from './pino-transport';

// Define a type for the arguments array that captures the broadest possible input.
type TimberLogFnArgs = [string, object] | [object, string, ...any[]] | [string, ...any[]] | [object];

// Define the custom function signature for your logger methods.
type TimberLogFn = 
  // (string, object, ...args) - Your custom format
  ((message: string, obj?: object) => void)
  // (object, string, ...args) - Matches Pino's standard format
  | ((obj: object, message: string, ...args: any[]) => void)
  // (string, string, ...args) - Multiple strings are concatenated (unless usePinoFormat=true then printf is used)
  | ((message: string, ...args: any[]) => void)
  // (string) - Simple message only
  | ((message: string) => void)
  // (object) - Simple object only
  | ((obj: object) => void);

interface TimberLogger {
  info: TimberLogFn;
  warn: TimberLogFn;
  warning: TimberLogFn;
  error: TimberLogFn;
  fatal: TimberLogFn;
  log: TimberLogFn;
  notify: TimberLogFn;
  reload(options?: TimberOptions): void;
  waitToFinish(maxWaitMs: number): Promise<void>;
}

const pinoOptions: PinoOptions = {
  level: 'info',
  customLevels: {
    notify: 55, // can notify without using error
  },
};

interface CustomPinoLogger extends pino.Logger {
  notify?: LogFn;
}

export class Logger implements TimberLogger {
  private pinoLogger: CustomPinoLogger;
  private pinoOptions: PinoOptions;
  private timberOptions: TimberOptions;

  constructor(options: TimberOptions = {}) {
    this.pinoOptions = { ...pinoOptions };
    this.timberOptions = { ...options };
    if (options.logLevel) this.pinoOptions.level = this.timberOptions.logLevel; // if users have defined a custom log level, use it, else it is just info
    this.pinoLogger = pino(this.pinoOptions, pinoHttpTransport(this.timberOptions))
                        .child(this.timberOptions.staticLogValues || {});
  }

  // Preprocess arguments before passing to pino.
  public info(...args: TimberLogFnArgs): void {
    logFunction(this.timberOptions.usePinoFormat, this.pinoLogger.info, ...args);
  }
  public trace(...args: TimberLogFnArgs): void {
    logFunction(this.timberOptions.usePinoFormat, this.pinoLogger.trace, ...args);
  }

  // You would repeat this pattern for warn, error, fatal, etc.
  public warn(...args: TimberLogFnArgs): void {
    logFunction(this.timberOptions.usePinoFormat, this.pinoLogger.warn, ...args);
  }
  public warning(...args: TimberLogFnArgs): void {
    logFunction(this.timberOptions.usePinoFormat, this.pinoLogger.warn, ...args);
  }

  public error(...args: TimberLogFnArgs): void {
    logFunction(this.timberOptions.usePinoFormat, this.pinoLogger.error, ...args);
  }

  public fatal(...args: TimberLogFnArgs): void {
    logFunction(this.timberOptions.usePinoFormat, this.pinoLogger.fatal, ...args);
  }

  // .log logs as info
  public log(...args: TimberLogFnArgs): void {
    logFunction(this.timberOptions.usePinoFormat, this.pinoLogger.info, ...args);
  }
  // custom level
  public notify(...args: TimberLogFnArgs): void {
    logFunction(this.timberOptions.usePinoFormat, this.pinoLogger.notify, ...args);
  }

  public reload(options: TimberOptions = {}) {
    this.pinoOptions = { ...pinoOptions };
    this.timberOptions = { ...options };
    if (options.logLevel) this.pinoOptions.level = this.timberOptions.logLevel; // if users have defined a custom log level, use it, else it is just info
    this.pinoLogger = pino(this.pinoOptions, pinoHttpTransport(this.timberOptions))
                        .child(this.timberOptions.staticLogValues || {});
  }

  public async waitToFinish(maxWaitMs: number) {
    return waitForLogsToFinish(maxWaitMs);
  }
}

function logFunction(usePinoFormat: boolean | undefined, pinoLogFn: Function | undefined, ...args: any[]) {
  if (!pinoLogFn) return;

  // if usePinoFormat=true then we just pass through to pino
  if (usePinoFormat) {
    pinoLogFn(...args);
    return;
  }

  // Else we are using our own format
  if (!args?.length) return;
  // if there is just 1 arg, just send it to pino
  if (args.length === 1) {
    pinoLogFn(...args);
    return;
  }

  // if it is logged as object then string or string then object, make them the correct way around
  // this works if using the pino format with printf-style without setting usePinoFormat 
  if (typeof args[0] === 'string' && typeof args[1] === 'object') {
    const restOfArgs = args.slice(2);
    pinoLogFn(args[1], args[0], ...restOfArgs);
    return;
  }
  if (typeof args[0] === 'object' && typeof args[1] === 'string') {
    const restOfArgs = args.slice(2);
    pinoLogFn(args[0], args[1], ...restOfArgs);
    return;
  }
  // if first one is undefined, just remove it and log the rest
  if (typeof args[0] === undefined) {
    const restOfArgs = args.slice(1);
    pinoLogFn(...restOfArgs);
    return;
  }

  // anything else just join with a space
  // if (args.length > 2) { // eg multiple strings, just concatenate
  // if (typeof args[0] === 'string' && typeof args[1] === 'string') {
  // if (typeof args[0] === 'object' && typeof args[1] === 'object') {
  pinoLogFn(args.join(' '));
}
