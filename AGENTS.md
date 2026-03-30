# AGENTS.md

## Project Overview

**@timber-logging/logger** is a TypeScript logging library built on top of [Pino](https://getpino.io/) with integration for the Timber Logging service. It provides a simple, flexible API for logging with support for both local console output and remote log aggregation.

## Repository Structure

```
npm-timber-logging/
├── src/                     # TypeScript source files
│   ├── index.ts            # Main export (exports Logger class)
│   ├── logger.ts           # Logger class implementation
│   └── pino-transport.ts   # Pino transport for Timber integration
├── dist/                    # Compiled JavaScript output
├── package.json            # Package configuration (v1.4.0)
├── tsconfig.json           # TypeScript configuration
└── README.md               # User documentation
```

## Key Components

### Logger Class (`src/logger.ts`)

The main `Logger` class wraps Pino and provides these methods:
- `info()`, `warn()`, `warning()`, `error()`, `fatal()`, `trace()`, `log()` - Standard log levels
- `notify()` - Custom level (55) for notifications without using error level
- `reload(options)` - Reinitialize the logger with new options
- `waitToFinish(maxWaitMs)` - Wait for pending logs to be sent (important for serverless)

**Flexible argument formats supported:**
- `(message: string, obj?: object)` - Timber custom format
- `(obj: object, message: string, ...args)` - Standard Pino format
- `(message: string, ...args)` - Simple message with args

### Pino Transport (`src/pino-transport.ts`)

Handles log output to:
1. **Console** - Colored terminal output (configurable)
2. **Timber service** - HTTP POST to Timber Logging API

**TimberOptions interface:**
```typescript
interface TimberOptions {
  apiKey?: string;           // Or use TIMBER_API_KEY env var
  timberId?: string;         // Or use TIMBER_ID env var
  logToTimber?: boolean;     // Enable remote logging (default: true)
  logToConsole?: boolean;    // Enable console output (default: true)
  usePinoFormat?: boolean;   // Use Pino's native argument format
  logLevel?: Level;          // Minimum log level
  colorConsole?: boolean;    // Colored console output (default: true)
  staticLogValues?: Record<string, any>;  // Values added to every log
}
```

## Development Commands

```bash
# Build TypeScript to JavaScript
npm run build

# Deploy to npm (uses deploy.sh)
npm run deploy-npm
```

## Build Configuration

- **Target**: ES2020
- **Module**: CommonJS
- **Node.js**: >=20.0.0
- **Output**: `dist/` directory with `.js` and `.d.ts` files

## Dependencies

- **Runtime**: `pino@^10.3.1`
- **Dev**: `typescript@^6.0.2`, `@types/node@^20.19.37`

## Code Conventions

1. **Export pattern**: Single named export (`Logger`) from index
2. **Logging**: Uses Pino internally; custom transport wraps Pino's Writable stream
3. **Async considerations**: `waitToFinish()` tracks in-flight HTTP requests for serverless environments
4. **Color codes**: ANSI escape sequences for console color output

## Testing Notes

⚠️ No test suite currently exists (`npm test` returns an error). When adding tests:
- Consider mocking the Timber API endpoint
- Test all argument format variations
- Test `waitToFinish()` behavior with concurrent logs

## Common Issues

**NextJS/Webpack bundling**: The `thread-stream` dependency (from Pino) may cause build errors. Solution:
```js
// next.config.js
const config = {
  serverExternalPackages: ['thread-stream']
};
export default config;
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `TIMBER_API_KEY` | API key for Timber service authentication |
| `TIMBER_ID` | Timber project/application identifier |

## Making Changes

1. Edit source files in `src/`
2. Run `npm run build` to compile
3. Test changes locally before publishing
4. Update version in `package.json` before deploying

## License

MIT License - See LICENSE file for details.
