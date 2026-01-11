import { parentPort } from 'worker_threads'

/**
 * Converts any function/method string to a valid function expression.
 * Handles: regular functions, async functions, arrow functions, and class methods.
 */
const toFunctionExpression = (code: string): string => {
  const trimmed = code.trim()

  // Already a valid function expression or arrow function
  if (/^(async\s+)?function[\s(]/.test(trimmed) || /^(\(|[a-zA-Z_$]\w*\s*=>)/.test(trimmed)) {
    return code
  }

  // Class method: "methodName(...) { ... }" or "async methodName(...) { ... }"
  const isAsync = trimmed.startsWith('async ')
  const paramsStart = trimmed.indexOf('(')

  if (paramsStart === -1) return code

  const fnBody = trimmed.slice(paramsStart)
  return isAsync ? `async function${fnBody}` : `function${fnBody}`
}

if (parentPort) {
  parentPort.on('message', async ([fnCode, args]: [string, unknown[]]) => {
    try {
      const executableFn = toFunctionExpression(fnCode)

      // eslint-disable-next-line @typescript-eslint/no-implied-eval
      const fn = new Function('require', `return ${executableFn}`)(require)
      const result = await fn.apply({}, args)

      parentPort?.postMessage({ success: result })
    } catch (e: unknown) {
      const error = e as Error
      parentPort?.postMessage({
        error: {
          message: error.message,
          stack: error.stack,
          name: error.name
        }
      })
    }
  })
}

