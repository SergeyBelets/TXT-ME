import { describe, it, expect } from 'vitest';
import { getAvatarLabel } from '../avatarLabel';

describe('getAvatarLabel', () => {
  it('returns img- prefix with first 8 characters', () => {
    expect(getAvatarLabel('abcdefghij')).toBe('img-abcdefgh');
  });

  it('handles short ids (less than 8 chars)', () => {
    expect(getAvatarLabel('abc')).toBe('img-abc');
  });

  it('handles exactly 8 characters', () => {
    expect(getAvatarLabel('12345678')).toBe('img-12345678');
  });

  it('returns img-unknown for empty string', () => {
    expect(getAvatarLabel('')).toBe('img-unknown');
  });

  it('returns img-unknown for null', () => {
    expect(getAvatarLabel(null)).toBe('img-unknown');
  });

  it('returns img-unknown for undefined', () => {
    expect(getAvatarLabel(undefined)).toBe('img-unknown');
  });

  it('converts numeric input to string', () => {
    expect(getAvatarLabel(12345678901)).toBe('img-12345678');
  });
});
