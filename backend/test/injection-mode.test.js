import test from 'node:test';
import assert from 'node:assert/strict';
import { shouldUseLiveInjectionMode, shouldUseLiveProbeMode } from '../src/controllers/moduleController.js';
import { assertLocalTarget } from '../src/utils/urlSafety.js';

test('defaults to simulation unless live is explicitly requested', () => {
  assert.equal(shouldUseLiveInjectionMode({ url: 'http://localhost:3000/' }), false);
  assert.equal(shouldUseLiveInjectionMode({ url: 'http://localhost:3000/', live: true }), true);
  assert.equal(shouldUseLiveInjectionMode({ url: 'http://localhost:3000/', mode: 'live' }), true);
  assert.equal(shouldUseLiveInjectionMode({ url: 'http://localhost:3000/', mode: 'simulate' }), false);
});

test('honors explicit live-probe mode for other module routes', () => {
  assert.equal(shouldUseLiveProbeMode({ live: true }), true);
  assert.equal(shouldUseLiveProbeMode({ mode: 'live' }), true);
  assert.equal(shouldUseLiveProbeMode({ mode: 'simulate' }), false);
  assert.equal(shouldUseLiveProbeMode({}), false);
});

test('allows admin and premium roles to probe approved external sites', () => {
  process.env.ALLOWED_LIVE_TARGETS = 'example.com';
  assert.doesNotThrow(() => assertLocalTarget('https://example.com', 'admin'));
  assert.doesNotThrow(() => assertLocalTarget('https://example.com', 'premium'));
  assert.throws(() => assertLocalTarget('https://example.com', 'free'));
  delete process.env.ALLOWED_LIVE_TARGETS;
});
