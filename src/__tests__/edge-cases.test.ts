import { RunInNewThread } from '../thread.decorator'

/**
 * Edge cases and real-world scenarios that users might encounter
 */

class EdgeCaseService {
  // Test with complex nested objects
  @RunInNewThread()
  async processComplexObject(data: { user: { name: string; age: number }; items: string[] }): Promise<{
    processed: boolean
    userName: string
    itemCount: number
  }> {
    return {
      processed: true,
      userName: data.user.name.toUpperCase(),
      itemCount: data.items.length
    }
  }

  // Test with arrays
  @RunInNewThread()
  async processArray(numbers: number[]): Promise<number[]> {
    return numbers.map(n => n * 2)
  }

  // Test returning null
  @RunInNewThread()
  async returnNull(): Promise<null> {
    return null
  }

  // Test returning undefined
  @RunInNewThread()
  async returnUndefined(): Promise<undefined> {
    return undefined
  }

  // Test CPU-intensive work (prime number calculation)
  @RunInNewThread()
  async findPrimes(limit: number): Promise<number[]> {
    const primes: number[] = []
    for (let num = 2; num <= limit; num++) {
      let isPrime = true
      for (let i = 2; i <= Math.sqrt(num); i++) {
        if (num % i === 0) {
          isPrime = false
          break
        }
      }
      if (isPrime) primes.push(num)
    }
    return primes
  }

  // Test with string operations
  @RunInNewThread()
  async processString(text: string): Promise<{ length: number; reversed: string; uppercase: string }> {
    return {
      length: text.length,
      reversed: text.split('').reverse().join(''),
      uppercase: text.toUpperCase()
    }
  }

  // Test with boolean logic
  @RunInNewThread()
  async checkConditions(a: boolean, b: boolean): Promise<{ and: boolean; or: boolean; xor: boolean }> {
    return {
      and: a && b,
      or: a || b,
      xor: (a || b) && !(a && b)
    }
  }

  // Test with different error types
  @RunInNewThread()
  async throwTypeError(): Promise<void> {
    throw new TypeError('This is a type error')
  }

  @RunInNewThread()
  async throwRangeError(): Promise<void> {
    throw new RangeError('This is a range error')
  }

  // Test with JSON operations inside
  @RunInNewThread()
  async parseAndStringify(jsonString: string): Promise<string> {
    const parsed = JSON.parse(jsonString)
    parsed.processed = true
    return JSON.stringify(parsed)
  }

  // Test with Math operations
  @RunInNewThread()
  async mathOperations(a: number, b: number): Promise<{
    sum: number
    product: number
    power: number
    sqrt: number
  }> {
    return {
      sum: a + b,
      product: a * b,
      power: Math.pow(a, b),
      sqrt: Math.sqrt(a)
    }
  }

  // Test with many arguments
  @RunInNewThread()
  async manyArguments(a: number, b: string, c: boolean, d: number[], e: { key: string }): Promise<string> {
    return `${a}-${b}-${c}-${d.join(',')}-${e.key}`
  }

  // Test with default-like behavior (simulated)
  @RunInNewThread()
  async withOptionalArg(required: string, optional?: number): Promise<string> {
    const opt = optional ?? 42
    return `${required}-${opt}`
  }

  // Test returning a large object
  @RunInNewThread()
  async generateLargeArray(size: number): Promise<number[]> {
    const arr: number[] = []
    for (let i = 0; i < size; i++) {
      arr.push(i * 2)
    }
    return arr
  }

  // Test with async/await inside
  @RunInNewThread()
  async nestedAsyncOperations(): Promise<number> {
    const delay = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms))
    await delay(10)
    const result = 42
    await delay(10)
    return result
  }
}

describe('Edge Cases and Real-World Scenarios', () => {
  let service: EdgeCaseService

  beforeEach(() => {
    service = new EdgeCaseService()
  })

  describe('Complex Data Types', () => {
    it('should handle complex nested objects', async () => {
      const input = {
        user: { name: 'John', age: 30 },
        items: ['apple', 'banana', 'cherry']
      }
      const result = await service.processComplexObject(input)

      expect(result.processed).toBe(true)
      expect(result.userName).toBe('JOHN')
      expect(result.itemCount).toBe(3)
    })

    it('should handle arrays correctly', async () => {
      const result = await service.processArray([1, 2, 3, 4, 5])
      expect(result).toEqual([2, 4, 6, 8, 10])
    })

    it('should handle null return value', async () => {
      const result = await service.returnNull()
      expect(result).toBeNull()
    })

    it('should handle undefined return value', async () => {
      const result = await service.returnUndefined()
      expect(result).toBeUndefined()
    })
  })

  describe('CPU-Intensive Operations', () => {
    it('should execute CPU-intensive work in separate thread', async () => {
      const result = await service.findPrimes(50)
      expect(result).toEqual([2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47])
    })

    it('should generate large arrays', async () => {
      const result = await service.generateLargeArray(1000)
      expect(result.length).toBe(1000)
      expect(result[0]).toBe(0)
      expect(result[999]).toBe(1998)
    })
  })

  describe('String Operations', () => {
    it('should process strings correctly', async () => {
      const result = await service.processString('hello')
      expect(result.length).toBe(5)
      expect(result.reversed).toBe('olleh')
      expect(result.uppercase).toBe('HELLO')
    })
  })

  describe('Boolean Logic', () => {
    it('should handle boolean operations', async () => {
      const result = await service.checkConditions(true, false)
      expect(result.and).toBe(false)
      expect(result.or).toBe(true)
      expect(result.xor).toBe(true)
    })
  })

  describe('Error Handling', () => {
    it('should propagate TypeError', async () => {
      await expect(service.throwTypeError()).rejects.toThrow('This is a type error')
    })

    it('should propagate RangeError', async () => {
      await expect(service.throwRangeError()).rejects.toThrow('This is a range error')
    })
  })

  describe('JSON Operations', () => {
    it('should handle JSON parse/stringify inside worker', async () => {
      const input = JSON.stringify({ name: 'test', value: 123 })
      const result = await service.parseAndStringify(input)
      const parsed = JSON.parse(result)

      expect(parsed.name).toBe('test')
      expect(parsed.value).toBe(123)
      expect(parsed.processed).toBe(true)
    })
  })

  describe('Math Operations', () => {
    it('should perform math operations correctly', async () => {
      const result = await service.mathOperations(4, 3)
      expect(result.sum).toBe(7)
      expect(result.product).toBe(12)
      expect(result.power).toBe(64)
      expect(result.sqrt).toBe(2)
    })
  })

  describe('Multiple Arguments', () => {
    it('should handle many arguments of different types', async () => {
      const result = await service.manyArguments(1, 'test', true, [1, 2, 3], { key: 'value' })
      expect(result).toBe('1-test-true-1,2,3-value')
    })

    it('should handle optional arguments', async () => {
      const result1 = await service.withOptionalArg('hello')
      expect(result1).toBe('hello-42')

      const result2 = await service.withOptionalArg('hello', 100)
      expect(result2).toBe('hello-100')
    })
  })

  describe('Async Operations Inside Worker', () => {
    it('should handle nested async/await', async () => {
      const result = await service.nestedAsyncOperations()
      expect(result).toBe(42)
    })
  })

  describe('Concurrent Calls', () => {
    it('should handle multiple concurrent calls to the same method', async () => {
      const promises = [
        service.processArray([1]),
        service.processArray([2]),
        service.processArray([3])
      ]

      const results = await Promise.all(promises)
      expect(results).toEqual([[2], [4], [6]])
    })

    it('should handle multiple concurrent calls to different methods', async () => {
      const strPromise = service.processString('abc')
      const arrPromise = service.processArray([1, 2])
      const mathPromise = service.mathOperations(2, 3)

      const [strResult, arrResult, mathResult] = await Promise.all([strPromise, arrPromise, mathPromise])

      expect(strResult.uppercase).toBe('ABC')
      expect(arrResult).toEqual([2, 4])
      expect(mathResult.sum).toBe(5)
    })
  })
})

// Extended service with add method for additional concurrent tests
class EdgeCaseServiceExtended extends EdgeCaseService {
  @RunInNewThread()
  async add(a: number, b: number): Promise<number> {
    return a + b
  }
}

describe('Concurrent Calls (Extended)', () => {
  let service: EdgeCaseServiceExtended

  beforeEach(() => {
    service = new EdgeCaseServiceExtended()
  })

  it('should handle multiple concurrent calls to the same method', async () => {
    const promises = [
      service.add(1, 2),
      service.add(3, 4),
      service.add(5, 6)
    ]

    const results = await Promise.all(promises)
    expect(results).toEqual([3, 7, 11])
  })
})
