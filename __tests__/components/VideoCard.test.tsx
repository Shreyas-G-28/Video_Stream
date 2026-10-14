import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import VideoCard from '@/app/components/VideoCard';
import { YouTubeVideo } from '@/app/types';

const mockVideo: YouTubeVideo = {
  id: 'test-video-1',
  snippet: {
    publishedAt: '2026-01-01T00:00:00Z',
    channelTitle: 'Tech Channel',
    title: 'Learn React in 10 Minutes',
    description: 'A great tutorial on React.',
    thumbnails: {
      medium: { url: 'https://example.com/thumb.jpg' },
    },
  },
  contentDetails: { duration: 'PT10M00S' },
  statistics: { viewCount: '1500000', likeCount: '25000', commentCount: '500' },
};

describe('VideoCard component', () => {
  it('renders video title, channel, duration and formatted views', () => {
    render(<VideoCard video={mockVideo} onClick={vi.fn()} />);

    expect(screen.getByText('Learn React in 10 Minutes')).toBeInTheDocument();
    expect(screen.getByText('Tech Channel')).toBeInTheDocument();
    expect(screen.getByText('10:00')).toBeInTheDocument();
    expect(screen.getByText(/1\.5M views/i)).toBeInTheDocument();
  });

  it('triggers onClick with video when clicked', () => {
    const handleClick = vi.fn();
    render(<VideoCard video={mockVideo} onClick={handleClick} />);

    fireEvent.click(screen.getByText('Learn React in 10 Minutes'));
    expect(handleClick).toHaveBeenCalledWith(mockVideo);
  });

  it('renders horizontal layout when isHorizontal is true', () => {
    const { container } = render(
      <VideoCard video={mockVideo} onClick={vi.fn()} isHorizontal={true} />
    );

    expect(container.firstChild).toHaveClass('flex', 'gap-4', 'cursor-pointer');
  });
});
