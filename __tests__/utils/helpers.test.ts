import { describe, it, expect } from 'vitest';
import { formatViews, parseDuration, parseDurationSeconds, getCategoryName, rand } from '@/app/utils/helpers';

describe('helpers utility functions', () => {
  describe('formatViews', () => {
    it('formats millions correctly', () => {
      expect(formatViews('1500000')).toBe('1.5M');
      expect(formatViews(2000000)).toBe('2.0M');
    });

    it('formats thousands correctly', () => {
      expect(formatViews('1500')).toBe('1.5K');
      expect(formatViews(50000)).toBe('50.0K');
    });

    it('returns exact small view counts', () => {
      expect(formatViews('450')).toBe(450);
      expect(formatViews(999)).toBe(999);
    });

    it('handles non-numeric strings gracefully', () => {
      expect(formatViews('unknown')).toBe('unknown');
    });
  });

  describe('parseDuration', () => {
    it('parses minutes and seconds', () => {
      expect(parseDuration('PT4M13S')).toBe('4:13');
      expect(parseDuration('PT12M05S')).toBe('12:05');
    });

    it('parses hours, minutes and seconds', () => {
      expect(parseDuration('PT1H02M03S')).toBe('1:02:03');
      expect(parseDuration('PT2H30M00S')).toBe('2:30:00');
    });

    it('parses only seconds', () => {
      expect(parseDuration('PT45S')).toBe('0:45');
    });

    it('returns fallback for invalid formats', () => {
      expect(parseDuration('invalid')).toBe('0:00');
    });
  });

  describe('parseDurationSeconds', () => {
    it('converts duration string to total seconds', () => {
      expect(parseDurationSeconds('PT1M30S')).toBe(90);
      expect(parseDurationSeconds('PT1H')).toBe(3600);
      expect(parseDurationSeconds('PT1H1M1S')).toBe(3661);
    });

    it('returns 0 for invalid duration', () => {
      expect(parseDurationSeconds('not-iso')).toBe(0);
    });
  });

  describe('getCategoryName', () => {
    it('returns known category names by ID', () => {
      expect(getCategoryName('10')).toBe('Music');
      expect(getCategoryName('20')).toBe('Gaming');
      expect(getCategoryName('28')).toBe('Science & Technology');
    });

    it('returns General for unknown category IDs', () => {
      expect(getCategoryName('9999')).toBe('General');
    });
  });

  describe('rand', () => {
    it('returns a number within specified min and max range', () => {
      const val = rand(5, 10);
      expect(val).toBeGreaterThanOrEqual(5);
      expect(val).toBeLessThanOrEqual(10);
    });
  });
});
