import { describe, it, expect } from 'vitest';
import {
  VIDEOS,
  getVideoById,
  isShort,
  CHANNELS,
  CATEGORIES,
  searchVideos,
  getSuggestions,
  getRelatedVideos,
} from '@/app/data/catalog';

describe('catalog utilities', () => {
  it('loads 50 mock videos in catalog', () => {
    expect(VIDEOS.length).toBe(50);
  });

  it('getVideoById finds an existing video', () => {
    const first = VIDEOS[0];
    const found = getVideoById(first.id);
    expect(found).toBeDefined();
    expect(found?.id).toBe(first.id);
  });

  it('getVideoById returns undefined for non-existent video', () => {
    expect(getVideoById('non-existent-id')).toBeUndefined();
  });

  it('isShort checks whether duration is <= 60 seconds', () => {
    const shortMock = {
      ...VIDEOS[0],
      contentDetails: { duration: 'PT45S' },
    };
    const longMock = {
      ...VIDEOS[0],
      contentDetails: { duration: 'PT5M' },
    };

    expect(isShort(shortMock)).toBe(true);
    expect(isShort(longMock)).toBe(false);
  });

  it('CHANNELS aggregates channels correctly', () => {
    expect(CHANNELS.length).toBeGreaterThan(0);
    expect(CHANNELS[0]).toHaveProperty('id');
    expect(CHANNELS[0]).toHaveProperty('title');
    expect(CHANNELS[0].videoCount).toBeGreaterThanOrEqual(1);
  });

  it('CATEGORIES sorts and maps category IDs to names', () => {
    expect(CATEGORIES.length).toBeGreaterThan(0);
    expect(CATEGORIES[0]).toHaveProperty('id');
    expect(CATEGORIES[0]).toHaveProperty('name');
    expect(CATEGORIES[0].count).toBeGreaterThanOrEqual(1);
  });

  describe('searchVideos', () => {
    it('returns all videos when query is empty', () => {
      const results = searchVideos(VIDEOS, '');
      expect(results.length).toBe(VIDEOS.length);
    });

    it('filters videos matching title or channel', () => {
      const first = VIDEOS[0];
      const word = first.snippet.title.split(' ')[0];
      const results = searchVideos(VIDEOS, word);
      expect(results.length).toBeGreaterThan(0);
      expect(results.some(v => v.id === first.id)).toBe(true);
    });

    it('returns empty array when query does not match anything', () => {
      const results = searchVideos(VIDEOS, 'xyznonexistentterm12345');
      expect(results.length).toBe(0);
    });
  });

  describe('getSuggestions', () => {
    it('returns empty array for empty query', () => {
      expect(getSuggestions('')).toEqual([]);
      expect(getSuggestions('   ')).toEqual([]);
    });

    it('returns relevant suggestions matching query', () => {
      const suggestions = getSuggestions('tra', 5);
      expect(Array.isArray(suggestions)).toBe(true);
      if (suggestions.length > 0) {
        expect(suggestions[0].toLowerCase()).toContain('tra');
      }
    });

    it('respects limit parameter', () => {
      const suggestions = getSuggestions('a', 3);
      expect(suggestions.length).toBeLessThanOrEqual(3);
    });
  });

  describe('getRelatedVideos', () => {
    it('returns related videos excluding the target video', () => {
      const video = VIDEOS[0];
      const related = getRelatedVideos(video, 5);
      expect(related.length).toBeLessThanOrEqual(5);
      expect(related.every(v => v.id !== video.id)).toBe(true);
    });
  });
});
