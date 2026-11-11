import { describe, expect, it } from 'vitest';
import { toEnglish } from './admin-i18n';

describe('admin English view', () => {
  it('translates exact admin labels', () => {
    expect(toEnglish('पासवर्ड रीसेट')).toBe('Reset password');
    expect(toEnglish(' खबरें ')).toBe(' News ');
  });
  it('translates phrases inside longer text and leaves non-Hindi text alone', () => {
    expect(toEnglish('3 महीने बाद')).toBe('3 months later');
    expect(toEnglish('reporter@site.com')).toBe('reporter@site.com');
  });
});
