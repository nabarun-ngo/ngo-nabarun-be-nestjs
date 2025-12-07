import { Logger } from '@nestjs/common';
import { JobError, isRetryableError, getRetryDelay } from '../errors/job-errors';

/**
 * Retry strategy types
 */
export enum RetryStrategy {
    EXPONENTIAL = 'exponential',
    LINEAR = 'linear',
    FIXED = 'fixed',
    FIBONACCI = 'fibonacci',
    CUSTOM = 'custom',
}

/**
 * Retry configuration
 */
export interface RetryConfig {
    strategy: RetryStrategy;
    maxAttempts: number;
    baseDelay: number; // milliseconds
    maxDelay?: number; // milliseconds (cap)
    backoffMultiplier?: number; // for exponential/linear
    jitter?: boolean; // add randomness to prevent thundering herd
    retryableErrors?: string[]; // error codes that should trigger retry
    nonRetryableErrors?: string[]; // error codes that should NOT trigger retry
}

/**
 * Default retry configurations for different job types
 */
export const DEFAULT_RETRY_CONFIGS: Record<string, RetryConfig> = {
    default: {
        strategy: RetryStrategy.EXPONENTIAL,
        maxAttempts: 3,
        baseDelay: 2000,
        maxDelay: 60000,
        backoffMultiplier: 2,
        jitter: true,
    },
    critical: {
        strategy: RetryStrategy.EXPONENTIAL,
        maxAttempts: 5,
        baseDelay: 1000,
        maxDelay: 120000,
        backoffMultiplier: 2,
        jitter: true,
    },
    background: {
        strategy: RetryStrategy.EXPONENTIAL,
        maxAttempts: 3,
        baseDelay: 5000,
        maxDelay: 300000,
        backoffMultiplier: 3,
        jitter: true,
    },
    realtime: {
        strategy: RetryStrategy.FIXED,
        maxAttempts: 2,
        baseDelay: 500,
        maxDelay: 2000,
        jitter: false,
    },
    external_api: {
        strategy: RetryStrategy.EXPONENTIAL,
        maxAttempts: 4,
        baseDelay: 3000,
        maxDelay: 60000,
        backoffMultiplier: 2,
        jitter: true,
    },
};

/**
 * Retry strategy manager
 */
export class RetryStrategyManager {
    private readonly logger = new Logger(RetryStrategyManager.name);

    /**
     * Calculate delay for next retry attempt
     */
    calculateDelay(
        config: RetryConfig,
        attemptNumber: number,
        error?: Error,
    ): number {
        // Check if error provides custom retry delay
        if (error) {
            const customDelay = getRetryDelay(error, attemptNumber);
            if (customDelay > 0) {
                return this.applyJitter(customDelay, config.jitter);
            }
        }

        let delay: number;

        switch (config.strategy) {
            case RetryStrategy.EXPONENTIAL:
                delay = this.exponentialBackoff(config, attemptNumber);
                break;
            case RetryStrategy.LINEAR:
                delay = this.linearBackoff(config, attemptNumber);
                break;
            case RetryStrategy.FIXED:
                delay = config.baseDelay;
                break;
            case RetryStrategy.FIBONACCI:
                delay = this.fibonacciBackoff(config, attemptNumber);
                break;
            default:
                delay = this.exponentialBackoff(config, attemptNumber);
        }

        // Apply max delay cap
        if (config.maxDelay) {
            delay = Math.min(delay, config.maxDelay);
        }

        // Apply jitter if enabled
        if (config.jitter) {
            delay = this.applyJitter(delay, true);
        }

        return delay;
    }

    /**
     * Check if error should trigger a retry
     */
    shouldRetry(
        config: RetryConfig,
        attemptNumber: number,
        error: Error,
    ): boolean {
        // Check if max attempts exceeded
        if (attemptNumber >= config.maxAttempts) {
            this.logger.warn(
                `Max retry attempts (${config.maxAttempts}) reached for error: ${error.message}`,
            );
            return false;
        }

        // Check non-retryable errors list
        if (config.nonRetryableErrors && error instanceof JobError) {
            if (config.nonRetryableErrors.includes(error.errorCode)) {
                this.logger.warn(
                    `Error code ${error.errorCode} is in non-retryable list`,
                );
                return false;
            }
        }

        // Check retryable errors list
        if (config.retryableErrors && error instanceof JobError) {
            const isInRetryableList = config.retryableErrors.includes(error.errorCode);
            if (!isInRetryableList) {
                this.logger.warn(
                    `Error code ${error.errorCode} is not in retryable list`,
                );
                return false;
            }
        }

        // Use error's retryable flag or heuristics
        const shouldRetry = isRetryableError(error);

        if (!shouldRetry) {
            this.logger.warn(
                `Error is marked as non-retryable: ${error.message}`,
            );
        }

        return shouldRetry;
    }

    /**
     * Exponential backoff: delay = baseDelay * (multiplier ^ attempt)
     */
    private exponentialBackoff(config: RetryConfig, attemptNumber: number): number {
        const multiplier = config.backoffMultiplier || 2;
        return config.baseDelay * Math.pow(multiplier, attemptNumber - 1);
    }

    /**
     * Linear backoff: delay = baseDelay * attempt
     */
    private linearBackoff(config: RetryConfig, attemptNumber: number): number {
        const multiplier = config.backoffMultiplier || 1;
        return config.baseDelay * attemptNumber * multiplier;
    }

    /**
     * Fibonacci backoff: delay based on fibonacci sequence
     */
    private fibonacciBackoff(config: RetryConfig, attemptNumber: number): number {
        const fib = this.fibonacci(attemptNumber);
        return config.baseDelay * fib;
    }

    /**
     * Calculate fibonacci number
     */
    private fibonacci(n: number): number {
        if (n <= 1) return 1;
        let a = 1, b = 1;
        for (let i = 2; i <= n; i++) {
            const temp = a + b;
            a = b;
            b = temp;
        }
        return b;
    }

    /**
     * Apply jitter to delay to prevent thundering herd
     */
    private applyJitter(delay: number, enabled?: boolean): number {
        if (!enabled) return delay;

        // Add random jitter between -25% and +25%
        const jitterRange = delay * 0.25;
        const jitter = (Math.random() * 2 - 1) * jitterRange;
        return Math.max(0, delay + jitter);
    }

    /**
     * Get retry config by name or return default
     */
    getRetryConfig(configName?: string): RetryConfig {
        if (configName && DEFAULT_RETRY_CONFIGS[configName]) {
            return DEFAULT_RETRY_CONFIGS[configName];
        }
        return DEFAULT_RETRY_CONFIGS.default;
    }

    /**
     * Create custom retry config
     */
    createCustomConfig(overrides: Partial<RetryConfig>): RetryConfig {
        return {
            ...DEFAULT_RETRY_CONFIGS.default,
            ...overrides,
        };
    }

    /**
     * Log retry attempt
     */
    logRetryAttempt(
        jobName: string,
        attemptNumber: number,
        maxAttempts: number,
        delay: number,
        error: Error,
    ): void {
        this.logger.warn(
            `Retry attempt ${attemptNumber}/${maxAttempts} for job "${jobName}" ` +
            `after ${delay}ms delay. Error: ${error.message}`,
        );
    }
}
