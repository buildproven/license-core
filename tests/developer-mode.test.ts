import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, writeFileSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { isDeveloperMode } from '../src/developer-mode.js';

const ENV_VAR = 'CKIT_DEVELOPER';

describe('isDeveloperMode', () => {
  let tmp: string;
  let marker: string;
  const savedEnv = process.env[ENV_VAR];
  const savedNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    tmp = mkdtempSync(join(tmpdir(), 'devmode-'));
    marker = join(tmp, '.ckit-developer');
    delete process.env[ENV_VAR];
    delete process.env.NODE_ENV;
  });

  afterEach(() => {
    rmSync(tmp, { recursive: true, force: true });
    if (savedEnv === undefined) delete process.env[ENV_VAR];
    else process.env[ENV_VAR] = savedEnv;
    if (savedNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = savedNodeEnv;
  });

  const cfg = () => ({ envVar: ENV_VAR, markerFile: marker });

  it('is false with no env var and no marker', () => {
    expect(isDeveloperMode(cfg())).toBe(false);
  });

  it('is true when the env var is exactly "true"', () => {
    process.env[ENV_VAR] = 'true';
    expect(isDeveloperMode(cfg())).toBe(true);
  });

  it('is false when the env var is some other value', () => {
    process.env[ENV_VAR] = '1';
    expect(isDeveloperMode(cfg())).toBe(false);
  });

  it('is true when the marker file exists', () => {
    writeFileSync(marker, '');
    expect(isDeveloperMode(cfg())).toBe(true);
  });

  it('NEVER bypasses in production, even with the env var set', () => {
    process.env.NODE_ENV = 'production';
    process.env[ENV_VAR] = 'true';
    expect(isDeveloperMode(cfg())).toBe(false);
  });

  it('NEVER bypasses in production, even with a marker file', () => {
    process.env.NODE_ENV = 'production';
    writeFileSync(marker, '');
    expect(isDeveloperMode(cfg())).toBe(false);
  });

  it('honours per-product env var names independently', () => {
    process.env.QAA_DEVELOPER = 'true';
    // A CKIT-configured check must NOT trip on the QAA env var.
    expect(isDeveloperMode(cfg())).toBe(false);
    delete process.env.QAA_DEVELOPER;
  });
});
