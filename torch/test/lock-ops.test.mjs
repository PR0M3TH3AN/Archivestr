import { describe, it } from 'node:test';
import assert from 'node:assert';
import { parseLockEvent } from '../src/lock-ops.mjs';

describe('parseLockEvent', () => {
  it('should parse a valid lock event', () => {
    const event = {
      id: 'test-event-id',
      pubkey: 'test-pubkey',
      created_at: Math.floor(Date.now() / 1000),
      kind: 30078,
      tags: [
        ['d', 'torch-lock/'],
        ['t', 'torch-agent-lock'],
      ],
      content: JSON.stringify({
        agent: 'test-agent',
        cadence: 'daily',
        date: '2026-02-20',
        git_commit: 'abc123',
        prompt_hash: 'def456',
      }),
    };

    const result = parseLockEvent(event);

    assert.strictEqual(result.agent, 'test-agent');
    assert.strictEqual(result.cadence, 'daily');
    assert.strictEqual(result.date, '2026-02-20');
    assert.strictEqual(result.eventId, 'test-event-id');
  });

  it('should handle event with missing content fields', () => {
    const event = {
      id: 'test-event-id',
      pubkey: 'test-pubkey',
      created_at: Math.floor(Date.now() / 1000),
      kind: 30078,
      tags: [['d', 'torch-lock/']],
      content: '{}',
    };

    const result = parseLockEvent(event);

    assert.strictEqual(result.agent, null);
    assert.strictEqual(result.cadence, null);
    assert.strictEqual(result.date, null);
  });

  it('should parse event with expiration tag', () => {
    const event = {
      id: 'test-event-id',
      pubkey: 'test-pubkey',
      created_at: Math.floor(Date.now() / 1000),
      kind: 30078,
      tags: [
        ['d', 'torch-lock/'],
        ['expiration', '1771603837'],
      ],
      content: '{}',
    };

    const result = parseLockEvent(event);

    assert.strictEqual(result.expiresAt, 1771603837);
  });

  it('should handle malformed JSON content gracefully', () => {
    const event = {
      id: 'test-event-id',
      pubkey: 'test-pubkey',
      created_at: Math.floor(Date.now() / 1000),
      kind: 30078,
      tags: [['d', 'torch-lock/']],
      content: 'not valid json',
    };

    const result = parseLockEvent(event);

    assert.strictEqual(result.agent, null);
    assert.strictEqual(result.cadence, null);
  });
});
