const cache = new Map();

export const getCachedData = (key) => {
  return cache.get(key);
};

export const setCachedData = (key, data, ttl = 300000) => {
  // 5 minutes
  cache.set(key, {
    data,
    timestamp: Date.now(),
    ttl,
  });
};

export const clearCache = (key) => {
  cache.delete(key);
};
