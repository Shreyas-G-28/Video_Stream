import { describe, it, expect } from 'vitest';
import { reducer, AppState, AppAction, initialState } from '@/app/context/AppContext';
import { YouTubeVideo } from '@/app/types';

const sampleVideo: YouTubeVideo = {
  id: 'v-100',
  snippet: {
    publishedAt: '2026-01-01T00:00:00Z',
    channelTitle: 'Cool Channel',
    title: 'Sample Video',
    description: 'Description',
    thumbnails: { medium: { url: 'https://example.com/thumb.jpg' } },
  },
  contentDetails: { duration: 'PT3M' },
  statistics: { viewCount: '100', likeCount: '10', commentCount: '1' },
};

describe('AppContext reducer', () => {
  it('adds a video to history and avoids duplicates at head', () => {
    const action: AppAction = { type: 'ADD_TO_HISTORY', payload: sampleVideo };
    const state1 = reducer(initialState, action);

    expect(state1.history.length).toBe(1);
    expect(state1.history[0].id).toBe('v-100');

    // Adding same video again moves it to top without duplicating
    const state2 = reducer(state1, action);
    expect(state2.history.length).toBe(1);
  });

  it('clears watch history', () => {
    const populatedState: AppState = {
      history: [sampleVideo],
      likedVideos: [],
      subscriptions: [],
    };

    const action: AppAction = { type: 'CLEAR_HISTORY' };
    const nextState = reducer(populatedState, action);

    expect(nextState.history).toEqual([]);
  });

  it('toggles liking and unliking a video', () => {
    const action: AppAction = { type: 'TOGGLE_LIKE_VIDEO', payload: sampleVideo };
    const state1 = reducer(initialState, action);
    expect(state1.likedVideos.length).toBe(1);
    expect(state1.likedVideos[0].id).toBe('v-100');

    // Toggling again removes it
    const state2 = reducer(state1, action);
    expect(state2.likedVideos.length).toBe(0);
  });

  it('removes liked video by id', () => {
    const stateWithLike: AppState = {
      history: [],
      likedVideos: [sampleVideo],
      subscriptions: [],
    };

    const nextState = reducer(stateWithLike, { type: 'REMOVE_LIKED_VIDEO', payload: 'v-100' });
    expect(nextState.likedVideos.length).toBe(0);
  });

  it('toggles channel subscription', () => {
    const sub = {
      channelId: 'channel-1',
      channelTitle: 'Cool Channel',
      avatar: 'https://example.com/avatar.png',
      subscribedAt: '2026-01-01',
    };

    const state1 = reducer(initialState, { type: 'TOGGLE_SUBSCRIPTION', payload: sub });
    expect(state1.subscriptions.length).toBe(1);
    expect(state1.subscriptions[0].channelId).toBe('channel-1');

    // Toggle again unsubscribes
    const state2 = reducer(state1, { type: 'TOGGLE_SUBSCRIPTION', payload: sub });
    expect(state2.subscriptions.length).toBe(0);
  });

  it('unsubscribes by channel id', () => {
    const populated: AppState = {
      history: [],
      likedVideos: [],
      subscriptions: [{
        channelId: 'channel-1',
        channelTitle: 'Cool Channel',
        subscribedAt: '2026-01-01',
      }],
    };

    const nextState = reducer(populated, { type: 'UNSUBSCRIBE', payload: 'channel-1' });
    expect(nextState.subscriptions.length).toBe(0);
  });
});
