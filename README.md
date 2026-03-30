# Timber Logging

`@timber-logging/logger` is a simple logging utility for Node.js which is based on Pino . It supports logging to both the console and [Timber Logging](https://www.timberlogging.co) for alerts and storage.

## Installation

Install the package via npm:

```bash
npm install @timber-logging/logger
```

If you are using NextJs then it is likely you will need to add:
    `serverExternalPackages: ['thread-stream']`
To your `next.config.js` file. See the [Troubleshooting](#troubleshooting) section for more information.

## Usage

### 1. Sign up to [Timber Logging](https://www.timberlogging.co)
* Visit https://www.timberlogging.co and sign up (you can sign up to a free trial with no credit card).
* Generate an API key and save it to TIMBER_API_KEY in your environment variables
* Copy your Timber ID and save it to TIMBER_ID in your environment variables
* Configure any alerts you want to set up

### 2. Import and initialize the logger with custom options:

```js
// create a timber-logging.js or ts file
import { Logger } from '@timber-logging/logger';

const options = {
  logToTimber: true,
  logToConsole: true,
  colorConsole: true,
  staticLogValues: { project: "MY_PROJECT" },
};

export const timber = new Logger(options);
```

**Note:**
- If you don't have the API key saved as TIMBER_API_KEY in your env variables then you will need to have `options.apiKey = 'Your API key'`
- If you don't have the Timber ID saved as TIMBER_ID in your env variables then you will need to have `options.timberId = 'Your Timber ID'`

### 3. Start logging

```js
// wherever you want to log
import { timber } from '../timber-logging.js'; // the file you created in the previous step

timber.notify("TIMBER!!!"); // creates a log with our custom notify level
timber.info("Error Message", { "my": "data" }); // any fields on the object are added to the log object
timber.info({ "my": "data" }, "Error Message"); // if you switch the message and data around the other way it is also fine
timber.info("Key:", key, "Value:", value); // will be concatenated
```


## Options

You can configure the logger by passing an options object when instantiating the `Logger`. Here are the available options:

- `apiKey` (string): API key required for Timber Logging (optional if env TIMBER_API_KEY is set)
- `timberId` (string): The Timber ID required for Timber Logging (optional if env TIMBER_ID is set)
- `logToTimber` (boolean): Enable/disable logging to an external service (default: true).
- `logToConsole` (boolean): Enable/disable logging to the console (default: true).
- `colorConsole` (boolean): Enable/disable colored console output (default: true).
- `staticLogValues` (object): Static values that will be included in every log sent to Timber Logging. Examples would be for the project, environment etc
- `logLevel` (string): default is info, other options: trace, debug, info, warn, error, fatal
- `usePinoFormat` (boolean): If you are migrating from pino and want to continue to use their API, then select true. See the Pino section below for more details.


## API

### `new Logger(options)`

Creates a new `Logger` instance with the provided `options`.

- `options`: An object that configures the logger. See the [Options](#options) section for details.

### `timber.reload(options)`

Reloads the logger with updated options. See below for further reload examples.

- `options`: An object to configure logging (e.g., log to external service, colors, static values).

### `timber.waitToFinish(milliseconds)`
This is used in serverless environments where you need to ensure the logs have been sent before the function exits. See the *Serverless* section below.
Where milliseconds is options (default is 250).

### Pino/console Logger Methods

The logger instance supports Pino/console logger methods like:

- `timber.info(message: string, ...args: any[])`
- `timber.error(message: string, ...args: any[])`
- `timber.warn(message: string, ...args: any[])`
- `timber.debug(message: string, ...args: any[])`
- `timber.log()` is the same as calling logger.info()
- `timber.warning()` is the same as calling logger.warn()

It also supports a custom level for 'notify' which you can setup alerts for
- `timber.notify(message: string, ...args: any[])`

\
**Logging Data**\
The most common usage is wanting to log a string and some data. The timber.info() methods all support `timber.info(string, object)` or `timber.info(object, string)` to make it easy to switch from other logging solutions.

**Pino**\
Timber logger is designed to be a drop in replacement for pino and supports the pino API like `pino.info({ mergingObject: 'hello' }, 'Log message')` so you can replace this with `timber.info({ mergingObject: 'hello' }, 'Log message')` and the merging object will be merged into the logging object in the same way.

We use pino under the hood, if you set the option `usePinoFormat=true` then pino will be used to process the log. In most cases you can switch from pino to timber without any changes and without switching this setting on, see the Logging Data section above for more information.

**Console**\
Timber is also designed to be a drop in replacement for `console.log('Message:', message, 'Code:', code)` which can be replaced by `timber.log('Message:', message, 'Code:', code)`. Where the arguments are strings, these are just concatenated with a space.

If you are using string replacement like `console.log("Error: %s", error)`, this will not work with timber. Use template strings instead, eg `` `Error: ${error}` ``

## Timber Indexed Fields
When you send logs to Timber, some fields are indexed so they can be filtered. Not all fields are indexed and only part of the field might be indexed if it is too big, this is to keep the costs down. Here are the fields that are indexed and the synonyms which can be used as an alternative.

| Indexed Field | Accepted Synonyms / Alternatives |
| :--- | :--- |
| **message** | `msg`, `description`, `text`, `str`, `error` |
| **level** | `severity` |
| **project** | — |
| **host** | `hostname` |
| **url** | `path`, `pathname`, `address` |
| **method** | `httpMethod` |
| **statusCode** | `status` |
| **ipAddress** | `ip` |
| **environment** | `env` |
| **requestId** | — |
| **userId** | `user` |
| **createdDate** | `time`, `date` |

> **Note:** If a field is too large, only the initial portion may be indexed to optimize performance.


## Reload Options from .env
Depending on where your code is running, sometimes using `const timber = new Logger(options)` where options uses environment variables that are not yet loaded will mean that the wrong options are used.

Modify your timber-logging.js or ts file to include a reloadTimber() function which you can call after your environment variables are loaded.

```js
// create a timber-logging.js or ts file
export const timber = new Logger(getLoggerOptions());

export function reloadTimber() {
  timber.reload(getLoggerOptions());
}

/**
 * Gets the options for the logger
 * @returns {object}
 */
function getLoggerOptions() {
  const options = {
    apiKey: process.env.TIMBER_API_KEY,
    timberId: process.env.TIMBER_ID,
    logToTimber: true,
    logToConsole: true,
    colorConsole: true,
    staticLogValues: { environment: process.env.NODE_ENV },
  };

  // If you only want to send logs to timber logging in production, you could do this
  if (process.env.NODE_ENV !== 'production') {
    return { ...options, logToTimber: false, logToConsole: true };
  }

  return options;
}
```

## Production vs Development vs Test
If you want different logging depending on the environment.

For example, if you wanted to turn on/off the logging to the console or Timber depending on the environment, see the example in *Reload Options from .env* to see how this can be acheived.

## Serverless Environments
Often in serverless environments, the process will be terminated as soon as a response is sent. This can mean that the process is terminated before logs are sent to Timber Logging.

To stop this from happening, add `await timber.waitToFinish()` before your function exits. If there are no logs being sent then the waitToFinish function immediatly returns. If a log is currently being sent, then the process will wait 250 milliseconds or until the log is sent, whichever happens first. You can modify the number of milliseconds it waits by passing in a number like `waitToFinish(milliseconds)`.

This gives the application enough time to send the log to timber, but it doesn't wait for the response from sending the log to timber as this would slow down the responses to your users.

```js
// Eg within a NextJs route.js or ts file

export async function GET(req) {
  let session;
  try {
    session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      const error = `You must be logged in, please refresh the page`;
      return new Response(JSON.stringify({ error }), { status: 403 });
    }

    let data = await getSomeData(session);

    await timber.waitToFinish(); // only waits if a log is being sent
    return new Response(JSON.stringify({ ...data }));
  } catch (e) {
    timber.error(e.message, { url: req.url, user: session?.userId, err: e });
    await timber.waitToFinish(); // only waits if a log is being sent
    const error = `An error occurred. Please try again`;
    return new Response(JSON.stringify({ error }), { status: 500 });
  }
}
```

## Log only what you need
Just like in a forest, we believe you should only log what you need. I will save you the rant about clearfelling old growth forests and try and stay on topic.

You can log everything, every request, all request data, urls etc. But what do you actually *need*? Different projects will have different requirements, but here is one method of reducing the logs that you're storing.

For each endpoint that returns data, you can standardise how that data is returned, so that if that object has and error or warning field, then something wasn't right, and the request body, url, user and the message can all be logged.

This gives you all the information to investigate any issues without clearfelling the forest.

````js
// Eg within a NextJs route.js or ts file

export async function POST(req) {
  let session;
  let body;
  try {
    session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      const error = `You must be logged in, please refresh the page`;
      return new Response(JSON.stringify({ error }), { status: 403 });
    }

    body = await req.json();
    let data = await getSomeData(user, body);

    // If there was an error or warning, log the request body, url and user ID
    if (data.error) {
      timber.error(data.error, { url: req.url, user: session?.userId, body });
    } else if (data.warning) {
      timber.warn(data.warning, { url: req.url, user: session?.userId, body });
    }
    // if your serverless function terminates after the response, use this to
    // ensure logs are sent before the response is provided and function terminated
    await timber.waitToFinish(); 
    return new Response(JSON.stringify({ ...data }));
  } catch (e) {
    timber.error(e.message, { url: req.url, user: session?.userId, err: e, body });
    await timber.waitToFinish();
    const error = `An error occurred. Please try again`;
    return new Response(JSON.stringify({ error }), { status: 500 });
  }
}
````

## Troubleshooting
If you are seeing a build or runtime error like
`Module not found: Can't resolve 'thread-stream'`
or
`Error: Cannot find module 'thread-stream'`

Update your `next.config.js` file:
``` js
// next.config.js
const config = {
  serverExternalPackages: ['thread-stream']
};
export default config;
```

This could be needed because we use Pino under the hood, and pino depends on thread-stream. NextJs/Webpack struggles to bundle this dependency correctly, so serverExternalPackages tells the bundler to exclude it from the build and let Node.js load it from node_modules at runtime instead.

If you are not using NextJs then look up a similar solution for your bundler.

## Minified Stack

If you log an error stack trace and it is minified, you can our [Maxify Stack Project](http://www.timberlogging.co/maxify-stack) to decode it. It is a free utility you can run locally and has a basic UI.

## License

This project is licensed under the MIT License.
