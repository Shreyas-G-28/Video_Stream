"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Compass, Clock, Search, Loader2, ThumbsUp, Users, Tv } from 'lucide-react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import VideoCard from './components/VideoCard';
import VideoPlayer from './components/VideoPlayer';
import { AppProvider, useAppContext } from './context/AppContext';
import { YouTubeVideo } from './types';
import { fetchPopularVideos, searchYouTubeVideos } from './utils/api';
import { VIDEOS, searchVideos as searchCatalogVideos } from './data/catalog';
import { useDebounce } from './hooks/useDebounce';

const MainApp: React.FC = () => {
  const [currentView, setCurrentView] = useState<string>('home'); 
  const [selectedVideo, setSelectedVideo] = useState<YouTubeVideo | null>(null);
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const [popularVideos, setPopularVideos] = useState<YouTubeVideo[]>([]);
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [nextPageToken, setNextPageToken] = useState<string | undefined>(undefined);
  const [, setMockBatchIndex] = useState<number>(1);

  const debouncedSearchQuery = useDebounce(searchQuery, 400);
  const { state, dispatch } = useAppContext();

  const observerTargetRef = useRef<HTMLDivElement | null>(null);
  const isFetchingMoreRef = useRef<boolean>(false);

  const navigateTo = useCallback((view: string, video: YouTubeVideo | null = null) => {
    if (view === 'video' && video) {
      dispatch({ type: 'ADD_TO_HISTORY', payload: video });
      setSelectedVideo(video);
    } else {
      setSelectedVideo(null);
    }
    if (view !== 'subs') {
      setSelectedChannelId(null);
    }
    setCurrentView(view);
  }, [dispatch]);

  // Load initial videos (from live YouTube API or fallback to mock catalog)
  useEffect(() => {
    let isMounted = true;
    const loadVideos = async () => {
      setLoading(true);
      const res = await fetchPopularVideos();
      if (!isMounted) return;
      
      const liveItems = res.items || [];
      if (liveItems.length > 0) {
        setPopularVideos(liveItems);
        setVideos(liveItems);
        setNextPageToken(res.nextPageToken);
      } else {
        // Fallback to local catalog
        const initialMock = VIDEOS.slice(0, 24);
        setPopularVideos(initialMock);
        setVideos(initialMock);
        setMockBatchIndex(1);
      }
      setLoading(false);
      setHasMore(true);
    };
    loadVideos();
    return () => {
      isMounted = false;
    };
  }, []);

  // Perform search whenever debounced search query changes
  useEffect(() => {
    const trimmed = debouncedSearchQuery.trim();
    if (!trimmed) {
      return;
    }

    let isMounted = true;
    const executeSearch = async () => {
      setLoading(true);

      // Attempt live YouTube Search API first
      const liveResults = await searchYouTubeVideos(trimmed);
      if (!isMounted) return;

      if (liveResults && liveResults.length > 0) {
        setVideos(liveResults);
      } else {
        // Fallback to local catalog full-text search across titles, channels, categories & tags
        const localResults = searchCatalogVideos(VIDEOS, trimmed);
        setVideos(localResults);
      }
      setLoading(false);
      setHasMore(false); // search results are fixed or bounded
    };

    executeSearch();

    return () => {
      isMounted = false;
    };
  }, [debouncedSearchQuery]);

  const appendMockVideos = useCallback(() => {
    const pageSize = 16;
    setMockBatchIndex(currentBatch => {
      const startIndex = (currentBatch * pageSize) % VIDEOS.length;
      const nextVideos = VIDEOS.slice(startIndex, startIndex + pageSize);
      const needed = pageSize - nextVideos.length;
      const wrapVideos = needed > 0 ? VIDEOS.slice(0, needed) : [];

      const combined = [...nextVideos, ...wrapVideos].map((video, idx) => ({
        ...video,
        id: `${video.id}-batch-${currentBatch}-${idx}`
      }));

      setVideos(prev => [...prev, ...combined]);
      return currentBatch + 1;
    });
  }, []);

  const loadMoreVideos = useCallback(async () => {
    if (isFetchingMoreRef.current || loadingMore || !hasMore || currentView !== 'home' || searchQuery.trim()) {
      return;
    }

    isFetchingMoreRef.current = true;
    setLoadingMore(true);

    try {
      if (nextPageToken) {
        const res = await fetchPopularVideos(nextPageToken);
        const newItems = res.items || [];
        if (newItems.length > 0) {
          setVideos(prev => {
            const existingIds = new Set(prev.map(v => v.id));
            const uniqueNew = newItems.filter((v: YouTubeVideo) => !existingIds.has(v.id));
            return [...prev, ...(uniqueNew.length > 0 ? uniqueNew : newItems)];
          });
          setNextPageToken(res.nextPageToken);
        } else {
          // If remote pagination runs out, continue seamlessly from mock catalog
          setNextPageToken(undefined);
          appendMockVideos();
        }
      } else {
        appendMockVideos();
      }
    } catch (err) {
      console.error('Error loading more videos:', err);
      appendMockVideos();
    } finally {
      setLoadingMore(false);
      isFetchingMoreRef.current = false;
    }
  }, [hasMore, loadingMore, nextPageToken, currentView, searchQuery, appendMockVideos]);

  // Infinite Scroll IntersectionObserver
  useEffect(() => {
    const currentSentinel = observerTargetRef.current;
    if (!currentSentinel || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMoreVideos();
        }
      },
      {
        rootMargin: '400px',
        threshold: 0.1,
      }
    );

    observer.observe(currentSentinel);

    return () => {
      observer.disconnect();
    };
  }, [loadMoreVideos]);

  const handleSearch = useCallback((term: string) => {
    setSearchQuery(term);
    if (!term.trim()) {
      setVideos(popularVideos.length > 0 ? popularVideos : VIDEOS.slice(0, 24));
      setHasMore(true);
    }
    if (currentView !== 'home') {
      setCurrentView('home');
      setSelectedVideo(null);
    }
  }, [currentView, popularVideos]);

  const handleResetHome = useCallback(() => {
    setSearchQuery('');
    setVideos(popularVideos.length > 0 ? popularVideos : VIDEOS.slice(0, 24));
    setHasMore(true);
    navigateTo('home');
  }, [popularVideos, navigateTo]);

  return (
    <div className="h-screen bg-[#0f0f0f] text-zinc-100 font-sans flex flex-col overflow-hidden">
      <Header
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        resetView={handleResetHome}
        onSearch={handleSearch}
        searchQuery={searchQuery}
      />

      <div className="flex flex-1 overflow-hidden">
        {currentView !== 'video' && (
          <Sidebar sidebarOpen={sidebarOpen} currentView={currentView} navigateTo={navigateTo} />
        )}

        <main className="flex-1 overflow-y-auto bg-[#0f0f0f]">
          {currentView === 'video' && selectedVideo && (
            <VideoPlayer 
              video={selectedVideo} 
              onBack={(vid: YouTubeVideo) => navigateTo('video', vid)} 
              allVideos={videos.length > 0 ? videos : VIDEOS}
            />
          )}

          {currentView === 'history' && (
            <div className="p-4 sm:p-8 max-w-[1000px] mx-auto w-full">
              <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Watch history</h1>
                {state.history.length > 0 && (
                  <button
                    onClick={() => dispatch({ type: 'CLEAR_HISTORY' })}
                    className="text-blue-400 hover:bg-blue-400/10 px-4 py-2 rounded-full font-medium transition-colors"
                  >
                    Clear all history
                  </button>
                )}
              </div>
              {state.history.length === 0 ? (
                <div className="text-center py-20 text-zinc-500">
                  <Clock size={64} className="mx-auto mb-4 opacity-20" />
                  <p className="text-lg">Your watch history is empty.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {state.history.map((video) => (
                    <VideoCard
                      key={video.id}
                      video={video}
                      onClick={(vid) => navigateTo('video', vid)}
                      isHorizontal={true}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {currentView === 'home' && (
            <div className="p-4 sm:p-6 w-full max-w-[2000px] mx-auto">
              {searchQuery.trim() && (
                <div className="flex items-center justify-between mb-6 pb-3 border-b border-zinc-800">
                  <div className="flex items-center gap-2 text-zinc-300">
                    <Search size={18} className="text-zinc-400" />
                    <span>
                      Results for <span className="text-white font-semibold">&quot;{searchQuery}&quot;</span>
                    </span>
                    {debouncedSearchQuery !== searchQuery && (
                      <span className="text-xs text-zinc-500 italic ml-2">Typing...</span>
                    )}
                  </div>
                  <button
                    onClick={() => handleSearch('')}
                    className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    Clear search
                  </button>
                </div>
              )}

              {loading ? (
                <div className="flex flex-col items-center justify-center py-28 text-zinc-400 gap-3">
                  <Loader2 className="w-8 h-8 animate-spin text-red-500" />
                  <p className="text-sm">Loading videos...</p>
                </div>
              ) : videos.length === 0 ? (
                <div className="text-center py-20 text-zinc-500">
                  <Search size={48} className="mx-auto mb-3 opacity-30" />
                  <p className="text-lg text-zinc-300">No videos found</p>
                  <p className="text-sm text-zinc-500 mt-1">Try different keywords or clear your search.</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-10">
                    {videos.map((video) => (
                      <VideoCard key={video.id} video={video} onClick={(vid) => navigateTo('video', vid)} />
                    ))}
                  </div>

                  {/* Infinite scroll sentinel and loader */}
                  {!searchQuery.trim() && hasMore && (
                    <div ref={observerTargetRef} className="py-12 flex justify-center items-center w-full">
                      {loadingMore && (
                        <div className="flex items-center gap-2 text-zinc-400 text-sm">
                          <Loader2 className="w-6 h-6 animate-spin text-red-500" />
                          <span>Loading more videos...</span>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
          
          {currentView === 'liked' && (
            <div className="p-4 sm:p-8 max-w-6xl mx-auto w-full">
              <div className="flex items-center justify-between mb-8 pb-4 border-b border-zinc-800">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-zinc-800 rounded-full">
                    <ThumbsUp size={24} className="text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold">Liked videos</h1>
                    <p className="text-zinc-400 text-sm mt-1">
                      {state.likedVideos.length} {state.likedVideos.length === 1 ? 'video' : 'videos'}
                    </p>
                  </div>
                </div>
              </div>
              {state.likedVideos.length === 0 ? (
                <div className="text-center py-20 text-zinc-500">
                  <ThumbsUp size={64} className="mx-auto mb-4 opacity-20" />
                  <p className="text-lg">No liked videos yet.</p>
                  <p className="text-sm text-zinc-500 mt-1">Videos you like will show up here.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {state.likedVideos.map((video) => (
                    <VideoCard
                      key={video.id}
                      video={video}
                      onClick={(vid) => navigateTo('video', vid)}
                      isHorizontal={true}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {currentView === 'subs' && (
            <div className="p-4 sm:p-8 max-w-6xl mx-auto w-full">
              <div className="flex items-center justify-between mb-8 pb-4 border-b border-zinc-800">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-zinc-800 rounded-full">
                    <Users size={24} className="text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold">Subscriptions</h1>
                    <p className="text-zinc-400 text-sm mt-1">
                      {state.subscriptions.length} {state.subscriptions.length === 1 ? 'channel' : 'channels'}
                    </p>
                  </div>
                </div>
              </div>

              {state.subscriptions.length === 0 ? (
                <div className="text-center py-20 text-zinc-500">
                  <Tv size={64} className="mx-auto mb-4 opacity-20" />
                  <p className="text-lg">No subscriptions yet.</p>
                  <p className="text-sm text-zinc-500 mt-1">Subscribe to channels to see them listed here.</p>
                </div>
              ) : (
                <div className="space-y-8">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {state.subscriptions.map((sub) => {
                      const isSelected = selectedChannelId === sub.channelId;
                      return (
                        <div
                          key={sub.channelId}
                          onClick={() => setSelectedChannelId(isSelected ? null : sub.channelId)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              setSelectedChannelId(isSelected ? null : sub.channelId);
                            }
                          }}
                          className={`flex items-center justify-between p-4 rounded-xl cursor-pointer transition-all border ${
                            isSelected
                              ? 'bg-zinc-800 border-white ring-1 ring-white'
                              : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/60'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <img
                              src={sub.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${sub.channelTitle}`}
                              alt={sub.channelTitle}
                              className="w-12 h-12 rounded-full bg-zinc-800 shrink-0"
                            />
                            <div className="min-w-0 text-left">
                              <h3 className="font-semibold text-white truncate text-sm sm:text-base">
                                {sub.channelTitle}
                              </h3>
                              <p className="text-xs text-zinc-400 truncate">
                                {isSelected ? 'Viewing videos • Click to deselect' : 'Click to view videos'}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (selectedChannelId === sub.channelId) {
                                setSelectedChannelId(null);
                              }
                              dispatch({ type: 'UNSUBSCRIBE', payload: sub.channelId });
                            }}
                            className="text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-1.5 rounded-full shrink-0 ml-2 transition-colors font-medium border border-zinc-700 hover:text-white"
                          >
                            Unsubscribe
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  {/* Show creator videos if a channel is selected, else show all subscription feed */}
                  {(() => {
                    if (selectedChannelId) {
                      const selectedSub = state.subscriptions.find((s) => s.channelId === selectedChannelId);
                      const creatorVideos = VIDEOS.filter((v) =>
                        (v.snippet.channelId && v.snippet.channelId === selectedChannelId) ||
                        (selectedSub && v.snippet.channelTitle.toLowerCase() === selectedSub.channelTitle.toLowerCase())
                      );

                      return (
                        <div className="mt-8 pt-6 border-t border-zinc-800">
                          <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold">
                              Videos by <span className="text-blue-400">{selectedSub?.channelTitle}</span>
                              <span className="text-sm font-normal text-zinc-400 ml-2">
                                ({creatorVideos.length} {creatorVideos.length === 1 ? 'video' : 'videos'})
                              </span>
                            </h2>
                            <button
                              onClick={() => setSelectedChannelId(null)}
                              className="text-xs text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 rounded-full transition-colors"
                            >
                              Show all subscriptions
                            </button>
                          </div>

                          {creatorVideos.length === 0 ? (
                            <div className="text-center py-12 text-zinc-500">
                              <p className="text-base text-zinc-400">No videos found for this creator in the catalog.</p>
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-10">
                              {creatorVideos.map((video) => (
                                <VideoCard
                                  key={video.id}
                                  video={video}
                                  onClick={(vid) => navigateTo('video', vid)}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    }

                    const subscribedIds = new Set(state.subscriptions.map((s) => s.channelId));
                    const subscribedVideos = VIDEOS.filter((v) =>
                      subscribedIds.has(v.snippet.channelId || v.snippet.channelTitle)
                    );
                    if (subscribedVideos.length === 0) return null;
                    return (
                      <div className="mt-8 pt-6 border-t border-zinc-800">
                        <h2 className="text-xl font-bold mb-4">Latest from your subscriptions</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-10">
                          {subscribedVideos.map((video) => (
                            <VideoCard
                              key={video.id}
                              video={video}
                              onClick={(vid) => navigateTo('video', vid)}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          )}

          {currentView === 'shorts' && (
            <div className="flex flex-col items-center justify-center h-full text-zinc-500 py-20">
              <Compass size={48} className="opacity-20 mb-4" />
              <p>This view is under construction.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainApp />
    </AppProvider>
  );
}