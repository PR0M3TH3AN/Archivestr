import { describe, it } from 'node:test';
import assert from 'node:assert';
import { estimateTokenCount } from '../src/services/memory/formatter.js';

describe('formatter', () => {
  describe('estimateTokenCount', () => {
    it('should return 0 for empty string', () => {
      const result = estimateTokenCount('');
      assert.strictEqual(result, 0);
    });

    it('should return 0 for null', () => {
      const result = estimateTokenCount(null);
      assert.strictEqual(result, 0);
    });

    it('should estimate tokens at approximately 4 chars per token', () => {
      const text = 'This is a test string with some content';
      const result = estimateTokenCount(text);
      // 40 chars / 4 = 10 tokens (approximately)
      assert(result > 0);
    });

    it('should handle long strings', () => {
      const text = 'a'.repeat(1000);
      const result = estimateTokenCount(text);
      assert.strictEqual(result, 250);
    });
  });
});
