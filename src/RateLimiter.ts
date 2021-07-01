import { RateLimitConfig } from './types';

export class RateLimiter {
  private requestsPerSecond: number;
  private delayMs: number;
  private concurrent: number;
  private lastRequestTime: number = 0;
  private activeRequests: number = 0;
  private queue: Array<() => void> = [];

  constructor(config: RateLimitConfig = {}) {
    this.requestsPerSecond = config.requestsPerSecond ?? 5;
    this.delayMs = config.delayMs ?? Math.floor(1000 / this.requestsPerSecond);
    this.concurrent = config.concurrent ?? 1;
  }

  async wait(): Promise<void> {
    // Wait for concurrent slot
    while (this.activeRequests >= this.concurrent) {
      await new Promise<void>((resolve) => {
        this.queue.push(resolve);
      });
    }

    // Enforce delay between requests
    const now = Date.now();
    const elapsed = now - this.lastRequestTime;
    if (elapsed < this.delayMs) {
      await this.sleep(this.delayMs - elapsed);
    }

    this.activeRequests++;
    this.lastRequestTime = Date.now();
  }

  release(): void {
    this.activeRequests = Math.max(0, this.activeRequests - 1);
    const next = this.queue.shift();
    if (next) next();
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  getStats(): { activeRequests: number; queueLength: number; delayMs: number } {
    return {
      activeRequests: this.activeRequests,
      queueLength: this.queue.length,
      delayMs: this.delayMs,
    };
  }
}
