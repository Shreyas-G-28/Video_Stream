import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchPopularVideos, searchYouTubeVideos, fetchVideoComments } from '@/app/utils/api';

describe('api utilities', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('fetchPopularVideos', () => {
    it('returns items and nextPageToken from YouTube response', async () => {
      const mockItems = [{ id: 'vid1' }, { id: 'vid2' }];
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({ items: mockItems, nextPageToken: 'token123' }),
      } as Response);

      const res = await fetchPopularVideos();
      expect(res.items).toEqual(mockItems);
      expect(res.nextPageToken).toBe('token123');
    });

    it('handles fetch errors gracefully and returns empty items', async () => {
      vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('Network error'));
      const res = await fetchPopularVideos();
      expect(res.items).toEqual([]);
      expect(res.nextPageToken).toBeUndefined();
    });
  });

  describe('searchYouTubeVideos', () => {
    it('returns empty array if query is empty or whitespace', async () => {
      const res = await searchYouTubeVideos('   ');
      expect(res).toEqual([]);
    });

    it('performs search and video details hydration', async () => {
      const searchResponse = {
        items: [{ id: { videoId: 'v1' } }, { id: { videoId: 'v2' } }],
      };
      const videosResponse = {
        items: [{ id: 'v1', snippet: { title: 'Video 1' } }, { id: 'v2', snippet: { title: 'Video 2' } }],
      };

      vi.spyOn(globalThis, 'fetch')
        .mockResolvedValueOnce({
          ok: true,
          json: async () => searchResponse,
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => videosResponse,
        } as Response);

      const res = await searchYouTubeVideos('nature');
      expect(res).toEqual(videosResponse.items);
    });

    it('returns empty array if search result has no videos', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({ items: [] }),
      } as Response);

      const res = await searchYouTubeVideos('query');
      expect(res).toEqual([]);
    });
  });

  describe('fetchVideoComments', () => {
    it('fetches comments for a video', async () => {
      const comments = [{ id: 'c1' }, { id: 'c2' }];
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({ items: comments }),
      } as Response);

      const res = await fetchVideoComments('v1');
      expect(res).toEqual(comments);
    });

    it('returns empty array on failure', async () => {
      vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('Error'));
      const res = await fetchVideoComments('v1');
      expect(res).toEqual([]);
    });
  });
});
