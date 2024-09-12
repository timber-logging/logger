import { Writable } from 'stream';
import { getGcloudFunctionAddLogUrl } from '../utils/url-utils';

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

interface PinoTransportOptions {
  logToTimber?: boolean;
  logToConsol?: boolean;
  staticLogValues?: Record<string, any>;
  apiKey?: string;
  color?: boolean;
}

export const pinoHttpTransport = (options: PinoTransportOptions = {}) => {
  const { logToTimber, logToConsol } = options;
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
        if (logToConsol === undefined || !!logToConsol) sendToConsol(object, options, skipFields);
        if (logToTimber === undefined || !!logToTimber) await sendLog(object, options);
        callback();
      } catch (error) {
        console.error('Error transporting log:', error);
        callback(error);
      }
    },
  });
};

async function sendLog(logObject: any, options: PinoTransportOptions): Promise<void> {
  if (!options.apiKey) {
    console.error('Missing API Key for logging.');
    return;
  }

  const body = JSON.stringify(logObject);
  const url = getGcloudFunctionAddLogUrl();
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

function sendToConsol(logObject: any, options: PinoTransportOptions, skipFields: string[]): void {
  const messageColor = options.color !== false ? colorMap[logObject.level] || colors.default : '';
  const contextStr = getContextAsString(logObject, skipFields);
  const message = typeof logObject !== 'object' ? logObject : logObject.msg;

  let consoleLog = `${messageColor}${message}${colors.default}`;
  if (contextStr) consoleLog += `\n${indent(contextStr)}`;
  console.log(consoleLog);
}

function getContextAsString(logObject: any, skipFields: string[]): string {
  return Object.keys(logObject).reduce((str, key) => {
    if (skipFields.includes(key)) return str;
    const keyValueStr = `${key}: ${indent(getValueAsString(logObject[key]))}`;
    return str ? `${str}\n${keyValueStr}` : keyValueStr;
  }, '');
}

function getValueAsString(value: any): string {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'object') return JSON.stringify(value, null, 2);
  return String(value);
}

function indent(str: string, skipFirstRow = false): string {
  const indentedStr = str.split('\n').join('\n  ');
  return skipFirstRow ? indentedStr : `  ${indentedStr}`;
}
