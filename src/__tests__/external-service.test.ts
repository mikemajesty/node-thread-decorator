import { RunInNewThread } from '../thread.decorator'
import * as path from 'path'

/**
 * Tests for scenarios where decorated methods call external classes/services.
 * This is a common real-world pattern where a service method depends on other services.
 * 
 * IMPORTANT: Due to how the decorator serializes functions, external dependencies
 * must be required INSIDE the decorated method using ABSOLUTE paths,
 * since the worker runs from a different context.
 */

// Resolve the absolute path to the services directory
const servicesPath = path.resolve(__dirname, './services/external-service')

class ServiceWithExternalDependency {
  /**
   * This approach WORKS: require the dependency inside the method with absolute path.
   * The require is executed in the worker thread context.
   */
  @RunInNewThread()
  async fetchWithExternalService(id: string, servicePath: string): Promise<{ id: string; value: number }> {
    const { ExternalService } = require(servicePath)
    const service = new ExternalService()
    const result = await service.fetchData(id)
    return { id: result.id, value: result.value }
  }

  @RunInNewThread()
  async useCalculator(a: number, b: number, servicePath: string): Promise<{ sum: number; product: number }> {
    const { Calculator } = require(servicePath)
    const calc = new Calculator()
    const sum = await calc.add(a, b)
    const product = await calc.multiply(a, b)
    return { sum, product }
  }

  @RunInNewThread()
  async processBatchWithService(ids: string[], servicePath: string): Promise<Array<{ id: string; processed: boolean }>> {
    const { ExternalService } = require(servicePath)
    const service = new ExternalService()
    return service.processInBatch(ids)
  }

  @RunInNewThread()
  async chainedAsyncOperations(values: number[], servicePath: string): Promise<{ sum: number; doubled: number }> {
    const { Calculator } = require(servicePath)
    const calc = new Calculator()
    
    // Chain multiple async operations
    const sum = await calc.complexOperation(values)
    const doubled = await calc.multiply(sum, 2)
    
    return { sum, doubled }
  }

  @RunInNewThread()
  async handleExternalServiceError(servicePath: string): Promise<void> {
    const { ExternalService } = require(servicePath)
    const service = new ExternalService()
    await service.throwAsyncError()
  }

  @RunInNewThread()
  async multipleServicesInOneMethod(id: string, a: number, b: number, servicePath: string): Promise<{
    fetchedId: string
    calculatedSum: number
  }> {
    const { ExternalService, Calculator } = require(servicePath)
    
    const externalService = new ExternalService()
    const calculator = new Calculator()
    
    // Use both services
    const fetchResult = await externalService.fetchData(id)
    const sum = await calculator.add(a, b)
    
    return {
      fetchedId: fetchResult.id,
      calculatedSum: sum
    }
  }
}

describe('External Service Integration', () => {
  let service: ServiceWithExternalDependency

  beforeEach(() => {
    service = new ServiceWithExternalDependency()
  })

  describe('Single External Service', () => {
    it('should call external service and return data', async () => {
      const result = await service.fetchWithExternalService('test-123', servicesPath)
      
      expect(result.id).toBe('test-123')
      expect(typeof result.value).toBe('number')
    })

    it('should use Calculator service for operations', async () => {
      const result = await service.useCalculator(10, 5, servicesPath)
      
      expect(result.sum).toBe(15)
      expect(result.product).toBe(50)
    })

    it('should process batch with external service', async () => {
      const ids = ['id-1', 'id-2', 'id-3']
      const result = await service.processBatchWithService(ids, servicesPath)
      
      expect(result).toHaveLength(3)
      expect(result[0]).toEqual({ id: 'id-1', processed: true })
      expect(result[1]).toEqual({ id: 'id-2', processed: true })
      expect(result[2]).toEqual({ id: 'id-3', processed: true })
    })
  })

  describe('Chained Async Operations', () => {
    it('should handle chained async operations with external service', async () => {
      const result = await service.chainedAsyncOperations([1, 2, 3, 4, 5], servicesPath)
      
      expect(result.sum).toBe(15) // 1+2+3+4+5
      expect(result.doubled).toBe(30) // 15 * 2
    })
  })

  describe('Error Handling with External Services', () => {
    it('should propagate errors from external service', async () => {
      await expect(service.handleExternalServiceError(servicesPath)).rejects.toThrow('External service error')
    })
  })

  describe('Multiple Services in One Method', () => {
    it('should use multiple external services in a single decorated method', async () => {
      const result = await service.multipleServicesInOneMethod('user-456', 100, 200, servicesPath)
      
      expect(result.fetchedId).toBe('user-456')
      expect(result.calculatedSum).toBe(300)
    })
  })

  describe('Concurrent Calls with External Services', () => {
    it('should handle concurrent calls to methods using external services', async () => {
      const promises = [
        service.fetchWithExternalService('id-1', servicesPath),
        service.fetchWithExternalService('id-2', servicesPath),
        service.fetchWithExternalService('id-3', servicesPath)
      ]
      
      const results = await Promise.all(promises)
      
      expect(results).toHaveLength(3)
      expect(results[0].id).toBe('id-1')
      expect(results[1].id).toBe('id-2')
      expect(results[2].id).toBe('id-3')
    })

    it('should handle concurrent calls to different methods using different services', async () => {
      const [fetchResult, calcResult] = await Promise.all([
        service.fetchWithExternalService('concurrent-test', servicesPath),
        service.useCalculator(7, 8, servicesPath)
      ])
      
      expect(fetchResult.id).toBe('concurrent-test')
      expect(calcResult.sum).toBe(15)
      expect(calcResult.product).toBe(56)
    })
  })
})
