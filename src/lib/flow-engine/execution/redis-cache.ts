import { redisConnection } from "@/lib/redis/config";
import { ExecutionResult } from "./types";

const EXECUTION_CACHE_PREFIX = "execution:";
const CACHE_TTL = 300; // 5 minutes

export class ExecutionCache {
  static async set(executionId: string, data: Partial<ExecutionResult>) {
    if (!redisConnection) return;
    
    try {
      const key = `${EXECUTION_CACHE_PREFIX}${executionId}`;
      await redisConnection.setex(
        key,
        CACHE_TTL,
        JSON.stringify(data)
      );
    } catch (error) {
      console.error('[ExecutionCache] Failed to cache execution:', error);
    }
  }

  static async get(executionId: string): Promise<Partial<ExecutionResult> | null> {
    if (!redisConnection) return null;
    
    try {
      const key = `${EXECUTION_CACHE_PREFIX}${executionId}`;
      const data = await redisConnection.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('[ExecutionCache] Failed to get cached execution:', error);
      return null;
    }
  }

  static async update(executionId: string, updates: Partial<ExecutionResult>) {
    if (!redisConnection) return;
    
    try {
      const existing = await this.get(executionId);
      const updated = { ...existing, ...updates };
      await this.set(executionId, updated);
    } catch (error) {
      console.error('[ExecutionCache] Failed to update cached execution:', error);
    }
  }

  static async delete(executionId: string) {
    if (!redisConnection) return;
    
    try {
      const key = `${EXECUTION_CACHE_PREFIX}${executionId}`;
      await redisConnection.del(key);
    } catch (error) {
      console.error('[ExecutionCache] Failed to delete cached execution:', error);
    }
  }
}