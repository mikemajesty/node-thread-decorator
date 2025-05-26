# Node Thread Decorator

[![node version][node-image]][node-url]

[node-image]: https://img.shields.io/badge/node.js-%3E=_18.0-green.svg?style=flat-square
[node-url]: http://nodejs.org/download/

### Install

```
 npm i -S node-thread-decorator
```

### Usage

- Import

```ts
import { RunInNewThread } from "node-thread-decorator";
```
```ts
import { Controller, Get } from '@nestjs/common';

import { RunInNewThread } from 'node-thread-decorator';

@Controller()
export class HealthController {
  /**
   * Blocks the main thread for a specified duration in milliseconds.
   * This function runs in a new thread due to the decorator `@RunInNewThread`.
   *
   * @param {number} milliseconds - The time to block the thread in milliseconds.
   */
  @RunInNewThread()
  blockMainThread(milliseconds: number) {
    const start = Date.now();
    while (Date.now() - start < milliseconds) {
      // Looping until time has passed
    }
  }

  /**
   * Endpoint that returns health information of the service.
   * It will block the main thread for 10 seconds to simulate a heavy operation.
   *
   * @returns {Promise<string>} - A promise that resolves when the health check is completed.
   */
  @Get(['/health', '/'])
  async getHealth(): Promise<string> {
    this.blockMainThread(10000); // Simulating blocking the thread for 10 seconds
    console.log("Health check completed");
    return "APP UP!"
  }
}
```

---

The following is a list of all the people that have contributed Node Thread Decorator. Thanks for your contributions!

[<img alt="mikemajesty" src="https://avatars1.githubusercontent.com/u/11630212?s=460&v=4&s=117" width="117">](https://github.com/mikemajesty)

## License

It is available under the MIT license.
[License](https://opensource.org/licenses/mit-license.php)
