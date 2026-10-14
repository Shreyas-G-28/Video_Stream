import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import App from '@/app/page';

// Mock api to return empty or standard items so tests run fast
vi.mock('@/app/utils/api', () => ({
  fetchPopularVideos: vi.fn().mockResolvedValue({ items: [], nextPageToken: undefined }),
  searchYouTubeVideos: vi.fn().mockResolvedValue({ items: [], nextPageToken: undefined }),
  fetchVideoComments: vi.fn().mockResolvedValue([]),
}));

describe('Subscriptions page creator video listing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('navigates to subscriptions view and displays empty state when no subscriptions', async () => {
    render(<App />);

    // Click Subscriptions in sidebar
    const subsButtons = screen.getAllByRole('button', { name: /subscriptions/i });
    fireEvent.click(subsButtons[0]);

    expect(screen.getByText(/no subscriptions yet/i)).toBeInTheDocument();
  });

  it('allows clicking subscriber card to filter and list videos by creator', async () => {
    render(<App />);

    // Go to home first, then play first video to subscribe
    const subsButtons = screen.getAllByRole('button', { name: /subscriptions/i });
    
    // Switch to subs view
    fireEvent.click(subsButtons[0]);
    expect(screen.getByText(/no subscriptions yet/i)).toBeInTheDocument();

    // Go back to home
    const homeButtons = screen.getAllByRole('button', { name: /home/i });
    fireEvent.click(homeButtons[0]);

    // Click on a video card to open video player
    await waitFor(() => {
      const videoCards = screen.getAllByRole('img');
      expect(videoCards.length).toBeGreaterThan(0);
    });

    const firstCardTitle = screen.getAllByRole('heading', { level: 3 })[0];
    fireEvent.click(firstCardTitle);

    // In player, click subscribe
    const subscribeBtn = await screen.findByRole('button', { name: /^subscribe$/i });
    fireEvent.click(subscribeBtn);
    expect(screen.getByRole('button', { name: /^subscribed$/i })).toBeInTheDocument();

    // Reset back to Home view by clicking logo
    const youtubeLogo = screen.getByText('YouTube');
    fireEvent.click(youtubeLogo);

    // Now sidebar is visible again, click Subscriptions
    const subsBtn = screen.getAllByRole('button', { name: /subscriptions/i })[0];
    fireEvent.click(subsBtn);

    // Should see Subscriptions heading with 1 channel
    expect(screen.getByRole('heading', { level: 1, name: /subscriptions/i })).toBeInTheDocument();
    expect(screen.getByText(/1 channel/i)).toBeInTheDocument();

    // Click on the subscriber card
    const subscriberCard = screen.getByRole('button', { name: /click to view videos/i });
    fireEvent.click(subscriberCard);

    // Expect creator-specific videos heading
    expect(screen.getByRole('heading', { name: /videos by/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /show all subscriptions/i })).toBeInTheDocument();

    // Clicking "Show all subscriptions" or clicking the card again deselects
    const showAllBtn = screen.getByRole('button', { name: /show all subscriptions/i });
    fireEvent.click(showAllBtn);
    expect(screen.queryByRole('button', { name: /show all subscriptions/i })).not.toBeInTheDocument();
  });
});
