import type { Channel, YouTubeVideo } from '../types';
import { getCategoryName, parseDurationSeconds } from '../utils/helpers';
import { SUGGESTIONS_DATA, YOUTUBE_DATA } from './mockData';

export const VIDEOS: YouTubeVideo[] = YOUTUBE_DATA.items;

const VIDEOS_BY_ID = new Map(VIDEOS.map(video => [video.id, video]));

export const getVideoById = (id: string): YouTubeVideo | undefined => VIDEOS_BY_ID.get(id);

export const SHORTS_MAX_SECONDS = 60;

export const isShort = (video: YouTubeVideo): boolean =>
  parseDurationSeconds(video.contentDetails.duration) <= SHORTS_MAX_SECONDS;

export const CHANNELS: Channel[] = (() => {
  const channels = new Map<string, Channel>();
  for (const { snippet } of VIDEOS) {
    const channelId = snippet.channelId || snippet.channelTitle;
    const existing = channels.get(channelId);
    if (existing) existing.videoCount += 1;
    else channels.set(channelId, { id: channelId, title: snippet.channelTitle, videoCount: 1 });
  }
  return [...channels.values()];
})();

export const getChannel = (id: string): Channel | undefined => CHANNELS.find(channel => channel.id === id);

export const CATEGORIES: { id: string; name: string; count: number }[] = (() => {
  const counts = new Map<string, number>();
  for (const { snippet } of VIDEOS) {
    if (snippet.categoryId) {
      counts.set(snippet.categoryId, (counts.get(snippet.categoryId) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([id, count]) => ({ id, name: getCategoryName(id), count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
})();

const searchableText = (video: YouTubeVideo): string =>
  [
    video.snippet.title,
    video.snippet.channelTitle,
    video.snippet.description,
    video.snippet.categoryId ? getCategoryName(video.snippet.categoryId) : '',
    ...(video.snippet.tags ?? []),
  ]
    .join(' ')
    .toLowerCase();

const SEARCH_INDEX = new Map(VIDEOS.map(video => [video.id, searchableText(video)]));

// Every whitespace-separated term must match somewhere in the video's title, channel, description, category, or tags.
export const searchVideos = (videos: YouTubeVideo[], query: string): YouTubeVideo[] => {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return videos;
  return videos.filter(video => {
    const text = SEARCH_INDEX.get(video.id) ?? searchableText(video);
    return terms.every(term => text.includes(term));
  });
};

const SUGGESTION_POOL: string[] = (() => {
  const pool = new Map<string, string>();
  const add = (value: string) => {
    const key = value.trim().toLowerCase();
    if (key && !pool.has(key)) pool.set(key, value.trim());
  };
  SUGGESTIONS_DATA[1].forEach(add);
  CHANNELS.forEach(channel => add(channel.title));
  VIDEOS.forEach(video => (video.snippet.tags ?? []).forEach(add));
  return [...pool.values()];
})();

export const getSuggestions = (query: string, limit = 6): string[] => {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const matches = SUGGESTION_POOL.filter(item => item.toLowerCase().includes(q) && item.toLowerCase() !== q);
  return matches
    .sort((a, b) => Number(b.toLowerCase().startsWith(q)) - Number(a.toLowerCase().startsWith(q)) || a.length - b.length)
    .slice(0, limit);
};

// Ranks by same channel, same category, then shared tags, with views as the tiebreaker.
export const getRelatedVideos = (video: YouTubeVideo, limit = 20): YouTubeVideo[] => {
  const tags = new Set((video.snippet.tags ?? []).map((tag: string) => tag.toLowerCase()));
  return VIDEOS.filter(candidate => candidate.id !== video.id)
    .map(candidate => {
      let score = 0;
      if (candidate.snippet.channelId && candidate.snippet.channelId === video.snippet.channelId) score += 5;
      if (candidate.snippet.categoryId && candidate.snippet.categoryId === video.snippet.categoryId) score += 2;
      for (const tag of candidate.snippet.tags ?? []) if (tags.has(tag.toLowerCase())) score += 1;
      return { candidate, score };
    })
    .sort((a, b) => b.score - a.score || Number(b.candidate.statistics.viewCount) - Number(a.candidate.statistics.viewCount))
    .slice(0, limit)
    .map(({ candidate }) => candidate);
};
