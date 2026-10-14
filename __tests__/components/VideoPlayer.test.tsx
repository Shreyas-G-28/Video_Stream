import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import VideoPlayer from '@/app/components/VideoPlayer';
import { AppProvider } from '@/app/context/AppContext';
import { YouTubeVideo } from '@/app/types';

const sampleVideo: YouTubeVideo = {
  id: 'vid-sub-like-1',
  snippet: {
    publishedAt: '2026-01-01T00:00:00Z',
    channelId: 'channel-test-1',
    channelTitle: 'Tech Hub',
    title: 'Testing Video Subscriptions and Likes',
    description: 'This is a description for testing liked and subscribed functionalities in the video player.',
    thumbnails: {
      default: { url: 'https://example.com/thumb.jpg', width: 120, height: 90 },
      medium: { url: 'https://example.com/thumb.jpg', width: 320, height: 180 },
      high: { url: 'https://example.com/thumb.jpg', width: 480, height: 360 },
    },
  },
  contentDetails: {
    duration: 'PT5M30S',
  },
  statistics: {
    viewCount: '1500000',
    likeCount: '500',
    commentCount: '25',
  },
};

describe('VideoPlayer Like and Subscribe integration with AppContext', () => {
  it('toggles subscribe state when clicking subscribe button', () => {
    render(
      <AppProvider>
        <VideoPlayer video={sampleVideo} onBack={vi.fn()} allVideos={[sampleVideo]} />
      </AppProvider>
    );

    const subscribeBtn = screen.getByRole('button', { name: /subscribe/i });
    expect(subscribeBtn).toBeInTheDocument();
    expect(subscribeBtn.textContent).toBe('Subscribe');

    fireEvent.click(subscribeBtn);
    expect(screen.getByRole('button', { name: /subscribed/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /subscribed/i }));
    expect(screen.getByRole('button', { name: /subscribe/i })).toBeInTheDocument();
  });

  it('toggles liked state and increments like count', () => {
    render(
      <AppProvider>
        <VideoPlayer video={sampleVideo} onBack={vi.fn()} allVideos={[sampleVideo]} />
      </AppProvider>
    );

    const likeButton = screen.getByRole('button', { name: /500/i });
    expect(likeButton).toBeInTheDocument();

    fireEvent.click(likeButton);
    expect(screen.getByRole('button', { name: /501/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /501/i }));
    expect(screen.getByRole('button', { name: /500/i })).toBeInTheDocument();
  });
});
