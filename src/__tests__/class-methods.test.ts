import { RunInNewThread } from '../thread.decorator'
import { threadId, isMainThread } from 'worker_threads'

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

class TestService {
  @RunInNewThread()
  async getThreadId(): Promise<number> {
    // Import inside the method so it works in the worker context
    const { threadId: workerThreadId } = require('worker_threads')
    return workerThreadId
  }

  @RunInNewThread()
  async add(a: number, b: number): Promise<number> {
    return a + b
  }

  @RunInNewThread()
  async throwError(): Promise<void> {
    throw new Error('This is a test error')
  }

  @RunInNewThread(100)
  async longRunningTask(): Promise<void> {
    await delay(500)
  }

  @RunInNewThread()
  async checkMainThread(): Promise<boolean> {
    // Import inside the method so it works in the worker context
    const { isMainThread: workerIsMainThread } = require('worker_threads')
    return workerIsMainThread
  }
}

describe('RunInNewThread Decorator', () => {
  let service: TestService

  beforeEach(() => {
    service = new TestService()
  })

  it('should run method in a different thread', async () => {
    const mainThreadId = threadId
    const workerThreadId = await service.getThreadId()

    console.log(`Main thread ID: ${mainThreadId}`)
    console.log(`Worker thread ID: ${workerThreadId}`)

    expect(workerThreadId).not.toBe(mainThreadId)
  })

  it('should return false for isMainThread inside the worker', async () => {
    const isWorkerMainThread = await service.checkMainThread()
    expect(isWorkerMainThread).toBe(false)
  })

  it('should pass arguments correctly to the worker thread', async () => {
    const result = await service.add(5, 10)
    expect(result).toBe(15)
  })

  it('should propagate errors from the worker thread', async () => {
    await expect(service.throwError()).rejects.toThrow('This is a test error')
  })

  it('should handle timeouts correctly', async () => {
    await expect(service.longRunningTask()).rejects.toThrow('Worker execution timed out after 100 ms')
  })
})
