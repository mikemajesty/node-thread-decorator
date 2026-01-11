/**
 * External async service that simulates a real-world dependency
 * like a database client, HTTP client, or any external service.
 */
export class ExternalService {
  private data: Map<string, unknown> = new Map()

  async fetchData(id: string): Promise<{ id: string; value: number; timestamp: Date }> {
    // Simulate async operation (like API call or DB query)
    await this.delay(10)
    return {
      id,
      value: Math.floor(Math.random() * 100),
      timestamp: new Date()
    }
  }

  async saveData(id: string, data: unknown): Promise<boolean> {
    await this.delay(10)
    this.data.set(id, data)
    return true
  }

  async processInBatch(ids: string[]): Promise<Array<{ id: string; processed: boolean }>> {
    await this.delay(10)
    return ids.map(id => ({ id, processed: true }))
  }

  async throwAsyncError(): Promise<void> {
    await this.delay(10)
    throw new Error('External service error')
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

export class Calculator {
  async add(a: number, b: number): Promise<number> {
    return a + b
  }

  async multiply(a: number, b: number): Promise<number> {
    return a * b
  }

  async complexOperation(values: number[]): Promise<number> {
    // Simulate complex async calculation
    await new Promise(resolve => setTimeout(resolve, 5))
    return values.reduce((acc, val) => acc + val, 0)
  }
}
