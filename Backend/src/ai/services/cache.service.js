import crypto from "crypto";
import { aiConfig } from "../config/ai.config.js";

class MemoryCacheService {
  constructor() {
    this.store = new Map();
  }

  buildKey(parts = []) {
    const raw = parts.filter(Boolean).join(":");
    return crypto.createHash("sha256").update(raw).digest("hex");
  }

  get(key) {
    const entry = this.store.get(key);

    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }

    return entry.value;
  }

  set(key, value, ttlMs = aiConfig.smartReply.cacheTtlMs) {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttlMs,
    });
  }

  delete(key) {
    this.store.delete(key);
  }

  sweep() {
    const now = Date.now();

    for (const [key, entry] of this.store.entries()) {
      if (now > entry.expiresAt) {
        this.store.delete(key);
      }
    }
  }
}

export const aiCache = new MemoryCacheService();

setInterval(() => aiCache.sweep(), 60 * 1000).unref?.();
