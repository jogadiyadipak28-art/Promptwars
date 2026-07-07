/**
 * cache.js
 *
 * Simple in-memory cache for frequently accessed static data.
 * Improves efficiency by avoiding repeated calculations and data processing.
 */

'use strict';

/**
 * Simple LRU cache implementation
 */
class SimpleCache {
  constructor(maxSize = 100) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  get(key) {
    const value = this.cache.get(key);
    if (value !== undefined) {
      // Move to end (most recently used)
      this.cache.delete(key);
      this.cache.set(key, value);
    }
    return value;
  }

  set(key, value) {
    if (this.cache.size >= this.maxSize) {
      // Remove least recently used (first item)
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }

  clear() {
    this.cache.clear();
  }
}

// Cache instances for different data types
const stadiumContextCache = new SimpleCache(50);
const crowdAnalysisCache = new SimpleCache(50);

/**
 * Get or compute stadium context with caching
 */
function getCachedStadiumContext(stadiumId, computeFn) {
  const cacheKey = `stadium_${stadiumId}`;
  const cached = stadiumContextCache.get(cacheKey);
  if (cached) return cached;
  
  const result = computeFn();
  stadiumContextCache.set(cacheKey, result);
  return result;
}

/**
 * Get or compute crowd analysis with caching (short TTL)
 */
function getCrowdAnalysis(stadiumId, computeFn) {
  const cacheKey = `crowd_${stadiumId}_${Date.now()}`;
  const cached = crowdAnalysisCache.get(cacheKey);
  if (cached) return cached;
  
  const result = computeFn();
  crowdAnalysisCache.set(cacheKey, result);
  return result;
}

/**
 * Clear all caches
 */
function clearAllCaches() {
  stadiumContextCache.clear();
  crowdAnalysisCache.clear();
}

module.exports = {
  SimpleCache,
  getCachedStadiumContext,
  getCrowdAnalysis,
  clearAllCaches
};
