/**
 * Property-based tests for stableStringify.
 *
 * stableStringify is the foundation of the entire signing scheme — any
 * non-determinism here breaks every shipped license. These tests use
 * fast-check to throw thousands of randomized inputs at the function
 * and assert invariants that should hold for ANY input.
 *
 * The properties:
 *   1. Determinism: same input → same output (across calls).
 *   2. Key-order independence: shuffling object keys produces identical output.
 *   3. Idempotence: stringify of a parsed-then-restringified object equals
 *      the original output (for JSON-roundtrip-safe values).
 *   4. JSON validity: output always parses back to a structurally-equal value.
 *   5. Sorted keys: in the output of any object, keys appear in
 *      lexicographic order.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { stableStringify } from '../src/signing.js';

// JSON-serializable values only — exclude undefined, functions, symbols, BigInt
// (those are out of scope for license payloads, which are plain JSON).
const jsonValueArb: fc.Arbitrary<unknown> = fc.letrec((tie) => ({
  value: fc.oneof(
    fc.boolean(),
    fc.constant(null),
    fc.float({ noNaN: true, noDefaultInfinity: true }),
    fc.integer(),
    fc.string(),
    tie('object'),
    tie('array'),
  ),
  object: fc.dictionary(fc.string(), tie('value'), { maxKeys: 8 }),
  array: fc.array(tie('value'), { maxLength: 8 }),
})).value;

function shuffleObjectKeys(value: unknown): unknown {
  if (value === null || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map(shuffleObjectKeys);
  const entries = Object.entries(value as Record<string, unknown>);
  // Reverse to ensure a different key order in the new object
  const reversed = [...entries].reverse();
  const out: Record<string, unknown> = {};
  for (const [k, v] of reversed) out[k] = shuffleObjectKeys(v);
  return out;
}

describe('stableStringify properties', () => {
  it('property: deterministic — same input always produces same output', () => {
    fc.assert(
      fc.property(jsonValueArb, (value) => {
        const a = stableStringify(value);
        const b = stableStringify(value);
        expect(a).toBe(b);
      }),
      { numRuns: 500 },
    );
  });

  it('property: key-order independent — shuffled keys produce identical output', () => {
    fc.assert(
      fc.property(jsonValueArb, (value) => {
        const original = stableStringify(value);
        const shuffled = stableStringify(shuffleObjectKeys(value));
        expect(shuffled).toBe(original);
      }),
      { numRuns: 500 },
    );
  });

  it('property: output parses back to a structurally equal value', () => {
    fc.assert(
      fc.property(jsonValueArb, (value) => {
        const stringified = stableStringify(value);
        const parsed = JSON.parse(stringified);
        // Compare via stableStringify so floats/key-order don't trip us up.
        expect(stableStringify(parsed)).toBe(stringified);
      }),
      { numRuns: 500 },
    );
  });

  it('property: object keys appear in lexicographic order in output', () => {
    // Re-stringify the parsed result with a deterministic-but-unsorted
    // strategy and compare to stableStringify's. We can't use Object.keys()
    // as ground truth because JS sorts integer-like keys first regardless
    // of insertion order. Instead: sort the keys ourselves and rebuild,
    // then assert the bytes match stableStringify's output.
    fc.assert(
      fc.property(
        fc.dictionary(fc.string(), fc.oneof(fc.boolean(), fc.integer()), {
          minKeys: 2,
          maxKeys: 6,
        }),
        (obj) => {
          const out = stableStringify(obj);
          // Manually rebuild the expected output: keys sorted by JS string compare,
          // values JSON.stringify'd (no nested objects in this test's value space).
          const sortedKeys = Object.keys(obj).sort();
          const expected =
            '{' +
            sortedKeys.map((k) => `${JSON.stringify(k)}:${JSON.stringify(obj[k])}`).join(',') +
            '}';
          expect(out).toBe(expected);
        },
      ),
      { numRuns: 200 },
    );
  });

  it('property: idempotent — stringify(parse(stringify(x))) === stringify(x)', () => {
    fc.assert(
      fc.property(jsonValueArb, (value) => {
        const once = stableStringify(value);
        const roundTripped = stableStringify(JSON.parse(once));
        expect(roundTripped).toBe(once);
      }),
      { numRuns: 500 },
    );
  });
});

describe('stableStringify edge cases', () => {
  it('handles unicode including surrogate pairs', () => {
    expect(stableStringify({ emoji: '🚀', cjk: '日本' })).toBe('{"cjk":"日本","emoji":"🚀"}');
  });

  it('handles deeply nested objects', () => {
    const deep: Record<string, unknown> = { a: 1 };
    let cur = deep;
    for (let i = 0; i < 50; i++) {
      const next: Record<string, unknown> = { i };
      cur['child'] = next;
      cur = next;
    }
    // Should not throw
    const out = stableStringify(deep);
    expect(typeof out).toBe('string');
  });

  it('handles empty string keys', () => {
    expect(stableStringify({ '': 1 })).toBe('{"":1}');
  });

  it('handles keys that need escaping', () => {
    expect(stableStringify({ 'a"b': 1, 'c\nd': 2 })).toBe('{"a\\"b":1,"c\\nd":2}');
  });

  it('preserves array element order (NOT sorted)', () => {
    expect(stableStringify([3, 1, 2])).toBe('[3,1,2]');
  });

  it('handles mixed nested arrays + objects', () => {
    const value = { z: [{ b: 2, a: 1 }, 3], a: { y: 1, x: 2 } };
    expect(stableStringify(value)).toBe('{"a":{"x":2,"y":1},"z":[{"a":1,"b":2},3]}');
  });
});
