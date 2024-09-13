import { Writable } from 'stream';

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
  50: colors.red,
  45: colors.cyan,
  40: colors.yellow,
  30: colors.green,
  20: colors.blue,
  10: colors.grey,
};

export interface LoggerOptions {
  apiKey?: string;
  url?: string;
  logToTimber?: boolean;
  logToConsole?: boolean;
  colorConsole?: boolean;
  staticLogValues?: Record<string, any>;
}

export const pinoHttpTransport = (options: LoggerOptions = {}) => {
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
        if (logToConsole === undefined || !!logToConsole) sendToConsol(object, options, skipFields);
        if (logToTimber === undefined || !!logToTimber) await sendLog(object, options);
        callback();
      } catch (error: any) {
        console.error('Error transporting log:', error);
        callback(error);
      }
    },
  });
};

async function sendLog(logObject: any, options: LoggerOptions): Promise<void> {
  if (!options.apiKey) {
    console.error('Missing API Key for logging.');
    return;
  }
  if (!options.url) {
    console.error('Missing API url for logging.');
    return;
  }

  const body = JSON.stringify(logObject);
  const url = options.url;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${options.apiKey}`,
    },
    body,
  });

  if (!response.ok) {
    console.error('Failed to send log to timber:', await response.text());
  }
}

function sendToConsol(logObject: any, options: LoggerOptions, skipFields: string[]): void {
  let messageColor = '';
  let resetColor = '';
  if (options.colorConsole === undefined || !!options.colorConsole) {
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
  console.log(consoleLog); // DO NOT CHANGE TO LOGGER!!!!!!
}

function getContextAsString(logObject: any, skipFields: string[]): string {
  if (typeof logObject !== 'object') return '';

  // Separate Pino fields from custom fields
  return Object.keys(logObject).reduce((str, key) => {
    if (skipFields.includes(key)) return str;

    let keyValueStr = `${key}: ${indent(getValueAsString(logObject[key]), true)}`;
    if (!str) return keyValueStr;
    return `\n${keyValueStr}`;
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
