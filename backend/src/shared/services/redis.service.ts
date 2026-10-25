import { createClient, RedisClientType } from "redis";
import { Request, Response, NextFunction } from "express";

class RedisService {
  private client: RedisClientType | null = null;
  private isConnected: boolean = false;
  private memoryFallback: Map<string, { value: string; expiresAt: number }> = new Map();

  private hasLoggedWarning: boolean = false;

  constructor() {
    this.init();
  }

  private async init() {
    const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

    try {
      this.client = createClient({ 
        url: redisUrl,
        socket: {
          reconnectStrategy: (retries) => {
            if (retries > 3) return new Error("Redis connection stopped retrying");
            return Math.min(retries * 1000, 3000);
          }
        }
      });

      this.client.on("connect", () => {
        this.isConnected = true;
        console.log("⚡ Redis: Connected successfully to", redisUrl);
      });

      this.client.on("error", (err) => {
        this.isConnected = false;
        if (!this.hasLoggedWarning) {
          this.hasLoggedWarning = true;
          console.warn("⚠️  Redis: Connection unavailable, using high-speed in-memory fallback:", err.message);
        }
      });

      await this.client.connect().catch((err) => {
        this.isConnected = false;
        if (!this.hasLoggedWarning) {
          this.hasLoggedWarning = true;
          console.warn("⚠️  Redis: Running in in-memory fallback mode.");
        }
      });
    } catch (e) {
      this.isConnected = false;
      if (!this.hasLoggedWarning) {
        this.hasLoggedWarning = true;
        console.warn("⚠️  Redis: Initialized in in-memory fallback mode.");
      }
    }
  }

  /**
   * Set key with optional TTL (in seconds)
   */
  async set(key: string, value: any, ttlSeconds: number = 3600): Promise<void> {
    const stringValue = typeof value === "string" ? value : JSON.stringify(value);

    if (this.isConnected && this.client) {
      try {
        await this.client.set(key, stringValue, { EX: ttlSeconds });
        return;
      } catch (e) {
        // Fallback to memory on failure
      }
    }

    // In-memory fallback
    this.memoryFallback.set(key, {
      value: stringValue,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  /**
   * Get parsed value from key
   */
  async get<T = any>(key: string): Promise<T | null> {
    if (this.isConnected && this.client) {
      try {
        const val = await this.client.get(key);
        if (!val) return null;
        try {
          return JSON.parse(val) as T;
        } catch {
          return val as unknown as T;
        }
      } catch (e) {
        // Fallback to memory on failure
      }
    }

    // In-memory fallback
    const item = this.memoryFallback.get(key);
    if (!item) return null;

    if (Date.now() > item.expiresAt) {
      this.memoryFallback.delete(key);
      return null;
    }

    try {
      return JSON.parse(item.value) as T;
    } catch {
      return item.value as unknown as T;
    }
  }

  /**
   * Delete key
   */
  async del(key: string): Promise<void> {
    if (this.isConnected && this.client) {
      try {
        await this.client.del(key);
      } catch (e) {}
    }
    this.memoryFallback.delete(key);
  }

  /**
   * Delete keys matching a pattern (e.g. "menu:*")
   */
  async delPattern(pattern: string): Promise<void> {
    if (this.isConnected && this.client) {
      try {
        const keys = await this.client.keys(pattern);
        if (keys.length > 0) {
          await this.client.del(keys);
        }
      } catch (e) {}
    }

    // In-memory fallback
    const regex = new RegExp("^" + pattern.replace(/\*/g, ".*") + "$");
    for (const k of this.memoryFallback.keys()) {
      if (regex.test(k)) {
        this.memoryFallback.delete(k);
      }
    }
  }

  /**
   * Cache-Aside Helper: Gets from cache or executes fetcher function and caches result
   */
  async getOrSet<T>(key: string, fetchFn: () => Promise<T>, ttlSeconds: number = 3600): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null && cached !== undefined) {
      return cached;
    }

    const freshData = await fetchFn();
    if (freshData !== null && freshData !== undefined) {
      await this.set(key, freshData, ttlSeconds);
    }
    return freshData;
  }

  // ==========================================
  // SMART RESTAURANT SPECIFIC REDIS METHODS
  // ==========================================

  /**
   * 1. Dynamic Table Session Management (2 hours TTL)
   */
  async setTableSession(tableId: string, sessionData: any, ttlSeconds: number = 7200) {
    const key = `session:table:${tableId}`;
    await this.set(key, sessionData, ttlSeconds);
  }

  async getTableSession(tableId: string) {
    return this.get(`session:table:${tableId}`);
  }

  async clearTableSession(tableId: string) {
    await this.del(`session:table:${tableId}`);
    await this.del(`cart:table:${tableId}`);
  }

  /**
   * 2. Live Shared Table Cart (synchronized across diners at the same table)
   */
  async setSharedCart(tableId: string, cartItems: any[]) {
    await this.set(`cart:table:${tableId}`, cartItems, 7200);
  }

  async getSharedCart(tableId: string): Promise<any[]> {
    return (await this.get(`cart:table:${tableId}`)) || [];
  }

  /**
   * 3. Menu & Category Invalidation
   */
  async invalidateMenuCache() {
    await this.delPattern("cache:route:*menu*");
    await this.delPattern("cache:route:*categor*");
    await this.delPattern("cache:menu:*");
    console.log("🧹 Redis: Invalidated menu and category cache");
  }

  /**
   * 4. API Rate Limiting (Token Bucket / Sliding Window)
   */
  async checkRateLimit(identifier: string, limit: number = 60, windowSeconds: number = 60): Promise<boolean> {
    const key = `ratelimit:${identifier}`;
    const count = (await this.get<number>(key)) || 0;

    if (count >= limit) {
      return false; // Limit exceeded
    }

    await this.set(key, count + 1, windowSeconds);
    return true; // Allowed
  }

  /**
   * 5. Express HTTP Route Cache Middleware
   */
  routeCache(ttlSeconds: number = 300) {
    return async (req: Request, res: Response, next: NextFunction) => {
      // Only cache GET requests
      if (req.method !== "GET") return next();

      const key = `cache:route:${req.originalUrl || req.url}`;
      const cachedResponse = await this.get(key);

      if (cachedResponse) {
        res.setHeader("X-Cache", "HIT-REDIS");
        return res.json(cachedResponse);
      }

      // Intercept res.json to cache response before sending
      const originalJson = res.json.bind(res);
      res.json = (body: any) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          this.set(key, body, ttlSeconds).catch(() => {});
        }
        res.setHeader("X-Cache", "MISS");
        return originalJson(body);
      };

      next();
    };
  }
}

export const redisService = new RedisService();
export default redisService;
