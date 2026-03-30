import { Writable } from 'stream';
import EventEmitter from 'events';
import { Level } from 'pino';

class LogEmitter extends EventEmitter {}
const logEmitter = new LogEmitter();
let logsInProgress: number = 0;

const colors = {
  default: '\x1b[0m',
  white: '\x1b[0m',
  grey: '\x1b[90m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

const colorMap: Record<number, string> = {
  60: colors.red,
  55: colors.cyan,
  50: colors.red,
  40: colors.yellow,
  30: colors.green,
  20: colors.blue,
  10: colors.grey,
};

export interface TimberOptions {
  apiKey?: string; // optional if TIMBER_API_KEY is set as env variable
  timberId?: string; // optional if TIMBER_ID is set as env variable
  url?: string;
  logToTimber?: boolean;
  logToConsole?: boolean;
  usePinoFormat?: boolean; // pino uses a different format for the logging function, here we can use it
  logLevel?: Level; // Pino's predefined log levels, use "trace" | "debug" | "info" | "warn" | "error" | "fatal"
  colorConsole?: boolean;
  staticLogValues?: Record<string, any>;
}

// Function to wait for all logs to finish
export async function waitForLogsToFinish(maxWaitTime = 250) {
  // If no logs are in progress, resolve immediately
  if (logsInProgress <= 0) return;

  // Wait until all logs are done
  let timberPromise = new Promise((resolve) => logEmitter.once('timberComplete', resolve));

  await Promise.race([timberPromise, sleep(maxWaitTime)])
}

export const pinoHttpTransport = (options: TimberOptions = {}) => {
  const { logToTimber, logToConsole } = options;
  const skipFields = [
    'level', 'time', 'pid', 'hostname', 'msg',
    ...Object.keys(options.staticLogValues || {}),
  ];

  return new Writable({
    objectMode: true,
    async write(logObject: any, encoding, callback) {
      let object = logObject;
      try {
        if (typeof logObject === 'string') object = JSON.parse(logObject);
      } catch (e) {
        // Ignore JSON parse errors
      }
      try {
        if (logToConsole === undefined || !!logToConsole) sendToConsole(object, options, skipFields);
        if (logToTimber === undefined || !!logToTimber) await sendLog(object, options);
        callback();
      } catch (error: any) {
        console.error('Error transporting log:', error);
        callback(error);
      }
    },
  });
};

async function sendLog(logObject: any, options: TimberOptions): Promise<void> {
  try{
    const apiKey = options?.apiKey || process?.env?.TIMBER_API_KEY;
    if (!apiKey) {
      console.error('Missing API Key for logging.');
      return;
    }

    const timberId = options?.timberId || process?.env?.TIMBER_ID;
    if (!timberId) {
      console.error('Missing Timber ID for logging.');
      return;
    }

    const url = options?.url || 'https://app.timberlogging.co/api/add-log';
    if (!url) {
      console.error('Missing API url for Timber Logging');
      return;
    }

    logsInProgress += 1; // Increment logs in progress

    const body = JSON.stringify(logObject);
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${apiKey}`,
        'Timber-ID': timberId,
      },
      body,
    });

    if (!response.ok) {
      console.error('Failed to send log to timber:', await response.text());
    }
  } catch(e: any) {
    console.error('Error transporting log to timber:', e.message);
  } finally {
    logsInProgress -= 1; // Decrement logs in progress after log is sent

    // If no more logs are in progress, emit 'timberComplete'
    if (logsInProgress <= 0) logEmitter.emit('timberComplete');
  }
}

function sendToConsole(logObject: any, options: TimberOptions, skipFields: string[]): void {
  try {
    let messageColor = '';
    let resetColor = '';
    if (options?.colorConsole === undefined || !!options?.colorConsole) {
      messageColor = colorMap[logObject.level] || colors.default;
      resetColor = colors.default;
    }

    const contextStr = getContextAsString(logObject, skipFields);
    let message = logObject.msg;
    if (typeof logObject !== 'object') {
      message = logObject;
    }
    let consoleLog = `${messageColor}${message}${resetColor}`;
    if (contextStr) consoleLog += `\n${indent(contextStr, false)}`;
    console.log(consoleLog); // DO NOT CHANGE TO TIMBER!!!!!!
  } catch(e) {
    console.error(`Failed to log to console`)
  }
}

function getContextAsString(logObject: any, skipFields: string[]): string {
  if (typeof logObject !== 'object') return '';

  // Separate Pino fields from custom fields
  return Object.keys(logObject).reduce((str, key) => {
    if (skipFields.includes(key)) return str;
    if (logObject[key] === undefined || logObject[key] === null || logObject[key] === '') return str;

    let keyValueStr = `${key}: ${indent(getValueAsString(logObject[key]), true)}`;
    if (!str) return keyValueStr;
    return `${str}\n${keyValueStr}`;
  }, '');
}

function getValueAsString(value: any): string {
  try {
    if (value instanceof Date) return value.toISOString();
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    return value.toString();
  } catch (e) {
    return '[value]';
  }
}

function indent(str: string, skipFirstRow = false): string {
  if (typeof str !== 'string' || !str) return str;
  const indentedStr = `${str.split('\n').join('\n  ')}`;
  if (skipFirstRow) return indentedStr;
  return `  ${indentedStr}`;
}

/**
 * Returns a promise so the program sleeps for the number of milliseconds
 * @param {number} milliseconds
 * @returns {Promise}
 */
function sleep(milliseconds: number): Promise<any> {
  return new Promise<void>((resolve) => setTimeout(() => resolve(), milliseconds));
}
