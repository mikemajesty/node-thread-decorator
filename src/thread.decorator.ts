import { red } from 'colorette';
import { Worker } from 'worker_threads';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyFunction = (...args: any[]) => any;

/**
 * Decorator that executes the decorated method in a separate worker thread.
 * 
 * @param timeout - Optional maximum execution time in milliseconds.
 * @returns A method decorator that wraps the method to run in a worker thread.
 */
export function RunInNewThread(timeout?: number) {
  return function (
    target: object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ): PropertyDescriptor {
    const originalMethod: AnyFunction = descriptor.value

    descriptor.value = async function (...args: unknown[]): Promise<unknown> {
      return new Promise((resolve, reject) => {
        const fnCode = originalMethod.toString()

      const workerFile = __filename.endsWith('.ts') ? `${__dirname}/thread.ts` : `${__dirname}/thread.js`

        const worker = new Worker(workerFile, {
          execArgv: __filename.endsWith('.ts') ? ['-r', 'ts-node/register'] : []
        })
        let timeoutId: NodeJS.Timeout | null = null
        let isResolved = false

        const cleanup = () => {
          if (timeoutId) {
            clearTimeout(timeoutId)
            timeoutId = null
          }
          worker.terminate()
        }

        const resolveOnce = (value: unknown) => {
          if (!isResolved) {
            isResolved = true
            cleanup()
            resolve(value)
          }
        }

        const rejectOnce = (error: Error) => {
          if (!isResolved) {
            isResolved = true
            cleanup()
            reject(error)
          }
        }

        worker.postMessage([fnCode, args])

        if (timeout) {
          timeoutId = setTimeout(() => {
            const className = target.constructor.name
            const methodName = String(propertyKey)
            const error = new Error(`Worker execution timed out after ${timeout} ms`)
            Object.assign(error, { context: `${className}/${methodName}` })
            rejectOnce(error)
          }, timeout)
        }

        worker.once('message', (value: { error?: Error; success?: unknown }) => {
          if (value.error) {
            const error = new Error(value.error.message)
            error.stack = value.error.stack
            error.name = value.error.name
            rejectOnce(error)
          } else {
            resolveOnce(value.success)
          }
        })

        worker.once('error', (err: Error) => {
          if (err.name === 'ReferenceError') {
            console.error(red('Worker reference error: '), err.message)
            rejectOnce(new Error('Reference error in worker: ' + err.message))
          } else {
            rejectOnce(err)
          }
        })

        worker.once('exit', (code: number) => {
          if (code !== 0 && !isResolved) {
            rejectOnce(new Error(`Worker stopped with exit code ${code}`))
          }
        })
      })
    }

    return descriptor
  }
}
