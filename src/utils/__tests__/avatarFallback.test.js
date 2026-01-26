import { describe, it, expect } from 'vitest';
import { getAvatarFallbackDataUrl } from '../avatarFallback';

describe('getAvatarFallbackDataUrl', () => {
  it('returns data URL with first 2 characters for valid alphanumeric id', () => {
    const dataUrl = getAvatarFallbackDataUrl('abc123');
    expect(dataUrl).toContain('data:image/svg+xml;utf8,');
    expect(dataUrl).toContain('AB');
  });

  it('handles single character by appending A', () => {
    const dataUrl = getAvatarFallbackDataUrl('x');
    expect(dataUrl).toContain('XA');
  });

  it('returns AV for empty string', () => {
    const dataUrl = getAvatarFallbackDataUrl('');
    expect(dataUrl).toContain('AV');
  });

  it('returns AV for null/undefined', () => {
    expect(getAvatarFallbackDataUrl(null)).toContain('AV');
    expect(getAvatarFallbackDataUrl(undefined)).toContain('AV');
  });

  it('strips non-alphanumeric characters', () => {
    const dataUrl = getAvatarFallbackDataUrl('a-b_c!d');
    expect(dataUrl).toContain('AB');
  });

  it('handles special characters only by returning AV', () => {
    const dataUrl = getAvatarFallbackDataUrl('---');
    expect(dataUrl).toContain('AV');
  });

  it('converts to uppercase', () => {
    const dataUrl = getAvatarFallbackDataUrl('hello');
    expect(dataUrl).toContain('HE');
  });

  it('generates valid SVG structure', () => {
    const dataUrl = getAvatarFallbackDataUrl('test');
    const decoded = decodeURIComponent(dataUrl.replace('data:image/svg+xml;utf8,', ''));
    expect(decoded).toContain('<svg');
    expect(decoded).toContain('</svg>');
    expect(decoded).toContain('width="64"');
    expect(decoded).toContain('height="64"');
    expect(decoded).toContain('<rect');
    expect(decoded).toContain('<text');
  });
});
