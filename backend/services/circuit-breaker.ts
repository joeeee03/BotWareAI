// Circuit Breaker Service - Prevents cascading failures from external services
// Implements the Circuit Breaker pattern for resilient external API calls

type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN'

interface CircuitBreakerConfig {
  failureThreshold: number // Number of failures before opening
  successThreshold: number // Number of successes to close from half-open
  timeout: number // Time in ms to wait before attempting half-open
  resetTimeout: number // Time in ms to reset failure count
}

interface CircuitBreakerMetrics {
  state: CircuitState
  failures: number
  successes: number
  consecutiveFailures: number
  consecutiveSuccesses: number
  lastFailureTime?: Date
  lastSuccessTime?: Date
  nextAttemptTime?: Date
}

class CircuitBreaker {
  private state: CircuitState = 'CLOSED'
  private failures: number = 0
  private successes: number = 0
  private consecutiveFailures: number = 0
  private consecutiveSuccesses: number = 0
  private lastFailureTime?: Date
  private lastSuccessTime?: Date
  private nextAttemptTime?: Date
  private config: CircuitBreakerConfig
  private name: string

  constructor(name: string, config: Partial<CircuitBreakerConfig> = {}) {
    this.name = name
    this.config = {
      failureThreshold: config.failureThreshold || 5,
      successThreshold: config.successThreshold || 2,
      timeout: config.timeout || 60000, // 1 minute
      resetTimeout: config.resetTimeout || 300000 // 5 minutes
    }

    console.log(`[CIRCUIT-BREAKER] Initialized "${name}" with config:`, this.config)
  }

  /**
   * Execute a function with circuit breaker protection
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    // Check if circuit is open
    if (this.state === 'OPEN') {
      if (this.nextAttemptTime && Date.now() < this.nextAttemptTime.getTime()) {
        const waitTime = Math.ceil((this.nextAttemptTime.getTime() - Date.now()) / 1000)
        throw new Error(
          `Circuit breaker "${this.name}" is OPEN. Retry in ${waitTime}s`
        )
      } else {
        // Transition to half-open
        console.log(`[CIRCUIT-BREAKER] "${this.name}" transitioning to HALF_OPEN`)
        this.state = 'HALF_OPEN'
        this.consecutiveSuccesses = 0
      }
    }

    try {
      const result = await fn()
      this.onSuccess()
      return result
    } catch (error) {
      this.onFailure(error)
      throw error
    }
  }

  /**
   * Handle successful execution
   */
  private onSuccess(): void {
    this.successes++
    this.consecutiveSuccesses++
    this.consecutiveFailures = 0
    this.lastSuccessTime = new Date()

    if (this.state === 'HALF_OPEN') {
      if (this.consecutiveSuccesses >= this.config.successThreshold) {
        console.log(
          `[CIRCUIT-BREAKER] ✅ "${this.name}" CLOSING circuit after ${this.consecutiveSuccesses} successes`
        )
        this.state = 'CLOSED'
        this.consecutiveFailures = 0
      }
    }

    // Reset failure count after success timeout
    if (
      this.lastFailureTime &&
      Date.now() - this.lastFailureTime.getTime() > this.config.resetTimeout
    ) {
      this.failures = 0
      this.consecutiveFailures = 0
    }
  }

  /**
   * Handle failed execution
   */
  private onFailure(error: any): void {
    this.failures++
    this.consecutiveFailures++
    this.consecutiveSuccesses = 0
    this.lastFailureTime = new Date()

    console.error(
      `[CIRCUIT-BREAKER] ❌ "${this.name}" failure ${this.consecutiveFailures}/${this.config.failureThreshold}:`,
      error instanceof Error ? error.message : String(error)
    )

    // Open circuit if threshold reached
    if (
      this.consecutiveFailures >= this.config.failureThreshold &&
      this.state !== 'OPEN'
    ) {
      this.state = 'OPEN'
      this.nextAttemptTime = new Date(Date.now() + this.config.timeout)
      
      console.error(
        `[CIRCUIT-BREAKER] ⛔ "${this.name}" OPENED circuit. Next attempt at ${this.nextAttemptTime.toISOString()}`
      )
    }
  }

  /**
   * Get current metrics
   */
  getMetrics(): CircuitBreakerMetrics {
    return {
      state: this.state,
      failures: this.failures,
      successes: this.successes,
      consecutiveFailures: this.consecutiveFailures,
      consecutiveSuccesses: this.consecutiveSuccesses,
      lastFailureTime: this.lastFailureTime,
      lastSuccessTime: this.lastSuccessTime,
      nextAttemptTime: this.nextAttemptTime
    }
  }

  /**
   * Manually reset the circuit breaker
   */
  reset(): void {
    console.log(`[CIRCUIT-BREAKER] Manual reset of "${this.name}"`)
    this.state = 'CLOSED'
    this.failures = 0
    this.consecutiveFailures = 0
    this.consecutiveSuccesses = 0
    this.nextAttemptTime = undefined
  }

  /**
   * Check if circuit is operational
   */
  isAvailable(): boolean {
    if (this.state === 'CLOSED') return true
    if (this.state === 'HALF_OPEN') return true
    if (this.state === 'OPEN' && this.nextAttemptTime) {
      return Date.now() >= this.nextAttemptTime.getTime()
    }
    return false
  }
}

// Circuit breakers for different external services
export const metaApiCircuitBreaker = new CircuitBreaker('MetaAPI', {
  failureThreshold: 5,
  successThreshold: 2,
  timeout: 60000, // 1 minute
  resetTimeout: 300000 // 5 minutes
})

export const databaseCircuitBreaker = new CircuitBreaker('Database', {
  failureThreshold: 10,
  successThreshold: 3,
  timeout: 30000, // 30 seconds
  resetTimeout: 120000 // 2 minutes
})

/**
 * Wrapper function for database operations with circuit breaker
 */
export async function withDatabaseCircuitBreaker<T>(
  operation: () => Promise<T>
): Promise<T> {
  return databaseCircuitBreaker.execute(operation)
}

/**
 * Wrapper function for Meta API operations with circuit breaker
 */
export async function withMetaApiCircuitBreaker<T>(
  operation: () => Promise<T>
): Promise<T> {
  return metaApiCircuitBreaker.execute(operation)
}

// Health check endpoint data
export function getCircuitBreakerHealth() {
  return {
    metaApi: metaApiCircuitBreaker.getMetrics(),
    database: databaseCircuitBreaker.getMetrics()
  }
}
