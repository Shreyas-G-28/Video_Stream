export interface Thumbnail {
  url: string;
  width?: number;
  height?: number;
}

export interface YouTubeVideo {
  kind?: string;
  etag?: string;
  id: string;
  snippet: {
    publishedAt: string;
    channelId?: string;
    channelTitle: string;
    title: string;
    description: string;
    thumbnails: {
      default?: Thumbnail;
      medium: Thumbnail;
      high?: Thumbnail;
      standard?: Thumbnail;
      maxres?: Thumbnail;
      [key: string]: Thumbnail | undefined;
    };
    categoryId?: string;
    liveBroadcastContent?: string;
    localized?: {
      title: string;
      description: string;
    };
    defaultAudioLanguage?: string;
    defaultLanguage?: string;
    tags?: string[];
  };
  contentDetails: {
    duration: string;
    dimension?: string;
    definition?: string;
    caption?: string;
    licensedContent?: boolean;
    contentRating?: Record<string, unknown>;
    projection?: string;
    [key: string]: unknown;
  };
  statistics: {
    viewCount: string;
    likeCount: string;
    favoriteCount?: string;
    commentCount: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface YouTubeListResponse {
  kind?: string;
  etag?: string;
  nextPageToken?: string;
  prevPageToken?: string;
  items: YouTubeVideo[];
  pageInfo?: {
    totalResults: number;
    resultsPerPage: number;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface Channel {
  id: string;
  title: string;
  videoCount: number;
}

export interface CommentType {
  id: string;
  author: string;
  avatar: string;
  text: string;
  likes: number;
  timestamp: string;
  replies: CommentType[];
}