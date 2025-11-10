// Message Queue Service - Handles concurrent message processing with retry logic
// Prevents system crashes when receiving many messages simultaneously

interface QueueItem {
  id: string
  execute: () => Promise<void>
  retries: number
  maxRetries: number
  createdAt: Date
}

interface QueueMetrics {
  processed: number
  failed: number
  queued: number
  processing: number
  errors: Array<{ timestamp: Date; error: string; item: string }>
}

class MessageQueue {
  private queue: QueueItem[] = []
  private processing: Set<string> = new Set()
  private maxConcurrent: number
  private metrics: QueueMetrics = {
    processed: 0,
    failed: 0,
    queued: 0,
    processing: 0,
    errors: []
  }

  constructor(maxConcurrent: number = 10) {
    this.maxConcurrent = maxConcurrent
    console.log(`[QUEUE] Initialized with max concurrent: ${maxConcurrent}`)
  }

  /**
   * Add a task to the queue
   */
  async add(
    id: string,
    task: () => Promise<void>,
    maxRetries: number = 3
  ): Promise<void> {
    const item: QueueItem = {
      id,
      execute: task,
      retries: 0,
      maxRetries,
      createdAt: new Date()
    }

    this.queue.push(item)
    this.metrics.queued = this.queue.length

    console.log(`[QUEUE] Added task ${id}. Queue size: ${this.queue.length}`)

    // Start processing if we have capacity
    this.processNext()
  }

  /**
   * Process next item in queue if capacity available
   */
  private async processNext(): Promise<void> {
    // Check if we have capacity and items to process
    if (this.processing.size >= this.maxConcurrent || this.queue.length === 0) {
      return
    }

    const item = this.queue.shift()
    if (!item) return

    this.processing.add(item.id)
    this.metrics.queued = this.queue.length
    this.metrics.processing = this.processing.size

    console.log(
      `[QUEUE] Processing ${item.id}. Active: ${this.processing.size}, Queued: ${this.queue.length}`
    )

    try {
      await this.executeWithTimeout(item)
      this.metrics.processed++
      console.log(`[QUEUE] ✅ Completed ${item.id}`)
    } catch (error) {
      await this.handleError(item, error)
    } finally {
      this.processing.delete(item.id)
      this.metrics.processing = this.processing.size

      // Process next item
      setImmediate(() => this.processNext())
    }
  }

  /**
   * Execute task with timeout
   */
  private async executeWithTimeout(item: QueueItem): Promise<void> {
    const timeout = 30000 // 30 seconds timeout

    return Promise.race([
      item.execute(),
      new Promise<void>((_, reject) =>
        setTimeout(() => reject(new Error('Task timeout')), timeout)
      )
    ])
  }

  /**
   * Handle task execution errors with retry logic
   */
  private async handleError(item: QueueItem, error: any): Promise<void> {
    const errorMessage = error instanceof Error ? error.message : String(error)
    
    console.error(`[QUEUE] ❌ Error processing ${item.id}:`, errorMessage)
    
    // Record error
    this.metrics.errors.push({
      timestamp: new Date(),
      error: errorMessage,
      item: item.id
    })

    // Keep only last 100 errors
    if (this.metrics.errors.length > 100) {
      this.metrics.errors = this.metrics.errors.slice(-100)
    }

    // Retry logic
    if (item.retries < item.maxRetries) {
      item.retries++
      const delay = Math.min(1000 * Math.pow(2, item.retries), 10000) // Exponential backoff, max 10s
      
      console.log(`[QUEUE] 🔄 Retrying ${item.id} (attempt ${item.retries}/${item.maxRetries}) after ${delay}ms`)
      
      setTimeout(() => {
        this.queue.unshift(item) // Add to front of queue
        this.metrics.queued = this.queue.length
        this.processNext()
      }, delay)
    } else {
      this.metrics.failed++
      console.error(`[QUEUE] ⛔ Failed ${item.id} after ${item.maxRetries} retries`)
    }
  }

  /**
   * Get current queue metrics
   */
  getMetrics(): QueueMetrics {
    return {
      ...this.metrics,
      queued: this.queue.length,
      processing: this.processing.size
    }
  }

  /**
   * Get queue health status
   */
  getHealth(): { status: 'healthy' | 'degraded' | 'unhealthy'; details: any } {
    const metrics = this.getMetrics()
    const recentErrors = metrics.errors.filter(
      e => Date.now() - e.timestamp.getTime() < 60000 // Last minute
    ).length

    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy'
    
    if (recentErrors > 10 || metrics.queued > 100) {
      status = 'degraded'
    }
    
    if (recentErrors > 50 || metrics.queued > 500) {
      status = 'unhealthy'
    }

    return {
      status,
      details: {
        ...metrics,
        recentErrors,
        utilizationPercent: (metrics.processing / this.maxConcurrent) * 100
      }
    }
  }

  /**
   * Clear old errors from metrics
   */
  clearOldErrors(olderThanMinutes: number = 60): void {
    const cutoff = Date.now() - olderThanMinutes * 60 * 1000
    this.metrics.errors = this.metrics.errors.filter(
      e => e.timestamp.getTime() > cutoff
    )
  }
}

// Singleton instance
export const messageQueue = new MessageQueue(10)

// Cleanup task - runs every 5 minutes
setInterval(() => {
  messageQueue.clearOldErrors(60)
  const health = messageQueue.getHealth()
  console.log(`[QUEUE] Health check:`, health)
}, 5 * 60 * 1000)
