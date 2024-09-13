# Timber Logging

`@timber-logging/logger` is a simple logging utility based on Pino for Node.js. It supports logging to both the console and Timber Logging.

It is currently just used by selected customers but will be publically available soon.

## Installation

Install the package via npm:

```bash
npm install @timber-logging/logger
```

## Usage

Import and initialize the logger with custom options:

```js
import { Logger } from '@timber-logging/logger';

const options = {
  logToTimber: true,
  logToConsole: true,
  color: true,
  staticLogValues: { project: "MY_PROJECT" },
};

const logger = new Logger(options);
logger.info("Application started!");
```

## Options

You can configure the logger by passing an options object when instantiating the `Logger`. Here are the available options:

- `apiKey` (string): API key required for Timber Logging
- `url` (string): Where the logs are sent
- `logToTimber` (boolean): Enable/disable logging to an external service (default: true).
- `logToConsole` (boolean): Enable/disable logging to the console (default: true).
- `color` (boolean): Enable/disable colored console output (default: true).
- `staticLogValues` (object): Static values that will be included in every log sent to Timber Logging.

### Example

```js
import { Logger } from '@timber-logging/logger';

const options = {
  url: 'timber-logging-url',
  apiKey: 'YOUR_API_KEY',
  logToTimber: true,
  logToConsole: true,
  colorConsole: true,
  staticLogValues: { project: "MY_PROJECT" },
};

const logger = new Logger(options);
logger.notify("This is a notification message.");
```

## API

### `new Logger(options)`

Creates a new `Logger` instance with the provided `options`.

- `options`: An object that configures the logger. See the [Options](#options) section for details.

### `logger.reload(options)`

Reloads the logger with updated options.

- `options`: An object to configure logging (e.g., log to external service, colors, static values).

### Pino Logger Methods

The logger instance supports all standard Pino logger methods like:

- `logger.info(message: string, ...args: any[])`
- `logger.error(message: string, ...args: any[])`
- `logger.warn(message: string, ...args: any[])`
- `logger.debug(message: string, ...args: any[])`
- `logger.log()` is the same as calling logger.info()

It also supports a custom level for 'notify' which you can setup alerts for
- `logger.notify(message: string, ...args: any[])`

## License

This project is licensed under the MIT License.