import { describe, expect, it } from 'vitest';
import { parseConfig } from '../config.js';

function makeConfig(
  overrides: Partial<Record<string, string | undefined>> = {},
): Record<string, string | undefined> {
  return {
    PORT: '3001',
    DATABASE_URL: 'postgres://localhost:5432/test',
    DIRECT_URL: 'postgres://localhost:5432/test',
    OPENAI_API_KEY: 'sk-test',
    ...overrides,
  };
}

describe('config', () => {
  it('should parse the config', () => {
    const env = makeConfig();
    const config = parseConfig(env);
    expect(config.PORT).toBe(3001);
    expect(config.DATABASE_URL).toBe('postgres://localhost:5432/test');
    expect(config.DIRECT_URL).toBe('postgres://localhost:5432/test');
    expect(config.OPENAI_API_KEY).toBe('sk-test');
  });

  it('default PORT as 3001 if omitted', () => {
    const env = makeConfig({ PORT: undefined });
    const config = parseConfig(env);
    expect(config.PORT).toBe(3001);
  });

  it('throws if PORT is not a number', () => {
    const env = makeConfig({ PORT: 'abc' });
    expect(() => parseConfig(env)).toThrow('Invalid environment configuration: PORT');
  });

  it('throws if PORT is 0', () => {
    const env = makeConfig({ PORT: '0' });
    expect(() => parseConfig(env)).toThrow('Invalid environment configuration: PORT');
  });

  it('throws if PORT is greater than 65535', () => {
    const env = makeConfig({ PORT: '99999' });
    expect(() => parseConfig(env)).toThrow('Invalid environment configuration: PORT');
  });

  it('throws if PORT is empty string', () => {
    const env = makeConfig({ PORT: '' });
    expect(() => parseConfig(env)).toThrow('Invalid environment configuration: PORT');
  });

  it('throws if PORT is not integer', () => {
    const env = makeConfig({ PORT: '3.7' });
    expect(() => parseConfig(env)).toThrow('Invalid environment configuration: PORT');
  });

  it('throws if DATABASE_URL dont start with postgres', () => {
    const env = makeConfig({ DATABASE_URL: 'http://localhost:5432/test' });
    expect(() => parseConfig(env)).toThrow('Invalid environment configuration: DATABASE_URL');
  });

  it('throws if DATABASE_URL is empty string', () => {
    const env = makeConfig({ DATABASE_URL: '' });
    expect(() => parseConfig(env)).toThrow('Invalid environment configuration: DATABASE_URL');
  });

  it('does not put secret values in the error message', () => {
    const env = makeConfig({
      OPENAI_API_KEY: 'LEAKME-secret-value',
      PORT: 'abc',
    });
    try {
      parseConfig(env);
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).not.toContain('LEAKME');
      expect((error as Error).message).toContain('PORT');
      return;
    }
    expect.fail('parseConfig should have thrown');
  });

  it('throws if OPENAI_API_KEY is missing', () => {
    const env = makeConfig({ OPENAI_API_KEY: undefined });
    expect(() => parseConfig(env)).toThrow('Invalid environment configuration: OPENAI_API_KEY');
  });

  it('throws if OPENAI_API_KEY is empty string', () => {
    const env = makeConfig({ OPENAI_API_KEY: '' });
    expect(() => parseConfig(env)).toThrow('Invalid environment configuration: OPENAI_API_KEY');
  });

  it('throws if DATABASE_URL is missing', () => {
    const env = makeConfig({ DATABASE_URL: undefined });
    expect(() => parseConfig(env)).toThrow('Invalid environment configuration: DATABASE_URL');
  });

  it('throws if DIRECT_URL is missing', () => {
    const env = makeConfig({ DIRECT_URL: undefined });
    expect(() => parseConfig(env)).toThrow('Invalid environment configuration: DIRECT_URL');
  });
});
