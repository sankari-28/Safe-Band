import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// In-memory cache for fast synchronous access and graceful fallback when native storage is unavailable
const memoryCache: Record<string, string> = {};

export const appStorage = {
  async getItem(key: string): Promise<string | null> {
    if (memoryCache[key] !== undefined) {
      return memoryCache[key];
    }

    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
        const val = window.localStorage.getItem(key);
        if (val !== null) memoryCache[key] = val;
        return val;
      }
      if (AsyncStorage) {
        const val = await AsyncStorage.getItem(key);
        if (val !== null) {
          memoryCache[key] = val;
          return val;
        }
      }
      return memoryCache[key] || null;
    } catch {
      // Native module unavailable or error - gracefully fall back to in-memory cache
      return memoryCache[key] || null;
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    memoryCache[key] = value;
    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
        return;
      }
      if (AsyncStorage) {
        await AsyncStorage.setItem(key, value);
      }
    } catch {
      // Gracefully ignore native storage errors (e.g. legacy storage null in Expo Go)
    }
  },

  async removeItem(key: string): Promise<void> {
    delete memoryCache[key];
    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
        return;
      }
      if (AsyncStorage) {
        await AsyncStorage.removeItem(key);
      }
    } catch {
      // Gracefully ignore
    }
  },

  getItemSync(key: string): string | null {
    if (memoryCache[key] !== undefined) {
      return memoryCache[key];
    }
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
      const val = window.localStorage.getItem(key);
      if (val !== null) memoryCache[key] = val;
      return val;
    }
    return null;
  },
};
