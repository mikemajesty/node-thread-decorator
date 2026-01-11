/**
 * Options for the RunInNewThread decorator.
 */
export interface RunInNewThreadOptions {
  /**
   * Maximum execution time in milliseconds.
   * If the worker exceeds this time, it will be terminated and an error will be thrown.
   */
  timeout?: number;
}

/**
 * Error thrown when a worker execution times out.
 */
export interface WorkerTimeoutError extends Error {
  /**
   * Context information about where the timeout occurred.
   * Format: "ClassName/methodName"
   */
  context: string;
}

/**
 * Decorator that executes the decorated method in a separate worker thread.
 * 
 * This decorator allows CPU-intensive operations to run without blocking
 * the main event loop. The decorated method will always return a Promise.
 * 
 * @param timeout - Optional maximum execution time in milliseconds.
 *                  If not provided, there is no timeout limit.
 * @returns A method decorator that wraps the method to run in a worker thread.
 * 
 * @example
 * ```typescript
 * class Calculator {
 *   @RunInNewThread(5000) // 5 second timeout
 *   async heavyComputation(iterations: number): Promise<number> {
 *     let result = 0;
 *     for (let i = 0; i < iterations; i++) {
 *       result += Math.sqrt(i);
 *     }
 *     return result;
 *   }
 * }
 * ```
 * 
 * @remarks
 * - Only works with class methods (not standalone functions)
 * - The method runs in an isolated context without access to closures
 * - The `this` context is not available inside the worker
 * - All arguments must be serializable (no functions or class instances)
 * - Use `require()` inside the method for external dependencies
 * 
 * @see {@link https://github.com/mikemajesty/node-thread-decorator} for more examples
 */
export function RunInNewThread(
  timeout?: number
): (
  target: object,
  propertyKey: string | symbol,
  descriptor: PropertyDescriptor
) => PropertyDescriptor;

