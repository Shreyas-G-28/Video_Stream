import { YouTubeVideo } from '../types';

const API_KEY = "AIzaSyATkRHzpzvaM1xc8jCOsD-ar3yvKyqngE0";
const BASE_URL = "https://youtube.googleapis.com/youtube/v3";

export interface PopularVideosResponse {
  items: YouTubeVideo[];
  nextPageToken?: string;
}

export const fetchPopularVideos = async (pageToken?: string): Promise<PopularVideosResponse> => {
  try {
    const pageParam = pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : '';
    const res = await fetch(
      `${BASE_URL}/videos?part=snippet,contentDetails,statistics&chart=mostPopular&regionCode=IN&maxResults=24${pageParam}&key=${API_KEY}`
    );
    const data = await res.json();
    return {
      items: data.items || [],
      nextPageToken: data.nextPageToken || undefined,
    };
  } catch (error) {
    console.error("Error fetching videos:", error);
    return { items: [] };
  }
};

export const searchYouTubeVideos = async (query: string) => {
  if (!query || !query.trim()) {
    return [];
  }
  try {
    const searchRes = await fetch(
      `${BASE_URL}/search?part=snippet&maxResults=24&q=${encodeURIComponent(query)}&type=video&key=${API_KEY}`
    );
    const searchData = await searchRes.json();
    const items = searchData.items || [];
    const videoIds = items
      .map((item: { id?: { videoId?: string } }) => item.id?.videoId)
      .filter((id: string | undefined): id is string => Boolean(id))
      .join(',');

    if (!videoIds) {
      return [];
    }

    const videosRes = await fetch(
      `${BASE_URL}/videos?part=snippet,contentDetails,statistics&id=${videoIds}&key=${API_KEY}`
    );
    const videosData = await videosRes.json();
    return videosData.items || [];
  } catch (error) {
    console.error("Error searching videos:", error);
    return [];
  }
};

export const fetchVideoComments = async (videoId: string) => {
  try {
    const res = await fetch(`${BASE_URL}/commentThreads?part=snippet,replies&videoId=${videoId}&maxResults=30&key=${API_KEY}`);
    const data = await res.json();
    return data.items || [];
  } catch (error) {
    console.error("Error fetching comments:", error);
    return [];
  }
};