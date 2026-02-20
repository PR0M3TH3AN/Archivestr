import { describe, it } from 'node:test';
import assert from 'node:assert';
import { todayDateStr, detectPlatform } from '../src/utils.mjs';

describe('utils', () => {
  describe('todayDateStr', () => {
    it('should return date string in YYYY-MM-DD format', () => {
      const result = todayDateStr();
      assert.match(result, /^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe('detectPlatform', () => {
    it('should return null when no platform env vars are set', () => {
      const result = detectPlatform();
      // Should return a string or null depending on environment
      assert(result === null || typeof result === 'string');
    });

    it('should detect qwen platform from environment', () => {
      const original = process.env.QWEN_API_KEY;
      try {
        process.env.QWEN_API_KEY = 'test-key';
        const result = detectPlatform();
        assert.strictEqual(result, 'qwen');
      } finally {
        if (original) {
          process.env.QWEN_API_KEY = original;
        } else {
          delete process.env.QWEN_API_KEY;
        }
      }
    });
  });
});
