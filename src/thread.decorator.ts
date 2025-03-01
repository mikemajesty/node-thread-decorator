import { red } from 'colorette';
import { Worker } from 'worker_threads';

export function RunInNewThread(timeout?: number) {
  return function (target: object, key: string, descriptor: PropertyDescriptor): PropertyDescriptor {
    const originalMethod = descriptor.value;

    // Modifying the descriptor to replace the original method with one that runs in a worker thread
    descriptor.value = function (...args: unknown[]) {
      // Convert the method code to string to send to the worker
      const fnCode = originalMethod.toString();

      // Create a new Worker instance to run the method in a separate thread
      const worker = new Worker(`${__dirname}/thread.js`);

      let timeoutId: NodeJS.Timeout | null = null;

      // Send the method code and arguments to the worker
      worker.postMessage([fnCode, args]);

      // Set a timeout if specified
      if (timeout) {
        timeoutId = setTimeout(() => {
          const className = target.constructor.name;
          const methodName = key;
          const error = new Error('worker execution timed out.');
          Object.assign(error, { context: `${className}/${methodName}` });

          console.error(error);
          worker.terminate(); // Terminate the worker if it times out
        }, timeout);
      }

      // Handle messages received from the worker (either success or error)
      worker.on('message', (value: { error: Error; success: unknown }) => {
        if (timeoutId) clearTimeout(timeoutId); // Clear the timeout if the worker finishes early
        if (value.error) {
          return Promise.reject(value.error); // Reject if there's an error
        }

        if (value.success) {
          return Promise.resolve(value.success); // Resolve with the worker's result
        }
      });

      // Handle errors emitted by the worker thread
      worker.on('error', (err: Error) => {
        if (timeoutId) clearTimeout(timeoutId); // Clear timeout on error
        if (err.name === 'ReferenceError') {
          console.error(red('worker error '), err);
          return;
        }
        console.error(red('worker error '), err?.message ?? err);
      });

      // Handle worker exit (whether successful or with an error code)
      worker.on('exit', (code: number) => {
        if (timeoutId) clearTimeout(timeoutId); // Clear timeout on worker exit
        if (code !== 0) {
          console.error(red(`worker stopped with exit code ${code}`)); // Log if the worker exits with a non-zero code
        }
      });
    };

    return descriptor;
  };
}
