# Node Thread Decorator

[![node version][node-image]][node-url]
[![npm version](https://img.shields.io/npm/v/node-thread-decorator.svg?style=flat-square)](https://www.npmjs.com/package/node-thread-decorator)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)

[node-image]: https://img.shields.io/badge/node.js-%3E=_18.0-green.svg?style=flat-square
[node-url]: http://nodejs.org/download/

A TypeScript decorator that executes class methods in separate Node.js worker threads, preventing CPU-intensive operations from blocking the main event loop.

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [API Reference](#api-reference)
- [Usage Examples](#usage-examples)
- [Important Limitations](#important-limitations)
- [Using External Dependencies](#using-external-dependencies)
- [Best Practices](#best-practices)
- [License](#license)

## Installation

```bash
npm install node-thread-decorator
```

## Quick Start

```typescript
import { RunInNewThread } from 'node-thread-decorator';

class Calculator {
  @RunInNewThread()
  async heavyComputation(iterations: number): Promise<number> {
    let result = 0;
    for (let i = 0; i < iterations; i++) {
      result += Math.sqrt(i) * Math.sin(i);
    }
    return result;
  }
}

const calc = new Calculator();
const result = await calc.heavyComputation(10000000);
```

## API Reference

### `@RunInNewThread(timeout?: number)`

A method decorator that executes the decorated method in a separate worker thread.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `timeout` | `number` | No | Maximum execution time in milliseconds. If exceeded, the worker is terminated and an error is thrown. |

**Returns:** `Promise<T>` - The decorated method always returns a Promise, even if the original method was synchronous.

## Usage Examples

### Basic Usage

```typescript
import { RunInNewThread } from 'node-thread-decorator';

class MyService {
  @RunInNewThread()
  async processData(data: number[]): Promise<number> {
    return data.reduce((sum, n) => sum + n, 0);
  }
}
```

### With Timeout

```typescript
class MyService {
  @RunInNewThread(5000) // 5 second timeout
  async longRunningTask(): Promise<string> {
    // If this takes more than 5 seconds, it will throw an error
    return 'completed';
  }
}
```

### NestJS Integration

```typescript
import { Controller, Get } from '@nestjs/common';
import { RunInNewThread } from 'node-thread-decorator';

@Controller()
export class HealthController {
  @RunInNewThread()
  heavyOperation(milliseconds: number): void {
    const start = Date.now();
    while (Date.now() - start < milliseconds) {
      // CPU-intensive work
    }
  }

  @Get('/health')
  async getHealth(): Promise<string> {
    await this.heavyOperation(10000); // Won't block the main thread
    return 'OK';
  }
}
```

## Important Limitations

### 1. Class Methods Only

The decorator **only works with class methods**. Standalone functions are not supported.

```typescript
// ✅ Supported - Class method
class MyClass {
  @RunInNewThread()
  async myMethod() { /* ... */ }
}

// ❌ Not Supported - Standalone function
@RunInNewThread() // This won't work
function myFunction() { /* ... */ }
```

### 2. No Access to External Scope (Closures)

Methods executed in worker threads **cannot access variables, imports, or closures** from the original scope. Each worker runs in an isolated context.

```typescript
import { someHelper } from './helpers';

const CONFIG = { maxRetries: 3 };

class MyService {
  @RunInNewThread()
  async process(): Promise<void> {
    // ❌ This will fail - 'someHelper' is not defined in worker
    someHelper();
    
    // ❌ This will fail - 'CONFIG' is not defined in worker
    console.log(CONFIG.maxRetries);
  }
}
```

### 3. No Access to `this` Context

The `this` keyword inside decorated methods does **not** refer to the class instance. Instance properties and other methods are not accessible.

```typescript
class MyService {
  private value = 42;

  @RunInNewThread()
  async getValue(): Promise<number> {
    // ❌ This will fail - 'this.value' is undefined in worker
    return this.value;
  }

  @RunInNewThread()
  async callOther(): Promise<void> {
    // ❌ This will fail - 'this.otherMethod' is not a function in worker
    this.otherMethod();
  }

  otherMethod() { /* ... */ }
}
```

### 4. Arguments Must Be Serializable

All arguments passed to decorated methods must be serializable (transferable via `postMessage`). Functions, class instances, and circular references cannot be passed.

```typescript
class MyService {
  @RunInNewThread()
  async process(data: unknown): Promise<void> {
    // ...
  }
}

// ✅ Supported types
await service.process({ name: 'John', age: 30 }); // Plain objects
await service.process([1, 2, 3]);                  // Arrays
await service.process('hello');                    // Primitives
await service.process(null);                       // null/undefined

// ❌ Not supported
await service.process(() => {});                   // Functions
await service.process(new MyClass());              // Class instances
await service.process(circularRef);                // Circular references
```

## Using External Dependencies

To use external modules inside a decorated method, you must use `require()` **inside** the method body with the **absolute path** to the module.

### Pattern for External Dependencies

```typescript
import { RunInNewThread } from 'node-thread-decorator';
import path from 'path';

class MyService {
  @RunInNewThread()
  async processWithExternal(servicePath: string, data: number[]): Promise<number> {
    // ✅ Correct - require() inside the method with absolute path
    const { Calculator } = require(servicePath);
    const calc = new Calculator();
    return calc.sum(data);
  }
}

// Usage - pass the absolute path as argument
const servicePath = path.resolve(__dirname, './services/calculator');
const result = await service.processWithExternal(servicePath, [1, 2, 3]);
```

### Using Node.js Built-in Modules

Built-in modules can be required directly by name:

```typescript
class MyService {
  @RunInNewThread()
  async readFileInThread(filePath: string): Promise<string> {
    const fs = require('fs');
    const path = require('path');
    return fs.readFileSync(filePath, 'utf-8');
  }

  @RunInNewThread()
  async getSystemInfo(): Promise<object> {
    const os = require('os');
    return {
      cpus: os.cpus().length,
      memory: os.totalmem(),
      platform: os.platform()
    };
  }
}
```

### Complete Example with External Service

```typescript
// services/calculator.ts
export class Calculator {
  sum(numbers: number[]): number {
    return numbers.reduce((a, b) => a + b, 0);
  }

  multiply(numbers: number[]): number {
    return numbers.reduce((a, b) => a * b, 1);
  }
}

// my-service.ts
import { RunInNewThread } from 'node-thread-decorator';
import path from 'path';

class MyService {
  private readonly calculatorPath = path.resolve(__dirname, './services/calculator');

  @RunInNewThread()
  async calculate(calculatorPath: string, numbers: number[]): Promise<number> {
    const { Calculator } = require(calculatorPath);
    const calc = new Calculator();
    return calc.sum(numbers);
  }

  async run(): Promise<number> {
    // Pass the absolute path as an argument
    return this.calculate(this.calculatorPath, [1, 2, 3, 4, 5]);
  }
}
```

## Best Practices

### ✅ Do

- Use for CPU-intensive operations (cryptography, data processing, complex calculations)
- Pass all required data as arguments
- Use `require()` inside the method for external dependencies
- Always use absolute paths when requiring local modules
- Handle errors with try/catch blocks
- Set appropriate timeouts for long-running operations

### ❌ Don't

- Don't use for I/O-bound operations (the event loop handles these efficiently)
- Don't try to access external scope variables
- Don't use `this` to access instance properties
- Don't pass non-serializable data as arguments
- Don't use relative paths with `require()` inside workers

### When to Use

| Use Case | Recommendation |
|----------|----------------|
| Heavy mathematical computations | ✅ Use decorator |
| Image/video processing | ✅ Use decorator |
| Data encryption/hashing | ✅ Use decorator |
| Database queries | ❌ Use async/await |
| HTTP requests | ❌ Use async/await |
| File I/O | ❌ Use async/await |

## Contributors

[<img alt="mikemajesty" src="https://avatars1.githubusercontent.com/u/11630212?s=460&v=4&s=117" width="117">](https://github.com/mikemajesty)

## License

MIT License - see [LICENSE](https://opensource.org/licenses/mit-license.php) for details
